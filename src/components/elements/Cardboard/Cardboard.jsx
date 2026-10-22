import React from 'react';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';

export function CardboardBox(props) {
  const { nodes, materials } = useDracoGltf(modelFile('/cardboard_box.glb'));
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
  const { nodes, materials } = useDracoGltf(modelFile('/cardboard_flat.glb'));
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
  const { nodes, materials } = useDracoGltf(modelFile('/cardboard_flat2.glb'));
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
  const { nodes, materials } = useDracoGltf(
    modelFile('/cardboard_leaning.glb')
  );
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
  const { nodes, materials } = useDracoGltf(
    modelFile('/cardboard_leaning2.glb')
  );
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

useDracoGltf.preload(modelFile('/cardboard_box.glb'));
useDracoGltf.preload(modelFile('/cardboard_flat.glb'));
useDracoGltf.preload(modelFile('/cardboard_flat2.glb'));
useDracoGltf.preload(modelFile('/cardboard_leaning.glb'));
useDracoGltf.preload(modelFile('/cardboard_leaning2.glb'));
