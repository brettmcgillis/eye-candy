import React, { memo } from 'react';
import {
  PiArrowClockwiseBold,
  PiDiceFiveBold,
  PiPauseBold,
  PiPlayBold,
  PiWindBold,
} from 'react-icons/pi';

import OverlayIconButton from '@app/scaffold/overlay/components/OverlayIconButton';
import SceneButtonBar from '@app/scaffold/overlay/components/SceneButtonBar';

// The obvious, user-facing actions (docs/scene-conventions.md §13), mirroring
// Rorschach's bar: Regenerate rolls a whole new plant, Reseed keeps the art
// direction and only reshapes it, Unravel plays the current one out, and Pause
// stops the clock where it stands.
function ButtonOverlay({ onPause, onRegenerate, onReseed, onUnravel, paused }) {
  return (
    <SceneButtonBar datasetKey="floraOverlayPortal">
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
      <OverlayIconButton
        onClick={onUnravel}
        icon={PiWindBold}
        label="Unravel now"
      />
      <OverlayIconButton
        active={paused}
        onClick={onPause}
        icon={paused ? PiPlayBold : PiPauseBold}
        label={paused ? 'Play' : 'Pause'}
      />
    </SceneButtonBar>
  );
}

export default memo(ButtonOverlay);
