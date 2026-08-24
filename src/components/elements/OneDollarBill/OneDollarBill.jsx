import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function OneDollarBill(props) {
  const { nodes, materials } = useGLTF(modelFile('OneDollarBill.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane001_Dollar_Bill_Texture_0.geometry}
        material={materials.Dollar_Bill_Texture}
        rotation={[-Math.PI / 2, 0, -Math.PI]}
        scale={[0.156, 0.066, 1]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('OneDollarBill.glb'));
