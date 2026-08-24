import React, { useEffect } from 'react';

import BaseGhostCharacter from '@elements/WebGPU/ghost/GhostCharacter';
import { useGame } from '@modules/ecctrl';

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

export default function GhostCharacter({ color }) {
  const initializeAnimationSet = useGame(
    (state) => state.initializeAnimationSet
  );

  useEffect(() => {
    initializeAnimationSet(defaultAnimationSet);
  }, [initializeAnimationSet]);

  return (
    <BaseGhostCharacter
      color={color || '#f5f0e8'}
      eyeColor="#88ccff"
      eyeIntensity={2.25}
      groundLightIntensity={0}
    />
  );
}
