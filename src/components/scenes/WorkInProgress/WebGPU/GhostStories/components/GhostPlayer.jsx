import React, { memo, useEffect } from 'react';

import { useGame } from '../../../../../../modules/ecctrl/Ecctrl.tsx';
import BaseGhostCharacter from '../../../../../elements/webgpu/ghost/GhostCharacter';
import GHOST_SKINS from '../presets/skins';

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

// The playable ghost inside the Ecctrl capsule: the shared cloth-sim ghost
// element wearing the selected skin. Movement feel (cloth blown back by
// travel, jump squash) arrives through animationInputRef, driven per-frame
// by Player from the rigid body's velocity.
function GhostPlayer({ animationInputRef, config }) {
  const initializeAnimationSet = useGame(
    (state) => state.initializeAnimationSet
  );

  useEffect(() => {
    initializeAnimationSet(defaultAnimationSet);
  }, [initializeAnimationSet]);

  const skin = GHOST_SKINS[config.ghostSkin] ?? GHOST_SKINS.Hero;

  return (
    <BaseGhostCharacter
      {...skin}
      animationInputRef={animationInputRef}
      cursorCollider={false}
      groundLightColor={config.ghostGlowColor}
      groundLightIntensity={config.ghostGlowIntensity}
      outerEmissiveColor={config.ghostGlowColor}
      outerEmissiveIntensity={config.ghostEmissiveIntensity}
      segmentsX={config.clothSegments}
      segmentsY={config.clothSegments}
    />
  );
}

export default memo(GhostPlayer);
