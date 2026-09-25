import React, { memo } from 'react';
import { GiBroadsword, GiHand } from 'react-icons/gi';

import OverlayIconButton from '@app/scaffold/overlay/components/OverlayIconButton';
import SceneButtonBar from '@app/scaffold/overlay/components/SceneButtonBar';

function ButtonOverlay({ mode, onModeChange }) {
  return (
    <SceneButtonBar datasetKey="goodKnightOverlayPortal">
      <OverlayIconButton
        onClick={() => onModeChange('grab')}
        icon={GiHand}
        label="Grab and throw"
        active={mode === 'grab'}
      />
      <OverlayIconButton
        onClick={() => onModeChange('stab')}
        icon={GiBroadsword}
        label="Stab"
        active={mode === 'stab'}
      />
    </SceneButtonBar>
  );
}

export default memo(ButtonOverlay);
