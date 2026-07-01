import React, { memo } from 'react';
import { PiToggleLeftFill, PiToggleRightFill } from 'react-icons/pi';

import OverlayIconButton from '../../../../../app/scaffold/overlay/components/OverlayIconButton';
import SceneButtonBar from '../../../../../app/scaffold/overlay/components/SceneButtonBar';

// Example of the overlay-button pattern: scenes that want obvious,
// user-facing UX buttons (as opposed to the Leva panel, which is the hidden
// dev-controls panel) compose SceneButtonBar with one or more
// OverlayIconButton children. Give datasetKey a scene-unique value.
// See src/components/scenes/WorkInProgress/WebGPU/HorsesForCourses for a
// real usage.
function ButtonOverlay({ toggled, onToggleClick }) {
  return (
    <SceneButtonBar datasetKey="sceneTemplateOverlayPortal">
      <OverlayIconButton
        onClick={onToggleClick}
        icon={toggled ? PiToggleRightFill : PiToggleLeftFill}
        label={toggled ? 'Turn off' : 'Turn on'}
        active={toggled}
      />
    </SceneButtonBar>
  );
}

export default memo(ButtonOverlay);
