import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function DestroyedCar(props) {
  const { nodes, materials } = useGLTF(modelFile('destroyed_car.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Box001_caprice_low_Material_u1_v1_0.geometry}
        material={materials.caprice_low_Material_u1_v1}
        position={[-0.057, 0.188, 0]}
        scale={0.025}
      />
    </group>
  );
}

useGLTF.preload(modelFile('destroyed_car.glb'));
