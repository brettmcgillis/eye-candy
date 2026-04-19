import { useEffect } from 'react';

import { useGame } from '../../../../../ecctrl/stores/useGame';

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

export default function CharacterModel() {
  const initializeAnimationSet = useGame(
    (state) => state.initializeAnimationSet
  );

  useEffect(() => {
    initializeAnimationSet(animationSet);
  }, []);

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
