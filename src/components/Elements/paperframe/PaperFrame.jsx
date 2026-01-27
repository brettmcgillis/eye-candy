import React from 'react';

import { useGLTF } from '@react-three/drei';

export default function PaperFrame(props) {
  const { nodes, materials } = useGLTF(`/models/FoldedFrame.glb`);
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

useGLTF.preload(`/models/FoldedFrame.glb`);
