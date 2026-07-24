import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export function CardboardBox(props) {
  const { nodes, materials } = useGLTF(modelFile('/cardboard_box.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_13.geometry}
        material={materials.card}
      />
    </group>
  );
}

export function CardboardFlat(props) {
  const { nodes, materials } = useGLTF(modelFile('/cardboard_flat.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_43.geometry}
        material={materials.card}
      />
    </group>
  );
}

export function CardboardFlat2(props) {
  const { nodes, materials } = useGLTF(modelFile('/cardboard_flat2.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_25.geometry}
        material={materials.card}
      />
    </group>
  );
}

export function CardboardLeaning(props) {
  const { nodes, materials } = useGLTF(modelFile('/cardboard_leaning.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_37.geometry}
        material={materials.card}
      />
    </group>
  );
}

export function CardboardLeaning2(props) {
  const { nodes, materials } = useGLTF(modelFile('/cardboard_leaning2.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_19.geometry}
        material={materials.card}
      />
    </group>
  );
}

useGLTF.preload(modelFile('/cardboard_box.glb'));
useGLTF.preload(modelFile('/cardboard_flat.glb'));
useGLTF.preload(modelFile('/cardboard_flat2.glb'));
useGLTF.preload(modelFile('/cardboard_leaning.glb'));
useGLTF.preload(modelFile('/cardboard_leaning2.glb'));
