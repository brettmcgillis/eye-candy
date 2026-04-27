import React, { useEffect } from 'react';

import { useGame } from '../../../../../modules/ecctrl/Ecctrl.js';
import LowPolySeal from '../../../../elements/lowPolySeal/LowPolySeal';

const sealAnimationSet = {
  idle: 'sealIdle',
  walk: 'sealWalk',
  run: 'sealRun',
  jump: 'sealJump',
  jumpIdle: 'sealJumpIdle',
  jumpLand: 'sealJumpLand',
  fall: 'sealFall',
  action1: 'sealAction1',
  action2: 'sealAction2',
  action3: 'sealAction3',
  action4: 'sealAction4',
};

export default function SealCharacter() {
  const initializeAnimationSet = useGame(
    (state) => state.initializeAnimationSet
  );

  useEffect(() => {
    initializeAnimationSet(sealAnimationSet);
  }, [initializeAnimationSet]);

  return (
    <LowPolySeal
      scale={0.42}
      position={[0, -0.82, 0.15]}
      rotation={[0, Math.PI / 2, 0]}
    />
  );
}
