import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function PaperFrame(props) {
  const { nodes, materials } = useGLTF(modelFile(`FoldedFrame.glb`));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Frame.geometry}
        material={materials['Material.002']}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload(modelFile(`FoldedFrame.glb`));
