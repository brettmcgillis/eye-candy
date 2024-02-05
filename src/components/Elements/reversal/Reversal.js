import React from 'react';
import * as THREE from 'three';

import { useGLTF } from '@react-three/drei';

import reversal from 'models/Reversal.glb';

export default function Reversal({
  innerColor = '#FF0000',
  innerColorEmissive = false,
  innerColorEmissiveIntensity = 0,
  outerColor = '#000000',
  outerColorEmissive = false,
  outerColorEmissiveIntensity = 0,
  ...props
}) {
  const { nodes, materials } = useGLTF(reversal);
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

useGLTF.preload('/Reversal.glb');
