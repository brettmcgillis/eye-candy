import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

function Branch(props) {
  const { nodes, materials } = useGLTF(modelFile('/tree_branch.glb'));

  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.pCylinder4_blinn1_0.geometry}
        material={materials.blinn1}
      />
    </group>
  );
}

export default React.memo(Branch);

useGLTF.preload(modelFile('/tree_branch.glb'));
