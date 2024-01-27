import React from 'react';
import * as THREE from 'three';

import { useGLTF } from '@react-three/drei';

import logo from 'models/Logo.glb';

export default function Logo({
  innerColorVal,
  innerColorEmissive,
  innerColorEmissiveIntensity,
  outerColorVal,
  outerColorEmissive,
  outerColorEmissiveIntensity,
  ...props
}) {
  const { nodes, materials } = useGLTF(logo);
  const innerMaterial = !innerColorVal
    ? materials['SVGMat.001']
    : new THREE.MeshStandardMaterial({
        color: innerColorEmissive ? null : innerColorVal,
        emissive: innerColorEmissive ? innerColorVal : null,
        emissiveIntensity: innerColorEmissiveIntensity,
        side: THREE.DoubleSide,
      });
  const outerMaterial = !outerColorVal
    ? materials['SVGMat.004']
    : new THREE.MeshStandardMaterial({
        color: outerColorEmissive ? null : outerColorVal,
        emissive: outerColorEmissive ? outerColorVal : null,
        emissiveIntensity: outerColorEmissiveIntensity,
        side: THREE.DoubleSide,
      });

  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['frog-in'].geometry}
        material={innerMaterial}
        position={[0.835, 0.03, 0.46]}
        scale={[10, 1.018, 10]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['frog-out'].geometry}
        material={outerMaterial}
        position={[0.835, 0, 0.46]}
        scale={[10, 1.018, 10]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['bret-in'].geometry}
        material={innerMaterial}
        position={[0.038, 0.03, 0.028]}
        scale={[10, 0.524, 10]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['bret-out'].geometry}
        material={outerMaterial}
        position={[0.045, 0, 0.099]}
        scale={[10, 0.524, 10]}
      />
    </group>
  );
}

useGLTF.preload('/Logo.glb');
