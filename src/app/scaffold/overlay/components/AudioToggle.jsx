import React from 'react';
import { FaVolumeMute, FaVolumeUp } from 'react-icons/fa';

import useSceneAudioStore from '../../../../store/useSceneAudioStore';

export default function AudioToggle() {
  const hasAudio = useSceneAudioStore((s) => s.hasAudio);
  const audioEnabled = useSceneAudioStore((s) => s.audioEnabled);
  const toggleAudio = useSceneAudioStore((s) => s.toggleAudio);

  if (!hasAudio) return null;
  const AudioIcon = audioEnabled ? FaVolumeUp : FaVolumeMute;
  const tooltipLabel = audioEnabled ? 'Mute audio' : 'Unmute audio';

  return (
    <div
      className="bottom-center overlay-panel"
      style={{
        cursor: 'crosshair',
      }}
    >
      <button
        type="button"
        onClick={toggleAudio}
        title={tooltipLabel}
        aria-label={tooltipLabel}
        aria-pressed={audioEnabled}
        style={{
          cursor: 'crosshair',
          background: 'transparent',
          border: 0,
          padding: 0,
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AudioIcon />
      </button>
    </div>
  );
}
