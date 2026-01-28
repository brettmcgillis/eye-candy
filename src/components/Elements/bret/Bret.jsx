import * as THREE from 'three';

import React, { useMemo, useState } from 'react';

import { animated, useSpring } from '@react-spring/three';
import { useGLTF } from '@react-three/drei';

/* -------------------------------------------------------
   Base (geometry only)
------------------------------------------------------- */

export function BretBase({
  innerMaterial,
  outerMaterial,
  innerProps,
  outerProps,
  ...props
}) {
  const { nodes } = useGLTF('/models/Bret.glb');

  return (
    <group {...props} dispose={null}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh
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

/* -------------------------------------------------------
   Generic (material driven)
------------------------------------------------------- */

export default function Bret({
  innerColor = '#FF0000',
  innerColorEmissive = false,
  innerColorEmissiveIntensity = 0,
  outerColor = '#000000',
  outerColorEmissive = false,
  outerColorEmissiveIntensity = 0,
  ...props
}) {
  const { materials } = useGLTF('/models/Bret.glb');

  const innerMaterial = useMemo(
    () =>
      !innerColor
        ? materials['SVGMat.002']
        : new THREE.MeshStandardMaterial({
            color: innerColorEmissive ? null : innerColor,
            emissive: innerColorEmissive ? innerColor : null,
            emissiveIntensity: innerColorEmissiveIntensity,
            side: THREE.DoubleSide,
          }),
    [innerColor, innerColorEmissive, innerColorEmissiveIntensity, materials]
  );

  const outerMaterial = useMemo(
    () =>
      !outerColor
        ? materials['SVGMat.003']
        : new THREE.MeshStandardMaterial({
            color: outerColorEmissive ? null : outerColor,
            emissive: outerColorEmissive ? outerColor : null,
            emissiveIntensity: outerColorEmissiveIntensity,
            side: THREE.DoubleSide,
          }),
    [outerColor, outerColorEmissive, outerColorEmissiveIntensity, materials]
  );

  return (
    <BretBase
      innerMaterial={innerMaterial}
      outerMaterial={outerMaterial}
      {...props}
    />
  );
}

/* -------------------------------------------------------
   Interactive (spring driven)
------------------------------------------------------- */

export function InteractiveBret({
  pressDepth = 0.012,
  glowIntensity = 2.5,
  onClick,
  ...props
}) {
  const [isOn, setIsOn] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const innerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ff0000',
        emissive: '#ff0000',
        emissiveIntensity: 0,
        side: THREE.DoubleSide,
      }),
    []
  );

  const outerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#000000',
        side: THREE.DoubleSide,
      }),
    []
  );

  const { pressY, emissive } = useSpring({
    pressY: isPressed ? -pressDepth : 0,
    emissive: isOn ? glowIntensity : 0,
    config: (key) =>
      key === 'pressY'
        ? { mass: 0.6, tension: 320, friction: 16 }
        : { mass: 1, tension: 140, friction: 20 },
  });

  return (
    <BretBase
      {...props}
      innerMaterial={innerMaterial}
      outerMaterial={outerMaterial}
      innerProps={{
        positionY: pressY,
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
        children: (
          <animated.meshStandardMaterial
            attach="material"
            color="#ff0000"
            emissive="#ff0000"
            emissiveIntensity={emissive}
            side={THREE.DoubleSide}
          />
        ),
      }}
      outerProps={{
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
      }}
    />
  );
}

/* ------------------------------------------------------- */

useGLTF.preload('/models/Bret.glb');
