import React, { useEffect, useMemo } from 'react';

import { useGame } from '../../../../../modules/ecctrl/Ecctrl.tsx';

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

function generateRandomColor() {
  const hue = Math.random() * 360;
  const saturation = 60 + Math.random() * 30;
  const lightness = 40 + Math.random() * 30;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export default function CapsuleCharacter({ color }) {
  const initializeAnimationSet = useGame(
    (state) => state.initializeAnimationSet
  );

  const characterColor = useMemo(() => color || generateRandomColor(), [color]);

  useEffect(() => {
    initializeAnimationSet(defaultAnimationSet);
  }, [initializeAnimationSet]);

  return (
    <>
      <mesh castShadow>
        <capsuleGeometry args={[0.3, 0.7]} />
        <meshStandardMaterial color={characterColor} />
      </mesh>
      <mesh castShadow position={[0, 0.2, 0.2]}>
        <boxGeometry args={[0.5, 0.2, 0.3]} />
        <meshStandardMaterial color={characterColor} />
      </mesh>
    </>
  );
}
