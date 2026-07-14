import React, { memo } from 'react';
import { PiArrowClockwiseBold, PiPlantBold } from 'react-icons/pi';

import OverlayIconButton from '../../../../../../app/scaffold/overlay/components/OverlayIconButton';
import SceneButtonBar from '../../../../../../app/scaffold/overlay/components/SceneButtonBar';

// Obvious, user-facing actions (docs/scene-conventions.md §13.4) — the
// reverse of the hidden Leva panel: Regenerate re-seeds the CA and
// re-triggers growth from scratch; Replay Growth resets the reveal animation
// without touching topology (same structure regrows identically, since its
// baked revealTimes aren't recomputed).
function ButtonOverlay({ onRegenerate, onReplayGrowth }) {
  return (
    <SceneButtonBar datasetKey="fractalAutomataOverlayPortal">
      <OverlayIconButton
        onClick={onRegenerate}
        icon={PiArrowClockwiseBold}
        label="Regenerate"
      />
      <OverlayIconButton
        onClick={onReplayGrowth}
        icon={PiPlantBold}
        label="Replay Growth"
      />
    </SceneButtonBar>
  );
}

export default memo(ButtonOverlay);
