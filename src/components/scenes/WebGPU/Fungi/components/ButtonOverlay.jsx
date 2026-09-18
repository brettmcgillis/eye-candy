import React, { memo } from 'react';
import {
  PiArrowClockwiseBold,
  PiDiceFiveBold,
  PiPauseBold,
  PiPlayBold,
  PiSkullBold,
} from 'react-icons/pi';

import OverlayIconButton from '@app/scaffold/overlay/components/OverlayIconButton';
import SceneButtonBar from '@app/scaffold/overlay/components/SceneButtonBar';

// The obvious, user-facing actions (docs/scene-conventions.md §13), mirroring
// Flora's bar: Regenerate rolls a whole new fungus, Reseed keeps the art
// direction and only reshapes it, Rot plays the current one out, and Pause
// stops the clock where it stands.
function ButtonOverlay({ onPause, onRegenerate, onReseed, onRot, paused }) {
  return (
    <SceneButtonBar datasetKey="fungiOverlayPortal">
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
      <OverlayIconButton onClick={onRot} icon={PiSkullBold} label="Rot now" />
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
