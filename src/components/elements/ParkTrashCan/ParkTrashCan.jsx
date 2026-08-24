import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function ParkTrashCan(props) {
  const { nodes, materials } = useGLTF(modelFile('parkTrashCan.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.TrashCanCap_TrashCanCap_shader_0.geometry}
        material={materials['TrashCanCap_shader.003']}
        position={[0.254, 0, 0.129]}
        scale={0.01}
      />
    </group>
  );
}

useGLTF.preload(modelFile('parkTrashCan.glb'));
