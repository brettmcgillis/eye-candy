import React, { memo } from 'react';
import { PiToggleLeftFill, PiToggleRightFill } from 'react-icons/pi';

import OverlayIconButton from '../../../../../app/scaffold/overlay/components/OverlayIconButton';
import SceneButtonBar from '../../../../../app/scaffold/overlay/components/SceneButtonBar';

// Reference only — NOT wired into SceneTemplate.jsx by default. Only add
// overlay buttons when the scene's spec explicitly calls for obvious,
// user-facing UX buttons (as opposed to the Leva panel, which is the hidden
// dev-controls panel) — don't go looking for a reason to add one. If your
// scene doesn't need this, delete this file.
//
// The pattern: compose SceneButtonBar with one or more OverlayIconButton
// children. Give datasetKey a scene-unique value.
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
