import React, { useEffect } from 'react';

import { useGame } from '../../../../../ecctrl/stores/useGame';
import LowPolySeal from '../../../../../elements/lowPolySeal/LowPolySeal';
import GhostCharacter from '../../../../../elements/webgpu/ghost/GhostCharacter';
import ExampleCharacterModel from './ExampleCharacterModel';

// Placeholder capsule — replace with Ghost character when bringing in Ghost
const animationSet = {
  idle: 'idle',
  walk: 'walk',
  run: 'run',
  jump: 'jump',
  jumpIdle: 'jumpIdle',
  jumpLand: 'jumpLand',
  fall: 'fall',
  action1: 'action1',
  action2: 'action2',
  action3: 'action3',
  action4: 'action4',
};

export default function CharacterModel({ variant = 'Capsule' }) {
  const initializeAnimationSet = useGame(
    (state) => state.initializeAnimationSet
  );

  useEffect(() => {
    if (variant === 'Example Character') return;
    initializeAnimationSet(animationSet);
  }, [initializeAnimationSet, variant]);

  const selectedVariant = variant.toLowerCase();

  if (selectedVariant === 'seal') {
    return (
      <LowPolySeal
        scale={0.42}
        position={[0, -0.82, 0.15]}
        rotation={[0, Math.PI / 2, 0]}
      />
    );
  }

  if (variant === 'Example Character') {
    return <ExampleCharacterModel />;
  }

  if (selectedVariant === 'gh0st') {
    return (
      <GhostCharacter
        color="#f5f0e8"
        eyeColor="#88ccff"
        eyeIntensity={2.25}
        groundLightIntensity={0}
      />
    );
  }

  return (
    <>
      <mesh castShadow>
        <capsuleGeometry args={[0.3, 0.7]} />
        <meshStandardMaterial color="mediumpurple" />
      </mesh>
      <mesh castShadow position={[0, 0.2, 0.2]}>
        <boxGeometry args={[0.5, 0.2, 0.3]} />
        <meshStandardMaterial color="mediumpurple" />
      </mesh>
    </>
  );
}
