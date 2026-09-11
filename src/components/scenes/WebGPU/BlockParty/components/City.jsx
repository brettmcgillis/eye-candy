import React, { memo, useCallback, useEffect, useMemo } from 'react';

import * as THREE from 'three/webgpu';

import useBuildClock from '../hooks/useBuildClock';
import useCityModel from '../hooks/useCityModel';
import buildLayers from '../utils/instances';
import {
  createDarkCardMaterial,
  createGlowCardMaterial,
  createNeonMaterial,
  createPlazaMaterial,
  createStairMaterial,
  createTowerMaterial,
} from '../utils/materials';
import { createStairVariants, createTowerVariants } from '../utils/variants';
import InstancedLayer from './InstancedLayer';

function unitCard() {
  const geometry = new THREE.BoxGeometry(1, 1, 1);

  geometry.translate(0, 0.5, 0);

  return geometry;
}

function City({ config, uniforms }) {
  const buildClockRef = useBuildClock({
    buildIn: config.buildIn,
    buildSeconds: config.buildSeconds,
    resetKey: config.seed,
    uniforms,
  });

  const { cells, model } = useCityModel({
    buildClockRef,
    rebuildEnabled: config.rollingRebuild,
    rebuildSeconds: config.rebuildSeconds,
    referenceHeight: config.referenceHeight,
    seed: config.seed,
  });

  const metrics = useMemo(
    () => ({
      darkCardRise: config.darkCardRise,
      minTowerFootprint: config.minTowerFootprint,
      neonThickness: config.neonThickness,
      plazaRiseScale: config.plazaRiseScale,
      stairRiseScale: config.stairRiseScale,
      towerHeightScale: config.towerHeightScale,
    }),
    [
      config.darkCardRise,
      config.minTowerFootprint,
      config.neonThickness,
      config.plazaRiseScale,
      config.stairRiseScale,
      config.towerHeightScale,
    ]
  );

  const variants = useMemo(
    () => ({
      stairs: createStairVariants(config.stairNarrowing),
      towers: createTowerVariants(config.towerVariants),
    }),
    [config.stairNarrowing, config.towerVariants]
  );

  useEffect(
    () => () => {
      variants.towers.forEach((geometry) => geometry.dispose());
      variants.stairs.forEach((variant) => variant.geometry.dispose());
    },
    [variants]
  );

  const plazaGeometry = useMemo(unitCard, []);
  const darkGeometry = useMemo(unitCard, []);
  const glowGeometry = useMemo(unitCard, []);
  const padGeometry = useMemo(unitCard, []);

  useEffect(
    () => () => {
      plazaGeometry.dispose();
      darkGeometry.dispose();
      glowGeometry.dispose();
      padGeometry.dispose();
    },
    [darkGeometry, glowGeometry, padGeometry, plazaGeometry]
  );

  const layers = useMemo(
    () => buildLayers({ cells, metrics, variants }),
    [cells, metrics, variants]
  );

  const bind = (factory) => (buffers) => factory({ buffers, uniforms });
  const buildTower = useCallback(bind(createTowerMaterial), [uniforms]);
  const buildPlaza = useCallback(bind(createPlazaMaterial), [uniforms]);
  const buildStair = useCallback(
    (steps) => (buffers) => createStairMaterial({ buffers, steps, uniforms }),
    [uniforms]
  );
  const buildDark = useCallback(bind(createDarkCardMaterial), [uniforms]);
  const buildGlow = useCallback(bind(createGlowCardMaterial), [uniforms]);
  const buildNeon = useCallback(bind(createNeonMaterial), [uniforms]);

  const scale = config.citySize / model.rootSize;
  const viewScale = config.honorSeedZoom ? model.viewScale : 1;

  return (
    <group scale={scale * viewScale}>
      {variants.towers.map((geometry, index) => (
        <InstancedLayer
          key={geometry.uuid}
          buildMaterial={buildTower}
          geometry={geometry}
          instances={layers.towers[index]}
        />
      ))}
      {variants.stairs.map((variant, index) => (
        <InstancedLayer
          key={variant.geometry.uuid}
          buildMaterial={buildStair(variant.steps)}
          geometry={variant.geometry}
          instances={layers.stairs[index]}
        />
      ))}
      <InstancedLayer
        buildMaterial={buildPlaza}
        geometry={plazaGeometry}
        instances={layers.plazas}
      />
      <InstancedLayer
        buildMaterial={buildDark}
        geometry={darkGeometry}
        instances={layers.darkCards}
      />
      <InstancedLayer
        buildMaterial={buildGlow}
        geometry={glowGeometry}
        instances={layers.glowCards}
      />
      <InstancedLayer
        buildMaterial={buildNeon}
        geometry={padGeometry}
        hasTint
        instances={layers.neon}
      />
    </group>
  );
}

export default memo(City);
