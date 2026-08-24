import React, { useMemo } from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';
import bakeInstancedGeometry from '@utils/instancedGeometry';

export default function CartoonSakura(props) {
  const { nodes, materials } = useGLTF(modelFile('cartoon_sakura.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Sakura_Sakura_Material_0.geometry}
        material={materials.Sakura_Material}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.006}
      />
    </group>
  );
}

// Same mesh/material as the <mesh> above, but as a standalone geometry with
// the model's authored rotation/scale baked in — for scenes that need to
// drive it with an InstancedMesh instead of a JSX <mesh> (e.g. a particle
// swarm), which can't wrap a <group>/<mesh> transform.
export function useCartoonSakuraGeometry() {
  const { nodes, materials } = useGLTF(modelFile('cartoon_sakura.glb'));
  return useMemo(
    () => ({
      geometry: bakeInstancedGeometry(nodes.Sakura_Sakura_Material_0.geometry, [
        { rotation: [-Math.PI / 2, 0, 0], scale: 0.006 },
      ]),
      material: materials.Sakura_Material,
    }),
    [materials, nodes]
  );
}

useGLTF.preload(modelFile('cartoon_sakura.glb'));
