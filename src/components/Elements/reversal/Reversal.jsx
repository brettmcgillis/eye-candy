import * as THREE from 'three';

import React, { useMemo, useState } from 'react';

import { animated, useSpring } from '@react-spring/three';
import { useGLTF } from '@react-three/drei';

export default function Reversal({
  innerColor = '#FF0000',
  innerColorEmissive = false,
  innerColorEmissiveIntensity = 0,
  outerColor = '#000000',
  outerColorEmissive = false,
  outerColorEmissiveIntensity = 0,
  ...props
}) {
  const { nodes, materials } = useGLTF(`/models/Reversal.glb`);
  const innerMaterial = !innerColor
    ? materials['SVGMat.001']
    : new THREE.MeshStandardMaterial({
        color: innerColorEmissive ? null : innerColor,
        emissive: innerColorEmissive ? innerColor : null,
        emissiveIntensity: innerColorEmissiveIntensity,
        side: THREE.DoubleSide,
      });
  const outerMaterial = !outerColor
    ? materials['SVGMat.004']
    : new THREE.MeshStandardMaterial({
        color: outerColorEmissive ? null : outerColor,
        emissive: outerColorEmissive ? outerColor : null,
        emissiveIntensity: outerColorEmissiveIntensity,
        side: THREE.DoubleSide,
      });
  return (
    <group {...props} dispose={null}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['reversal-in'].geometry}
          material={innerMaterial}
          scale={[10, 1.018, 10]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['reversal-out'].geometry}
          material={outerMaterial}
          scale={[10, 1.018, 10]}
        />
      </group>
    </group>
  );
}

export function InteractiveReversal({
  pressDepth = 0.015,
  glowIntensity = 2.5,
  ...props
}) {
  const { nodes } = useGLTF(`/models/Reversal.glb`);

  const [isOn, setIsOn] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  /* -----------------------------
     Materials
  ------------------------------ */

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

  /* -----------------------------
     Springs
  ------------------------------ */

  const { pressY, emissive } = useSpring({
    pressY: isPressed ? -pressDepth : 0,
    emissive: isOn ? glowIntensity : 0,
    config: (key) =>
      key === 'pressY'
        ? { mass: 0.6, tension: 300, friction: 14 }
        : { mass: 1, tension: 120, friction: 20 },
  });

  /* -----------------------------
     Render
  ------------------------------ */

  return (
    <group {...props} dispose={null}>
      <group rotation={[Math.PI / 2, 0, 0]}>
        {/* INNER (animated) */}
        <animated.mesh
          castShadow
          receiveShadow
          geometry={nodes['reversal-in'].geometry}
          material={innerMaterial}
          scale={[10, 1.018, 10]}
          position-y={pressY}
          onPointerDown={(e) => {
            e.stopPropagation();
            setIsPressed(true);
          }}
          onPointerUp={(e) => {
            e.stopPropagation();
            setIsPressed(false);
            setIsOn((v) => !v);
          }}
          onPointerLeave={() => setIsPressed(false)}
        >
          {/* spring drives emissive intensity */}
          <animated.meshStandardMaterial
            attach="material"
            color="#ff0000"
            emissive="#ff0000"
            emissiveIntensity={emissive}
            side={THREE.DoubleSide}
          />
        </animated.mesh>

        {/* OUTER */}
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['reversal-out'].geometry}
          material={outerMaterial}
          scale={[10, 1.018, 10]}
        />
      </group>
    </group>
  );
}

useGLTF.preload(`/models/Reversal.glb`);
