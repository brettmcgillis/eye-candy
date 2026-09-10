import React from 'react';

import DrawingPage from './components/DrawingPage';
import useSceneControls from './hooks/useSceneControls';

// No CameraRig, for the same reason You're Looking Radiant has none
// (docs/scene-conventions.md §10): CameraRig frames a subject with a
// perspective camera, and this is a flat drawing surface that fills the
// viewport. There is nothing here for a camera to do but get the framing wrong.
export default function AvoidantPersonalities() {
  const config = useSceneControls();

  return <DrawingPage config={config} />;
}
