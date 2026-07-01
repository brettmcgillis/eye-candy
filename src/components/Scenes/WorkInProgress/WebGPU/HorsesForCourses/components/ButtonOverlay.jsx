import React from 'react';
import { FaMicrophoneLines, FaMicrophoneLinesSlash } from 'react-icons/fa6';
import { LuScreenShare, LuScreenShareOff } from 'react-icons/lu';

import OverlayIconButton from '../../../../../../app/scaffold/overlay/components/OverlayIconButton';
import SceneButtonBar from '../../../../../../app/scaffold/overlay/components/SceneButtonBar';

function isMobileDevice() {
  return /iP(hone|ad|od)|Android/.test(navigator.userAgent);
}

export default function ButtonOverlay({
  sourceMode,
  onMicClick,
  onScreenShareClick,
}) {
  const micActive = sourceMode === 'mic';
  const shareActive = sourceMode === 'system';
  const mobile = isMobileDevice();

  return (
    <SceneButtonBar datasetKey="horsesForCoursesOverlayPortal">
      <OverlayIconButton
        onClick={onMicClick}
        icon={micActive ? FaMicrophoneLines : FaMicrophoneLinesSlash}
        label={micActive ? 'Stop microphone' : 'Use microphone'}
        active={micActive}
      />
      {!mobile && (
        <OverlayIconButton
          onClick={onScreenShareClick}
          icon={shareActive ? LuScreenShare : LuScreenShareOff}
          label={
            shareActive ? 'Stop screenshare audio' : 'Use screenshare audio'
          }
          active={shareActive}
        />
      )}
    </SceneButtonBar>
  );
}
