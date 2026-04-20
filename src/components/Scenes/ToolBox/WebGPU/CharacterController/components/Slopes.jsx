/* eslint-disable no-param-reassign */
import * as THREE from 'three';

import React, { useEffect } from 'react';

import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';

import Label3D from './Label3D';

export default function Slopes() {
  const slopes = useGLTF('/slopes.glb');

  useEffect(() => {
    slopes.scene.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshStandardMaterial
      ) {
        child.receiveShadow = true;
      }
    });
  }, []);

  return (
    <group position={[-10, -1, 10]}>
      <RigidBody type="fixed" colliders="trimesh" rotation={[0, Math.PI, 0]}>
        <primitive object={slopes.scene} />
      </RigidBody>
      <Label3D
        text="23.5 Deg"
        position={[3.5, 3, 0]}
        rotation={[0, Math.PI, 0]}
      />
      <Label3D
        text="43.1 Deg"
        position={[0, 4.5, 0]}
        rotation={[0, Math.PI, 0]}
      />
      <Label3D
        text="62.7 Deg"
        position={[-3.5, 7, 0]}
        rotation={[0, Math.PI, 0]}
      />
    </group>
  );
}

useGLTF.preload('/slopes.glb');
