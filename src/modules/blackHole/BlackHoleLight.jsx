import React, { memo, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

import { BLACK_HOLE_VARIANT_LEGACY_PORT } from './constants';
import chromaticDiskColor from './diskLight';

// Reads the shared scene clock, as LegacyBlackHole does, so the hue tracks the disk.
function BlackHoleLight({ color, config, intensity, vividness }) {
  const lightRef = useRef(null);
  const scratch = useMemo(() => new THREE.Color(), []);
  const vivid = useMemo(() => new THREE.Color(), []);
  const hsl = useMemo(() => ({ h: 0, l: 0, s: 0 }), []);

  const position = config.blackHolePosition ?? { x: 0, y: 0, z: 0 };
  const chromatic =
    config.blackHoleVariant === BLACK_HOLE_VARIANT_LEGACY_PORT &&
    config.legacyDiskVariant === 'chromatic';

  useFrame((state) => {
    const light = lightRef.current;
    if (!light) return;

    if (chromatic) chromaticDiskColor(config, state.clock.elapsedTime, scratch);
    else scratch.set(color);

    // The disk averages to a near-white pastel; keep its hue, push its chroma.
    scratch.getHSL(hsl);
    vivid.setHSL(hsl.h, 1, 0.5);
    scratch.lerp(vivid, vividness);
    light.color.copy(scratch);
    light.intensity = intensity;
  });

  return (
    <pointLight
      ref={lightRef}
      decay={0}
      position={[position.x, position.y, position.z]}
    />
  );
}

export default memo(BlackHoleLight);
