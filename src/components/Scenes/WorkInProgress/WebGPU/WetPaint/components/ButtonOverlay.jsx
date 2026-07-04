import React, { memo } from 'react';
import { FaCamera, FaPalette, FaSprayCan, FaTimes } from 'react-icons/fa';

import { AudioToggleButton } from '../../../../../../app/scaffold/overlay/components/AudioToggle';
import OverlayIconButton from '../../../../../../app/scaffold/overlay/components/OverlayIconButton';
import SceneButtonBar from '../../../../../../app/scaffold/overlay/components/SceneButtonBar';

// Paint <-> Color Select toggle, plus photo mode (todo item 59): the camera
// button ENTERS photo mode (operator free-fly, can hidden); once inside, the
// same slot becomes the shutter (fires the actual screenshot) and an exit
// button appears. The scene-audio toggle rides along in paint mode —
// registering spray audio only sets the store's hasAudio flag; the button
// must be mounted by the scene (same as Surrender), which is why it never
// showed before (todo item 61 follow-up).
function ButtonOverlay({ mode, onModeChange, onScreenshotClick }) {
  const isPhoto = mode === 'photo';
  const isColorSelect = mode === 'colorSelect';

  return (
    <SceneButtonBar datasetKey="wetPaintOverlayPortal">
      {mode === 'paint' && <AudioToggleButton />}
      {!isPhoto && (
        <OverlayIconButton
          onClick={() => onModeChange(isColorSelect ? 'paint' : 'colorSelect')}
          icon={isColorSelect ? FaSprayCan : FaPalette}
          label={isColorSelect ? 'Back to painting' : 'Choose spray color'}
          active={isColorSelect}
        />
      )}
      <OverlayIconButton
        onClick={isPhoto ? onScreenshotClick : () => onModeChange('photo')}
        icon={FaCamera}
        label={isPhoto ? 'Take picture' : 'Photo mode'}
        active={isPhoto}
      />
      {isPhoto && (
        <OverlayIconButton
          onClick={() => onModeChange('paint')}
          icon={FaTimes}
          label="Exit photo mode"
        />
      )}
    </SceneButtonBar>
  );
}

export default memo(ButtonOverlay);
