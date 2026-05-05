import * as THREE from 'three';

import React, { useMemo, useState } from 'react';

import { animated, useSpring } from '@react-spring/three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { modelFile } from '../../../../../../utils/appUtils';
import neonFlicker from '../utils/neonFlicker';

/* -------------------------------------------------------
   LoGlow-specific interactive Reversal with neon flicker
------------------------------------------------------- */

function ReversalBase({
  innerMaterial,
  outerMaterial,
  innerProps = {},
  outerProps = {},
  ...props
}) {
  const { nodes } = useGLTF(modelFile('Reversal.glb'));
  const isJSX = (m) => React.isValidElement(m);

  return (
    <group {...props} dispose={null}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        {innerMaterial && (
          <animated.mesh
            castShadow
            receiveShadow
            geometry={nodes['reversal-in'].geometry}
            scale={[10, 1.018, 10]}
            {...innerProps}
          >
            {isJSX(innerMaterial) ? (
              innerMaterial
            ) : (
              <primitive attach="material" object={innerMaterial} />
            )}
          </animated.mesh>
        )}
        {outerMaterial && (
          <mesh
            castShadow
            receiveShadow
            geometry={nodes['reversal-out'].geometry}
            scale={[10, 1.018, 10]}
            {...outerProps}
          >
            {isJSX(outerMaterial) ? (
              outerMaterial
            ) : (
              <primitive attach="material" object={outerMaterial} />
            )}
          </mesh>
        )}
      </group>
    </group>
  );
}

export default function InteractiveReversal({
  pressDepth = 0.015,
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
    config: { mass: 0.6, tension: 300, friction: 14 },
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
      onClick?.();
      setIsPressed(true);
    },
    onPointerUp: (e) => {
      e.stopPropagation();
      setIsPressed(false);
      setIsOn((v) => !v);
    },
    onPointerLeave: () => setIsPressed(false),
  };

  return (
    <ReversalBase
      {...props}
      innerMaterial={innerMaterial}
      outerMaterial={outerMaterial}
      outerProps={pointerHandlers}
      innerProps={{ 'position-y': pressY, ...pointerHandlers }}
    />
  );
}
