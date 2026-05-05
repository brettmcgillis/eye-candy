import * as THREE from 'three';

import React, { useMemo, useState } from 'react';

import { animated, useSpring } from '@react-spring/three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { modelFile } from '../../../../../../utils/appUtils';
import neonFlicker from '../utils/neonFlicker';

/* -------------------------------------------------------
   LoGlow-specific interactive Bret with neon flicker
------------------------------------------------------- */

function BretBase({
  innerMaterial,
  outerMaterial,
  innerProps,
  outerProps,
  ...props
}) {
  const { nodes } = useGLTF(modelFile('Bret.glb'));

  return (
    <group {...props} dispose={null}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <animated.mesh
          castShadow
          receiveShadow
          geometry={nodes['bret-in'].geometry}
          material={innerMaterial}
          scale={[10, 0.524, 10]}
          {...innerProps}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['bret-out'].geometry}
          material={outerMaterial}
          scale={[10, 0.524, 10]}
          {...outerProps}
        />
      </group>
    </group>
  );
}

export default function InteractiveBret({
  pressDepth = 0.012,
  emissiveIntensity = 2.5,
  enableNeonFlicker = true,
  neonFlickerIntensity = 2,
  neonFlickerFrequency = 10,
  innerColor = '#ff0000',
  outerColor = '#000000',
  onClick,
  ...props
}) {
  const [isOn, setIsOn] = useState(true);
  const [isPressed, setIsPressed] = useState(false);

  const innerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: innerColor,
        emissive: innerColor,
        emissiveIntensity: 0,
        side: THREE.DoubleSide,
      }),
    [innerColor]
  );

  const outerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: outerColor,
        side: THREE.DoubleSide,
      }),
    [outerColor]
  );

  const { pressY } = useSpring({
    pressY: isPressed ? -pressDepth : 0,
    config: { mass: 0.6, tension: 320, friction: 16 },
  });

  useFrame(({ clock }) => {
    if (!innerMaterial) return;
    let intensity = 0;
    if (isOn && enableNeonFlicker) {
      intensity = neonFlicker(
        clock.getElapsedTime(),
        emissiveIntensity,
        neonFlickerIntensity,
        neonFlickerFrequency
      );
    } else if (isOn) {
      intensity = emissiveIntensity;
    }
    innerMaterial.emissiveIntensity = intensity;
  });

  const pointerHandlers = {
    onPointerDown: (e) => {
      e.stopPropagation();
      setIsPressed(true);
    },
    onPointerUp: (e) => {
      e.stopPropagation();
      setIsPressed(false);
      setIsOn((v) => !v);
      onClick?.();
    },
    onPointerLeave: () => setIsPressed(false),
  };

  return (
    <BretBase
      {...props}
      innerMaterial={innerMaterial}
      outerMaterial={outerMaterial}
      innerProps={{ 'position-y': pressY, ...pointerHandlers }}
      outerProps={pointerHandlers}
    />
  );
}
