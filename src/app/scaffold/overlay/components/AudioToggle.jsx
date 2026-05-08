import React from 'react';
import { FaVolumeMute, FaVolumeUp } from 'react-icons/fa';

import useSceneAudioStore from '../../../../store/useSceneAudioStore';

export default function AudioToggle() {
  const hasAudio = useSceneAudioStore((s) => s.hasAudio);
  const audioEnabled = useSceneAudioStore((s) => s.audioEnabled);
  const toggleAudio = useSceneAudioStore((s) => s.toggleAudio);

  if (!hasAudio) return null;
  const AudioIcon = audioEnabled ? FaVolumeUp : FaVolumeMute;
  return (
    <div
      className="bottom-center overlay-panel"
      aria-label={audioEnabled ? 'Mute audio' : 'Unmute audio'}
      style={{
        cursor: 'crosshair',
      }}
    >
      <AudioIcon onClick={toggleAudio} />
    </div>
  );
}
