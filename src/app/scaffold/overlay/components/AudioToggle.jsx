import React from 'react';
import { FaVolumeMute, FaVolumeUp } from 'react-icons/fa';

import useSceneAudioStore from '../../../../store/useSceneAudioStore';

function useAudioToggleState() {
  const hasAudio = useSceneAudioStore((s) => s.hasAudio);
  const audioEnabled = useSceneAudioStore((s) => s.audioEnabled);
  const toggleAudio = useSceneAudioStore((s) => s.toggleAudio);

  return {
    hasAudio,
    audioEnabled,
    toggleAudio,
    AudioIcon: audioEnabled ? FaVolumeUp : FaVolumeMute,
    tooltipLabel: audioEnabled ? 'Mute audio' : 'Unmute audio',
  };
}

function AudioToggleButtonInner({
  audioEnabled,
  toggleAudio,
  AudioIcon,
  tooltipLabel,
}) {
  return (
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
  );
}

export function AudioToggleButton() {
  const { hasAudio, audioEnabled, toggleAudio, AudioIcon, tooltipLabel } =
    useAudioToggleState();

  if (!hasAudio) return null;

  return (
    <AudioToggleButtonInner
      audioEnabled={audioEnabled}
      toggleAudio={toggleAudio}
      AudioIcon={AudioIcon}
      tooltipLabel={tooltipLabel}
    />
  );
}

export default function AudioToggle() {
  const { hasAudio, audioEnabled, toggleAudio, AudioIcon, tooltipLabel } =
    useAudioToggleState();

  if (!hasAudio) return null;

  return (
    <div
      className="bottom-center overlay-panel"
      style={{
        cursor: 'crosshair',
      }}
    >
      <AudioToggleButtonInner
        audioEnabled={audioEnabled}
        toggleAudio={toggleAudio}
        AudioIcon={AudioIcon}
        tooltipLabel={tooltipLabel}
      />
    </div>
  );
}
