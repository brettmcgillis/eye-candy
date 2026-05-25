import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export function GoldFish(props) {
  const { nodes, materials } = useGLTF(modelFile('/goldfish.glb'));
  return (
    <group {...props} dispose={null}>
      <group rotation={[-Math.PI / 2, 0, 0]} scale={0.033}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <mesh
            castShadow
            receiveShadow
            geometry={nodes.fish_Material006_0.geometry}
            material={materials['Material.006']}
            position={[0, 29.917, 18.927]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={9.747}
          />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('/goldfish.glb'));
