import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export function CardboardBox1(props) {
  const { nodes, materials } = useGLTF(modelFile('/cardboardbox1.glb'));
  return (
    <group {...props} dispose={null} scale={0.01}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.cardboard_box_1.geometry}
        material={materials.zOther_Props_01_2}
      />
    </group>
  );
}

export function CardboardBox2(props) {
  const { nodes, materials } = useGLTF(modelFile('/cardboardbox2.glb'));
  return (
    <group {...props} dispose={null} scale={0.01}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.cardboard_box_2.geometry}
        material={materials.zOther_Props_01_2}
      />
    </group>
  );
}

export function CardboardBox3(props) {
  const { nodes, materials } = useGLTF(modelFile('/cardboardbox3.glb'));
  return (
    <group {...props} dispose={null} scale={0.01}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.cardboard_box_3.geometry}
        material={materials.zOther_Props_01_2}
      />
    </group>
  );
}

useGLTF.preload(modelFile('/cardboardbox1.glb'));
useGLTF.preload(modelFile('/cardboardbox2.glb'));
useGLTF.preload(modelFile('/cardboardbox3.glb'));
