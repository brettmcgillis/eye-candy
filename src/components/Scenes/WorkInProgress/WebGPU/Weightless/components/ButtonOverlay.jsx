import React, { memo } from 'react';
import { MdBlurOff, MdBlurOn } from 'react-icons/md';

import OverlayIconButton from '../../../../../../app/scaffold/overlay/components/OverlayIconButton';
import SceneButtonBar from '../../../../../../app/scaffold/overlay/components/SceneButtonBar';

// User-facing toggle for the afterimage trails.
function ButtonOverlay({ trailsEnabled, onTrailsClick }) {
  return (
    <SceneButtonBar datasetKey="weightlessOverlayPortal">
      <OverlayIconButton
        onClick={onTrailsClick}
        icon={trailsEnabled ? MdBlurOn : MdBlurOff}
        label={trailsEnabled ? 'Trails off' : 'Trails on'}
        active={trailsEnabled}
      />
    </SceneButtonBar>
  );
}

export default memo(ButtonOverlay);
