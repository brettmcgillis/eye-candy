import React from 'react';
import { FaVolumeMute, FaVolumeUp } from 'react-icons/fa';

import useSceneAudioStore from '@store/useSceneAudioStore';

import OverlayIconButton from './OverlayIconButton';

export function useAudioToggleState() {
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

export function AudioToggleButton() {
  const { hasAudio, audioEnabled, toggleAudio, AudioIcon, tooltipLabel } =
    useAudioToggleState();

  if (!hasAudio) return null;

  return (
    <OverlayIconButton
      onClick={toggleAudio}
      icon={AudioIcon}
      label={tooltipLabel}
      active={audioEnabled}
    />
  );
}
