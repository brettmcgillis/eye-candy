import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function Record({ sideA = true, ...props }) {
  const { nodes, materials } = useGLTF(modelFile(`Record.glb`));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes['REC33#RECTextures'].geometry}
        material={materials.RECTextures}
        rotation={[sideA ? 0 : Math.PI, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload(modelFile(`Record.glb`));
