import React from 'react';

import { useGLTF } from '@react-three/drei';

import { modelFile } from '../../../utils/appUtils';

export default function TugBoat({
  headlightMaterialRef,
  headlightColor = '#ffe8b0',
  headlightEmissiveIntensity = 3,
  ...props
}) {
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
        geometry={nodes.LowerDeck_Glass.geometry}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      >
        <meshPhysicalMaterial
          transmission={0.9}
          roughness={0.1}
          ior={1.5}
          thickness={0.5}
          color="#aaccdd"
          transparent
        />
      </mesh>
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
      <mesh
        name="UpperDeckFlag"
        castShadow
        receiveShadow
        geometry={nodes.UpperDeckFlag.geometry}
        material={materials.Deck_Mat}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      />
      <mesh
        name="UpperDeckLight"
        geometry={nodes.UpperDeckLight.geometry}
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      >
        <meshStandardMaterial
          ref={headlightMaterialRef}
          color={headlightColor}
          emissive={headlightColor}
          emissiveIntensity={headlightEmissiveIntensity}
        />
      </mesh>
    </group>
  );
}

useGLTF.preload(modelFile('/tugboat.glb'));
