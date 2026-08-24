import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function LifePreserver(props) {
  const { nodes, materials } = useGLTF(modelFile('/lifePreserver.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_4.geometry}
        material={materials['Material.001']}
        scale={[1, 0.698, 1]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('/lifePreserver.glb'));
