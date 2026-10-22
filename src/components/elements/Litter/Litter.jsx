import React from 'react';

import useDracoGltf from '@hooks/useDracoGltf';
import { modelFile } from '@utils/appUtils';

export function Litter(props) {
  const { nodes, materials } = useDracoGltf(modelFile('/litter.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_67.geometry}
        material={materials.litter1}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_68.geometry}
        material={materials.litter2}
      />
    </group>
  );
}

export function Litter2(props) {
  const { nodes, materials } = useDracoGltf(modelFile('/litter2.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_74.geometry}
        material={materials.litter1}
      />
    </group>
  );
}

useDracoGltf.preload(modelFile('/litter.glb'));
useDracoGltf.preload(modelFile('/litter2.glb'));
