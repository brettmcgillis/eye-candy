/* eslint-disable no-unused-vars */
import { useControls } from 'leva';
import React from 'react';

import { Environment, OrbitControls } from '@react-three/drei';
import { EffectComposer } from '@react-three/postprocessing';

import Record from 'components/elements/record/Record';
import { GridHelper } from 'components/rigging/GridHelper';
import LightingRig from 'components/rigging/LightingRig';

import PixelMask from './composed/PixelMask';
import PixelMaskEffect from './composed/PixelMaskEffectComponent';

export default function PixelHater() {
  const { pixelSize, planeHeight, planeWidth } = useControls('👾', {
    pixelSize: { value: 8, min: 1, max: 32, step: 1 },
    planeHeight: { value: 10, min: 1, max: 50, step: 1 },
    planeWidth: { value: 10, min: 1, max: 50, step: 1 },
  });
  return (
    <>
      <LightingRig />
      <OrbitControls enableDamping enablePan enableRotate enableZoom />

      <Environment
        preset="studio"
        background
        blur={0.25}
        rotation={[0, 0, 0]}
      />

      <Record scale={10} position={[0, 0, -1]} rotation={[0, 0, 0]} />

      <EffectComposer multisampling={0}>
        <PixelMaskEffect pixelSize={pixelSize}>
          <PixelMask>
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[planeWidth, planeHeight]} />
              {/* <torusKnotGeometry args={[0.7, 0.2, 128, 32]} /> */}
              <meshBasicMaterial />
            </mesh>
          </PixelMask>
        </PixelMaskEffect>
      </EffectComposer>
    </>
  );
}
