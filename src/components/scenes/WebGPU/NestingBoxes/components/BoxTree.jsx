import React, { memo, useEffect, useMemo, useRef } from 'react';

import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import {
  createNeutralPaletteTexture,
  createPaletteTexture,
} from '@utils/gradientPalette';

import {
  applyColorConfig,
  applySurfaceConfig,
  applyTreeConfig,
} from '../utils/applyConfig';
import {
  buildBoxMaterial,
  createBoxUniforms,
  getDrawLevel,
} from '../utils/boxMaterial';
import { randomSeed } from '../utils/boxTree';
import createMotion from '../utils/motion';
import {
  MAP_SLOTS,
  SURFACES,
  SURFACE_URLS,
  configureSurfaceTexture,
  createNeutralMaps,
} from '../utils/surfaces';
import createTreeCompute from '../utils/treeCompute';

useTexture.preload(SURFACE_URLS);

function BoxTree({ config }) {
  const meshRef = useRef(null);
  const configRef = useRef(config);
  const cycleRef = useRef(0);
  configRef.current = config;

  const loaded = useTexture(SURFACE_URLS);
  const tree = useMemo(createTreeCompute, []);
  const uniforms = useMemo(createBoxUniforms, []);
  const motion = useMemo(createMotion, []);
  const neutralMaps = useMemo(createNeutralMaps, []);
  const neutralPalette = useMemo(createNeutralPaletteTexture, []);
  const geometry = useMemo(() => new THREE.BoxGeometry(2, 2, 2), []);

  const surfaceMaps = useMemo(() => {
    const byUrl = Object.fromEntries(
      SURFACE_URLS.map((url, i) => [url, loaded[i]])
    );
    return Object.fromEntries(
      Object.entries(SURFACES).map(([name, urls]) => [
        name,
        Object.fromEntries(
          MAP_SLOTS.map((slot) => {
            const texture = urls[slot] ? byUrl[urls[slot]] : null;
            if (texture) configureSurfaceTexture(texture, slot);
            return [slot, texture ?? neutralMaps[slot]];
          })
        ),
      ])
    );
  }, [loaded, neutralMaps]);

  const box = useMemo(
    () =>
      buildBoxMaterial({
        maps: neutralMaps,
        paletteTexture: neutralPalette,
        tree,
        uniforms,
      }),
    [neutralMaps, neutralPalette, tree, uniforms]
  );

  useEffect(() => {
    box.setMaps(surfaceMaps[config.surface] ?? surfaceMaps.Plain);
  }, [box, config.surface, surfaceMaps]);

  useEffect(() => {
    const palette = createPaletteTexture(config.paletteName, {
      exact: config.paletteExact,
    });
    box.setPalette(palette ?? neutralPalette);
    return () => palette?.dispose();
  }, [box, config.paletteExact, config.paletteName, neutralPalette]);

  useEffect(
    () => () => {
      geometry.dispose();
      box.material.dispose();
      tree.kernel.dispose();
    },
    [box, geometry, tree]
  );

  useFrame((state, delta) => {
    const c = configRef.current;
    const drift = motion.drift(c, delta);

    applyTreeConfig(tree.uniforms, c, drift);
    tree.run(state.gl, c.levels);

    const progress = motion.grow(c, delta, c.growReplayRef.current);
    const cycle = motion.growCycle(c);
    if (cycle !== cycleRef.current) {
      cycleRef.current = cycle;
      if (c.growNewSeed && cycle > 0) {
        c.setControlsRef.current?.({ seed: randomSeed() });
      }
    }
    const drawLevel = getDrawLevel(progress, c.levels);
    uniforms.progress.value = progress;
    uniforms.drawLevel.value = drawLevel;
    meshRef.current.count = 2 ** drawLevel;
    applyColorConfig(uniforms.color, c, drift);
    applySurfaceConfig(uniforms.surface, c);
  });

  return (
    <mesh
      ref={meshRef}
      frustumCulled={false}
      geometry={geometry}
      material={box.material}
      castShadow
      receiveShadow
    />
  );
}

export default memo(BoxTree);
