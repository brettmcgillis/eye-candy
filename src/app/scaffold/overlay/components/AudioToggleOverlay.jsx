import React from 'react';

import { AudioToggleButton, useAudioToggleState } from './AudioToggle';
import SceneButtonBar from './SceneButtonBar';

export default function AudioToggleOverlay() {
  const { hasAudio } = useAudioToggleState();

  if (!hasAudio) return null;

  return (
    <SceneButtonBar datasetKey="audioTogglePortal">
      <AudioToggleButton />
    </SceneButtonBar>
  );
}
