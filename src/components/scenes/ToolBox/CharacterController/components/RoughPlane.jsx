/* eslint-disable no-param-reassign */
import * as THREE from 'three';

import React, { useEffect } from 'react';

import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';

import { modelFile } from '../../../../../utils/appUtils';

export default function RoughPlane({ position = [10, -1.2, 10] }) {
  const roughPlane = useGLTF(modelFile('/roughPlane.glb'));

  useEffect(() => {
    roughPlane.scene.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshStandardMaterial
      ) {
        child.receiveShadow = true;
      }
    });
  }, []);

  return (
    <RigidBody type="fixed" colliders="trimesh" position={position}>
      <primitive object={roughPlane.scene} />
    </RigidBody>
  );
}

useGLTF.preload(modelFile('/roughPlane.glb'));
