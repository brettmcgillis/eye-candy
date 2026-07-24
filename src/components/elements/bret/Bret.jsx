import * as THREE from 'three';

import React, { useMemo, useState } from 'react';

import { animated, useSpring } from '@react-spring/three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

import { modelFile } from '../../../utils/appUtils';

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
  const { materials } = useGLTF(modelFile('Bret.glb'));

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
  emissiveIntensity = 2.5,
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

  useFrame(() => {
    if (!innerMaterial) return;
    innerMaterial.emissiveIntensity = isOn ? emissiveIntensity : 0;
  });

  return (
    <BretBase
      {...props}
      innerMaterial={innerMaterial}
      outerMaterial={outerMaterial}
      innerProps={{
        'position-y': pressY,
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

useGLTF.preload(modelFile('Bret.glb'));
