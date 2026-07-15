import React, { memo } from 'react';
import {
  PiArrowClockwiseBold,
  PiPauseBold,
  PiPlantBold,
  PiPlayBold,
} from 'react-icons/pi';

import OverlayIconButton from '../../../../../../app/scaffold/overlay/components/OverlayIconButton';
import SceneButtonBar from '../../../../../../app/scaffold/overlay/components/SceneButtonBar';

// Obvious, user-facing actions (docs/scene-conventions.md §13.4) — the
// reverse of the hidden Leva panel: Regenerate re-seeds the CA and
// re-triggers growth from scratch; Replay Growth resets the reveal animation
// without touching topology (same structure regrows identically, since its
// baked revealTimes aren't recomputed); Pause/Play toggles the (Leva-only)
// `growthEnabled` control so freezing the reveal doesn't require digging
// into the control panel.
function ButtonOverlay({
  onRegenerate,
  onReplayGrowth,
  onTogglePause,
  paused,
}) {
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
      <OverlayIconButton
        onClick={onTogglePause}
        icon={paused ? PiPlayBold : PiPauseBold}
        label={paused ? 'Resume Growth' : 'Pause Growth'}
        active={paused}
      />
    </SceneButtonBar>
  );
}

export default memo(ButtonOverlay);
