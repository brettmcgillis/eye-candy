/* eslint-disable no-param-reassign */
import React, { useEffect } from 'react';

import { useGLTF } from '@react-three/drei';
import { RigidBody } from '@react-three/rapier';

import * as THREE from 'three';

import { modelFile } from '@utils/appUtils';

import SceneLabel from './SceneLabel';

export default function Slopes({ position = [-10, -1, 10] }) {
  const slopes = useGLTF(modelFile('/slopes.glb'));

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
    <group position={position}>
      <RigidBody type="fixed" colliders="trimesh" rotation={[0, Math.PI, 0]}>
        <primitive object={slopes.scene} />
      </RigidBody>
      <SceneLabel
        text="23.5 Deg"
        position={[3.5, 3, 0]}
        rotation={[0, Math.PI, 0]}
        scale={2}
      />
      <SceneLabel
        text="43.1 Deg"
        position={[0, 4.5, 0]}
        rotation={[0, Math.PI, 0]}
        scale={2}
      />
      <SceneLabel
        text="62.7 Deg"
        position={[-3.5, 7, 0]}
        rotation={[0, Math.PI, 0]}
        scale={2}
      />
    </group>
  );
}

useGLTF.preload(modelFile('/slopes.glb'));
