/* eslint-disable no-param-reassign */
import React, { memo, useEffect, useMemo } from 'react';

import * as THREE from 'three/webgpu';

import useBuildClock from '../hooks/useBuildClock';
import useCityModel from '../hooks/useCityModel';
import { COMPOSITION_KEYS, FORM_KEYS, pickValues } from '../utils/configKeys';
import buildLayers from '../utils/instances';
import LAYER_SPECS from '../utils/layerSpecs';
import {
  createGroundMaterial,
  createPedestalMaterial,
} from '../utils/materials';
import Ground from './Ground';
import InstancedLayer from './InstancedLayer';
import Pedestal from './Pedestal';

const PEDESTAL_MARGIN = 4;

function unitBox(hangs) {
  const geometry = new THREE.BoxGeometry(1, 1, 1);

  geometry.translate(0, hangs ? -0.5 : 0.5, 0);

  return geometry;
}

function City({ config, uniforms }) {
  const buildClockRef = useBuildClock({
    buildIn: config.buildIn,
    buildSeconds: config.buildSeconds,
    resetKey: config.seed,
    uniforms,
  });

  const compositionKey = pickValues(config, COMPOSITION_KEYS).join('|');
  const composition = useMemo(
    () => Object.fromEntries(COMPOSITION_KEYS.map((key) => [key, config[key]])),
    [compositionKey]
  );
  const formKey = pickValues(config, FORM_KEYS).join('|');
  const metrics = useMemo(
    () => Object.fromEntries(FORM_KEYS.map((key) => [key, config[key]])),
    [formKey]
  );

  const { cells, cellsByDistrict, model } = useCityModel({
    buildClockRef,
    composition,
    rebuildEnabled: config.rollingRebuild,
    rebuildOrder: config.rebuildOrder,
    rebuildSeconds: config.rebuildSeconds,
    referenceHeight: config.referenceHeight,
    revealBand: config.revealBand,
    seed: config.seed,
  });

  const geometries = useMemo(
    () =>
      Object.fromEntries(
        LAYER_SPECS.map((spec) => [spec.key, unitBox(spec.hangs)])
      ),
    []
  );

  useEffect(
    () => () => Object.values(geometries).forEach((g) => g.dispose()),
    [geometries]
  );

  const { deepest, layers } = useMemo(
    () => buildLayers({ cells, metrics, radius: model.radius }),
    [cells, metrics, model.radius]
  );

  const surfaces = useMemo(
    () => ({
      ground: createGroundMaterial({ uniforms }),
      pedestal: createPedestalMaterial({ uniforms }),
    }),
    [uniforms]
  );

  useEffect(
    () => () => Object.values(surfaces).forEach((m) => m.dispose()),
    [surfaces]
  );

  const builders = useMemo(
    () =>
      Object.fromEntries(
        LAYER_SPECS.filter((spec) => !spec.tower).map((spec) => [
          spec.key,
          (buffers) => spec.factory({ buffers, uniforms }),
        ])
      ),
    [uniforms]
  );
  const buildTower = useMemo(
    () => (buffers) =>
      LAYER_SPECS.find((spec) => spec.tower).factory({
        blend: config.towerBlend,
        buffers,
        uniforms,
      }),
    [config.towerBlend, uniforms]
  );

  const scale =
    (config.citySize / model.rootSize) *
    (config.honorSeedZoom ? model.viewScale : 1);

  useEffect(() => {
    uniforms.worldPerPixel.value = scale;
  }, [scale, uniforms]);

  return (
    <group scale={scale}>
      <Pedestal
        depth={Math.max(config.pedestalDepth, deepest + PEDESTAL_MARGIN)}
        material={surfaces.pedestal}
        size={model.rootSize}
      />
      <Ground
        cellsByDistrict={cellsByDistrict}
        districts={model.districts}
        material={surfaces.ground}
      />
      {LAYER_SPECS.map((spec) => (
        <InstancedLayer
          key={spec.tower ? `${spec.key}-${config.towerBlend}` : spec.key}
          buildMaterial={spec.tower ? buildTower : builders[spec.key]}
          castShadow={spec.tower ? config.towerShadows : spec.castShadow}
          geometry={geometries[spec.key]}
          instances={layers[spec.key]}
          receiveShadow={spec.receiveShadow}
        />
      ))}
    </group>
  );
}

export default memo(City);
