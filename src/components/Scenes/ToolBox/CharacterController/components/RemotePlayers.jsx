import React, { useEffect, useRef, useState } from 'react';

import { useFrame, useThree } from '@react-three/fiber';
import { CapsuleCollider, RigidBody } from '@react-three/rapier';

import CapsuleCharacter from './CapsuleCharacter';
import ExampleCharacterModel from './ExampleCharacterModel';
import GhostCharacter from './GhostCharacter';
import SealCharacter from './SealCharacter';

const MODEL_COMPONENTS = {
  capsule: CapsuleCharacter,
  seal: SealCharacter,
  ghost: GhostCharacter,
  'example character': ExampleCharacterModel,
};

function RemotePlayerBody({ player, CharacterComponent }) {
  const rbRef = useRef();
  const posRef = useRef(player.interpolatedPosition || player.position);
  posRef.current = player.interpolatedPosition || player.position;
  const [colliderReady, setColliderReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setColliderReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  const initPos = player.interpolatedPosition || player.position;

  useFrame(() => {
    if (!rbRef.current) return;
    const p = posRef.current;
    rbRef.current.setNextKinematicTranslation({ x: p.x, y: p.y, z: p.z });
  });

  return (
    <RigidBody
      ref={rbRef}
      type="kinematicPosition"
      colliders={false}
      position={[initPos.x, initPos.y, initPos.z]}
    >
      {colliderReady && <CapsuleCollider args={[0.35, 0.3]} />}
      <group rotation={[0, player.rotation || 0, 0]}>
        <CharacterComponent color={player.color} curAnimation={player.curAnimation} />
      </group>
    </RigidBody>
  );
}

export default function RemotePlayers({ remotePlayers }) {
  const { gl } = useThree();
  const isWebGPU = gl?.isWebGPURenderer === true;

  const getCharacterComponent = (model) => {
    const key = model?.toLowerCase() || 'capsule';
    if (key === 'ghost' && !isWebGPU) return MODEL_COMPONENTS.capsule;
    return MODEL_COMPONENTS[key] || MODEL_COMPONENTS.capsule;
  };

  if (!remotePlayers?.length) return null;

  return (
    <>
      {remotePlayers.map((player) => {
        if (!player.position) return null;
        return (
          <RemotePlayerBody
            key={player.id}
            player={player}
            CharacterComponent={getCharacterComponent(player.model)}
          />
        );
      })}
    </>
  );
}
