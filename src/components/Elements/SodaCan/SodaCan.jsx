import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function SodaCan(props) {
  const { nodes, materials } = useGLTF(modelFile('soda_can.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Cylinder_0.geometry}
        material={materials['Material.001']}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[2.327, 2.327, 3.227]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('soda_can.glb'));
