import * as THREE from 'three';

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useFrame, useThree } from '@react-three/fiber';
import { CapsuleCollider, CuboidCollider, RigidBody } from '@react-three/rapier';

import RcCar from '../../../../elements/models/rcCar/RcCar';
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

const _carPos = new THREE.Vector3();
const _carQuat = new THREE.Quaternion();

function RemotePlayerBody({ player, CharacterComponent }) {
  const rbRef = useRef();
  const carGroupRef = useRef();
  const posRef = useRef(player.interpolatedPosition || player.position);
  posRef.current = player.interpolatedPosition || player.position;
  const rideablePosRef = useRef(player.rideablePosition);
  rideablePosRef.current = player.rideablePosition;
  const rideableRotRef = useRef(player.rideableRotation);
  rideableRotRef.current = player.rideableRotation;
  const [colliderReady, setColliderReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setColliderReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  const initPos = player.interpolatedPosition || player.position;

  useFrame(() => {
    if (rbRef.current) {
      const p = posRef.current;
      rbRef.current.setNextKinematicTranslation({ x: p.x, y: p.y, z: p.z });
    }
    if (carGroupRef.current) {
      const rp = rideablePosRef.current;
      const rr = rideableRotRef.current;
      if (rp) {
        carGroupRef.current.setNextKinematicTranslation({ x: rp.x, y: rp.y, z: rp.z });
      }
      if (rr) {
        carGroupRef.current.setNextKinematicRotation({ x: rr.x, y: rr.y, z: rr.z, w: rr.w });
      }
    }
  });

  const carInitPos = player.rideablePosition;

  return (
    <>
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
      {carInitPos && (
        <RigidBody
          ref={carGroupRef}
          type="kinematicPosition"
          colliders={false}
          position={[carInitPos.x, carInitPos.y, carInitPos.z]}
          userData={{ excludeEcctrlRay: true }}
        >
          <CuboidCollider args={[0.65, 0.28, 1.2]} position={[0, 0.28, 0.22]} />
          <CuboidCollider args={[0.5, 0.16, 0.85]} position={[0, -0.02, 0.22]} />
          <RcCar />
        </RigidBody>
      )}
    </>
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
