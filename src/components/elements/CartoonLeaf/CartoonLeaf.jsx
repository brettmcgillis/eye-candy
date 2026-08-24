import React, { useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

export default function CartoonLeaf(props) {
  const { nodes, materials } = useGLTF(modelFile('cartoonLeaf.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_4.geometry}
        material={materials['Material.001']}
        position={[-0.486, 0.003, -0.699]}
        rotation={[-3.016, -1.037, -2.416]}
      />
    </group>
  );
}

// Same mesh/material as the <mesh> above, but as a standalone geometry with
// the model's authored position/rotation baked in — for scenes that need to
// drive it with an InstancedMesh instead of a JSX <mesh> (e.g. a particle
// swarm), which can't wrap a <group>/<mesh> transform.
export function useCartoonLeafGeometry() {
  const { nodes, materials } = useGLTF(modelFile('cartoonLeaf.glb'));
  return useMemo(
    () => ({
      geometry: bakeInstancedGeometry(nodes.Object_4.geometry, [
        {
          position: [-0.486, 0.003, -0.699],
          rotation: [-3.016, -1.037, -2.416],
        },
      ]),
      material: materials['Material.001'],
    }),
    [materials, nodes]
  );
}

useGLTF.preload(modelFile('cartoonLeaf.glb'));
