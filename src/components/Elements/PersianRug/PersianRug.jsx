import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function PersianRug(props) {
  const { nodes, materials } = useGLTF(modelFile('persian_rug.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Old_Persian_carpet_Old_Persian_carpet_0.geometry}
        material={materials.Old_Persian_carpet}
        position={[0, 0.106, 0]}
        scale={0.01}
      />
    </group>
  );
}

useGLTF.preload(modelFile('persian_rug.glb'));
