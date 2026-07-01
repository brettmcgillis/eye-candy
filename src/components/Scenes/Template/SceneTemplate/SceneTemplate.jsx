import React, { useCallback, useState } from 'react';

import CameraRig from '../../../rigging/CameraRig';
import ButtonOverlay from './components/ButtonOverlay';
import Component from './components/Component';
import useSceneControls from './hooks/useSceneControls';

// Template for a WorkInProgress/Showcase scene. Copy this folder to bootstrap
// a new scene — the four things every WIP/Showcase scene needs are already
// wired in: a presets folder, CameraRig, MediaRecorder, and the overlay
// button pattern (see docs/scene-conventions.md). ToolBox/TestLab scenes are
// exempt and can drop what they don't need.
export default function SceneTemplate() {
  const config = useSceneControls();
  const [toggled, setToggled] = useState(false);

  const handleToggleClick = useCallback(() => {
    setToggled((prev) => !prev);
  }, []);

  return (
    <>
      <CameraRig camera={config.camera} />
      <Component config={config} />
      <ButtonOverlay toggled={toggled} onToggleClick={handleToggleClick} />
    </>
  );
}
