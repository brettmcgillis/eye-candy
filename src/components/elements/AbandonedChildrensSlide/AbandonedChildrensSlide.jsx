import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function AbandonedChildrensSlide(props) {
  const { nodes, materials } = useGLTF(
    modelFile('abandoned_childrens_slide.glb')
  );
  return (
    <group {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Plane004__0.geometry}
        material={materials['Scene_-_Root']}
        position={[-1.826, 1.499, -1.367]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.001}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object002__0.geometry}
        material={materials['Scene_-_Root']}
        position={[-1.826, 1.499, -1.367]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.001}
      />
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.Object003__0.geometry}
        material={materials['Scene_-_Root']}
        position={[-1.826, 1.499, -1.95]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={0.001}
      />
    </group>
  );
}

useGLTF.preload(modelFile('abandoned_childrens_slide.glb'));
