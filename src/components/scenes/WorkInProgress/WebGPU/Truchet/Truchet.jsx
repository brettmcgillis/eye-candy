import React from 'react';

import { CameraRig } from '../../../../../modules/cameraRig';
import Backdrop from './components/Backdrop';
import TileGrid from './components/TileGrid';
import useSceneControls from './hooks/useSceneControls';

// Multi-stroke "engraved contour" Truchet-tile generator. Unlit 2D pattern —
// no LightingRig. See docs/scene-conventions.md for the required Presets /
// Camera / MediaRecorder wiring in hooks/useSceneControls.js.
export default function Truchet() {
  const config = useSceneControls();

  const planeRotationRad = (config.planeRotation * Math.PI) / 180;

  return (
    <>
      <CameraRig camera={config.camera} />
      <Backdrop bgColor={config.sceneBgColor} />
      <group rotation={[0, 0, planeRotationRad]}>
        <TileGrid config={config} />
      </group>
    </>
  );
}
