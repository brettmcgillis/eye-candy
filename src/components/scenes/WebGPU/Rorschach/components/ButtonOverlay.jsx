import React, { memo } from 'react';
import { PiArrowClockwiseBold, PiDiceFiveBold } from 'react-icons/pi';

import OverlayIconButton from '@app/scaffold/overlay/components/OverlayIconButton';
import SceneButtonBar from '@app/scaffold/overlay/components/SceneButtonBar';

// Obvious, user-facing actions (docs/scene-conventions.md §13) — the reverse
// of the hidden Leva panel. Regenerate rolls a whole new test (structure,
// style, background); Reseed keeps the current art direction and only
// reshapes it.
function ButtonOverlay({ onRegenerate, onReseed }) {
  return (
    <SceneButtonBar datasetKey="rorschachOverlayPortal">
      <OverlayIconButton
        onClick={onRegenerate}
        icon={PiDiceFiveBold}
        label="Regenerate"
      />
      <OverlayIconButton
        onClick={onReseed}
        icon={PiArrowClockwiseBold}
        label="Reseed"
      />
    </SceneButtonBar>
  );
}

export default memo(ButtonOverlay);
