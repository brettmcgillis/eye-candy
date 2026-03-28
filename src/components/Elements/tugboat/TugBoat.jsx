import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function TugBoat(props) {
  const { nodes, materials } = useGLTF(modelFile('/tugboat.glb'));
  return (
    <group {...props} dispose={null}>
      <mesh
        name="UpperDeck"
        castShadow
        receiveShadow
        geometry={nodes.UpperDeck.geometry}
        material={materials.Deck_Mat}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      />
      <mesh
        name="LowerDeck"
        castShadow
        receiveShadow
        geometry={nodes.LowerDeck.geometry}
        material={materials.Body_Mat}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      />
      <mesh
        name="LowerDeck_Glass"
        castShadow
        receiveShadow
        geometry={nodes.LowerDeck_Glass.geometry}
        material={materials.Body_Mat}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      />
      <mesh
        name="UpperDeck_Glass"
        geometry={nodes.UpperDeck_Glass.geometry}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      >
        <meshPhysicalMaterial
          transmission={0.95}
          roughness={0.05}
          ior={1.5}
          thickness={0.5}
          color="#aaccdd"
          transparent
        />
      </mesh>
    </group>
  );
}

useGLTF.preload(modelFile('/tugboat.glb'));
