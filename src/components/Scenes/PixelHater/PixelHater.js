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
    planeHeight: { value: 1, min: 1, max: 50, step: 1 },
    planeWidth: { value: 5, min: 1, max: 50, step: 1 },
  });

  return (
    <>
      <LightingRig />
      <OrbitControls enableDamping enablePan enableRotate enableZoom />

      <Environment preset="studio" background blur={0.25} />

      <Record scale={10} position={[0, 0, -1]} rotation={[0, 0, 0]} />

      <mesh position={[0, 0, 1]}>
        <sphereGeometry args={[0.25, 32, 32]} />
        <meshBasicMaterial color="hotpink" />
      </mesh>

      <EffectComposer multisampling={0} enableNormalPass>
        <PixelMaskEffect pixelSize={pixelSize}>
          <PixelMask>
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[planeWidth, planeHeight]} />
              <meshBasicMaterial />
            </mesh>
          </PixelMask>
        </PixelMaskEffect>
      </EffectComposer>
    </>
  );
}
