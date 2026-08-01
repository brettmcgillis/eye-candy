import React, { memo } from 'react';

import { CameraRig } from '../../../../../modules/cameraRig';
import Swarm from './components/Swarm';
import useSceneControls from './hooks/useSceneControls';

// v1: standalone only (no browser-tab cross-talk yet — see todo.md
// "Multi-tab" section for that as a deliberate second pass). A CPU boid
// flock (boids-js) with Floids-style hunters and synchronized flash timing,
// everything rendered as plain spheres per current intent.
function Fireflies() {
  const config = useSceneControls();

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={[config.backgroundColor]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[20, 40, 20]} intensity={0.8} />
      <Swarm config={config} />
    </>
  );
}

export default memo(Fireflies);
