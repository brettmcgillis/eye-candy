import { useControls } from 'leva';

import React from 'react';

import {
  AccumulativeShadows,
  Cloud,
  Clouds,
  Environment,
  RandomizedLight,
} from '@react-three/drei';

import { radians } from '../../../utils/math';
import Dumpster from '../../elements/dumpster/Dumpster';
import CameraRig from '../../rigging/CameraRig';
import { GridHelper } from '../../rigging/GridHelper';
import LightingRig from '../../rigging/LightingRig';

export default function DumpsterFire() {
  const { rightLidRotation, leftLidRotation } = useControls(
    'Dumpster Fire',
    {
      rightLidRotation: {
        label: 'Right Lid',
        value: 1,
        min: 0,
        max: 1,
        step: 0.01,
      },
      leftLidRotation: {
        label: 'Left Lid',
        value: 0,
        min: 0,
        max: 1,
        step: 0.01,
      },
    },
    { collapsed: true }
  );

  const interpolate = (a) => radians(256 + 265 * a);

  return (
    <>
      <CameraRig />
      <LightingRig />
      <GridHelper x y z />
      <AccumulativeShadows
        temporal
        frames={200}
        color="purple"
        colorBlend={0.5}
        opacity={1}
        scale={10}
        alphaTest={0.85}
      >
        <RandomizedLight
          amount={8}
          radius={5}
          ambient={0.5}
          position={[5, 3, 2]}
          bias={0.001}
        />
      </AccumulativeShadows>

      <Clouds>
        <Cloud />
      </Clouds>

      <Dumpster
        rightLidRotation={-interpolate(rightLidRotation)}
        leftLidRotation={-interpolate(leftLidRotation)}
      />

      <Environment preset="city" background blur={1} />
    </>
  );
}
