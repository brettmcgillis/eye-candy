import React from 'react';

import { CameraRig } from '../../../../modules/cameraRig';
import { LightingRig } from '../../../../modules/lightingRig';
import Component from './components/Component';
import useSceneControls from './hooks/useSceneControls';

// Template for a WorkInProgress/Showcase scene. Copy this folder to bootstrap
// a new scene — the three things every WIP/Showcase scene needs are already
// wired in: a presets folder, CameraRig, and MediaRecorder (see
// docs/scene-conventions.md). ToolBox/TestLab scenes are exempt and can drop
// what they don't need.
//
// LightingRig is wired in as a fourth, optional piece: it turns the named
// slots in utils/lighting.js into real lights with shadows, targets, layers
// and debug helpers. Delete it (and utils/lighting.js, and the Lighting folder
// in useSceneControls) if your scene doesn't light anything. Pass
// `onLightChange` only if something outside the rig needs a live light
// instance — a postprocess reading a shadow map, say.
//
// components/ButtonOverlay.jsx is a reference for the overlay-button pattern
// only — it is intentionally NOT wired in here. Only add it if your scene's
// spec calls for user-facing overlay controls; don't go looking for a reason
// to add one. Delete the file if you don't need it.
export default function SceneTemplate() {
  const config = useSceneControls();

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <Component config={config} />
    </>
  );
}
