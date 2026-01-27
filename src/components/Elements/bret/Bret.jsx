import * as THREE from 'three';

import React from 'react';

import { useGLTF } from '@react-three/drei';

export default function Bret({
  innerColor = '#FF0000',
  innerColorEmissive = false,
  innerColorEmissiveIntensity = 0,
  outerColor = '#000000',
  outerColorEmissive = false,
  outerColorEmissiveIntensity = 0,
  ...props
}) {
  const { nodes, materials } = useGLTF(`/models/Bret.glb`);
  const innerMaterial = !innerColor
    ? materials['SVGMat.002']
    : new THREE.MeshStandardMaterial({
        color: innerColorEmissive ? null : innerColor,
        emissive: innerColorEmissive ? innerColor : null,
        emissiveIntensity: innerColorEmissiveIntensity,
        side: THREE.DoubleSide,
      });
  const outerMaterial = !outerColor
    ? materials['SVGMat.003']
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
          geometry={nodes['bret-in'].geometry}
          material={innerMaterial}
          scale={[10, 0.524, 10]}
        />
        <mesh
          castShadow
          receiveShadow
          geometry={nodes['bret-out'].geometry}
          material={outerMaterial}
          scale={[10, 0.524, 10]}
        />
      </group>
    </group>
  );
}

useGLTF.preload(`/models/Bret.glb`);
