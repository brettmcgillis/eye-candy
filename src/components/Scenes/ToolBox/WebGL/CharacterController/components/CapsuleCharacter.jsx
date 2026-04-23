import React, { useEffect } from 'react';

import { useGame } from '../../../../../ecctrl/Ecctrl.tsx';

const defaultAnimationSet = {
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

export default function CapsuleCharacter() {
  const initializeAnimationSet = useGame(
    (state) => state.initializeAnimationSet
  );

  useEffect(() => {
    initializeAnimationSet(defaultAnimationSet);
  }, [initializeAnimationSet]);

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
