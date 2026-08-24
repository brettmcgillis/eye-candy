import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '@utils/appUtils';

export default function PrayingHands(props) {
  const { nodes, materials } = useGLTF(modelFile('prayingHands.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Hand_L.geometry}
        material={nodes.Hand_L.material}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Hand_R.geometry}
        material={nodes.Hand_R.material}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  );
}

useGLTF.preload(modelFile('prayingHands.glb'));
