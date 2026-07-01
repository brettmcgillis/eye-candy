import React, { memo } from 'react';
import { FaCamera, FaPalette, FaSprayCan, FaTimes } from 'react-icons/fa';

import OverlayIconButton from '../../../../../../app/scaffold/overlay/components/OverlayIconButton';
import SceneButtonBar from '../../../../../../app/scaffold/overlay/components/SceneButtonBar';

// Paint <-> Color Select toggle, plus photo mode (todo item 59): the camera
// button ENTERS photo mode (operator free-fly, can hidden); once inside, the
// same slot becomes the shutter (fires the actual screenshot) and an exit
// button appears. The scene-audio toggle is NOT here — registering spray
// audio makes the scaffold's own AudioToggle appear (todo item 61).
function ButtonOverlay({ mode, onModeChange, onScreenshotClick }) {
  const isPhoto = mode === 'photo';
  const isColorSelect = mode === 'colorSelect';

  return (
    <SceneButtonBar datasetKey="wetPaintOverlayPortal">
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
