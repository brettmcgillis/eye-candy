import React from 'react';

import RadiantField from './components/RadiantField';
import useSceneControls from './hooks/useSceneControls';

// No CameraRig, for the same reason CrossTalk's radiance preset has none
// (docs/scene-conventions.md §10): CameraRig frames a subject with a
// perspective camera, and this is a flat pixel-space field that fills the
// viewport. There is nothing for a camera to do here but get the framing wrong.
export default function YoureLookingRadiant() {
  const config = useSceneControls();

  return <RadiantField config={config} />;
}
