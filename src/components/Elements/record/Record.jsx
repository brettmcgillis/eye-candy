import { useControls } from 'leva';

import React, { useRef } from 'react';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { radians } from '../../../utils/math';

export default function Record({ ...props }) {
  const { sideA, animate, speed, wobble, wobbleSpeed, wobbleAngle } =
    useControls(
      'Record',
      {
        sideA: {
          label: 'Side',
          value: true,
          options: {
            'Side A': true,
            'Side B': false,
          },
        },
        animate: { label: 'Play', value: true },
        speed: { label: 'RPM', value: 33, min: 33, max: 78, step: 1 },
        wobble: { label: 'Wobble', value: true },
        wobbleSpeed: {
          label: 'Wobble Speed',
          value: 1,
          min: 0,
          max: 10,
          step: 0.1,
        },
        wobbleAngle: {
          label: 'Wobble Angle',
          value: 5,
          min: 1,
          max: 15,
          step: 1,
        },
      },
      { collapsed: true }
    );

  const ref = useRef();
  useFrame(({ clock }) => {
    if (animate) {
      ref.current.rotation.z += (speed / 60) * 0.1;
    }
    if (wobble) {
      const degrees = Math.sin(clock.elapsedTime * wobbleSpeed) * wobbleAngle;
      ref.current.rotation.x = radians(degrees);
    }
  });
  const { nodes, materials } = useGLTF(`/models/Record.glb`);
  return (
    <group {...props} dispose={null}>
      <group ref={ref}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['REC33#RECTextures'].geometry}
          material={materials.RECTextures}
          rotation={[sideA ? 0 : Math.PI, 0, 0]}
        />
      </group>
    </group>
  );
}

useGLTF.preload(`/models/Record.glb`);
