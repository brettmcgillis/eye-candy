import React, { memo } from 'react';
import { PiArrowClockwiseBold } from 'react-icons/pi';

import OverlayIconButton from '../../../../../../app/scaffold/overlay/components/OverlayIconButton';
import SceneButtonBar from '../../../../../../app/scaffold/overlay/components/SceneButtonBar';

// Obvious, user-facing action (docs/scene-conventions.md §13) — the reverse
// of the hidden Leva panel: Regenerate re-seeds and rebuilds the test.
function ButtonOverlay({ onRegenerate }) {
  return (
    <SceneButtonBar datasetKey="rorschachOverlayPortal">
      <OverlayIconButton
        onClick={onRegenerate}
        icon={PiArrowClockwiseBold}
        label="Regenerate"
      />
    </SceneButtonBar>
  );
}

export default memo(ButtonOverlay);
