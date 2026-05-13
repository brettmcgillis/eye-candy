import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function Bucket(props) {
  const { nodes, materials } = useGLTF(modelFile('/bucket.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object_142.geometry}
        material={materials.sm30_072_PlasticBucket01A_A}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      />
    </group>
  );
}

useGLTF.preload(modelFile('/bucket.glb'));
