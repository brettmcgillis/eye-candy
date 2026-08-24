import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function BurnedPoliceCars(props) {
  const { nodes, materials } = useGLTF(modelFile('burned_police_cars.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Object004_Material_#98_0'].geometry}
        material={materials.Material_98}
        position={[0, 90.845, 0]}
        rotation={[-Math.PI / 2, 0, -2.88]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Object005_Material_#99_0'].geometry}
        material={materials.Material_99}
        position={[322.825, 64.603, -133.064]}
        rotation={[1.833, 0, -Math.PI]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('burned_police_cars.glb'));
