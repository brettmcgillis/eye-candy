import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function ShippingContainer(props) {
  const { nodes, materials } = useGLTF(modelFile('shipping_container.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.defaultMaterial.geometry}
        material={materials.BODY}
        scale={2.927}
      />
    </group>
  );
}

useGLTF.preload(modelFile('shipping_container.glb'));
