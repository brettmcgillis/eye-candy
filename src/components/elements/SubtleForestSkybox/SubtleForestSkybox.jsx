import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function SubtleForestSkybox(props) {
  const { nodes, materials } = useGLTF(modelFile('subtle_forest_skybox.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['Sphere001_Material_#26_0'].geometry}
        material={materials.Material_26}
        position={[0.008, 1.528, -0.121]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={2.54}
      />
    </group>
  );
}

useGLTF.preload(modelFile('subtle_forest_skybox.glb'));
