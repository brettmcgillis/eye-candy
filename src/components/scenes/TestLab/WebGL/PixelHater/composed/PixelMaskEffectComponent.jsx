import * as THREE from 'three';

import React, { useMemo } from 'react';

import { extend, useThree } from '@react-three/fiber';
import { SSAO } from '@react-three/postprocessing';

import MaskSceneContext from './MaskContext';
import PixelMaskEffectImpl from './PixelMaskEffect';

extend({ PixelMaskEffectImpl });

export default function PixelMaskEffect({ children, pixelSize = 8 }) {
  const { scene, camera } = useThree();

  const maskScene = useMemo(() => new THREE.Scene(), []);

  const effect = useMemo(
    () =>
      new PixelMaskEffectImpl(scene, camera, {
        pixelSize,
        maskScene,
      }),
    [scene, camera, pixelSize, maskScene]
  );

  return (
    <MaskSceneContext.Provider value={maskScene}>
      {/* SSAO with zero intensity forces depth texture allocation */}
      <SSAO intensity={0} radius={0.001} />

      <primitive object={effect} />

      {children}
    </MaskSceneContext.Provider>
  );
}
