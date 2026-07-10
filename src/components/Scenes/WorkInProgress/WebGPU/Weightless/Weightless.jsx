import React, { useCallback } from 'react';

import CameraRig from '../../../../rigging/CameraRig';
import ButtonOverlay from './components/ButtonOverlay';
import ParticleBird from './components/ParticleBird';
import PostEffects from './components/PostEffects';
import useSceneControls from './hooks/useSceneControls';

// Weightless — a hummingbird made of particles. The animated rig drives a
// GPU sim: particles swirl on/within the bird via curl noise, fly off the
// wing tips as they beat, and leave afterimage trails.
export default function Weightless() {
  const config = useSceneControls();

  const handleTrailsClick = useCallback(() => {
    config.setControls({ afterimageEnabled: !config.afterimageEnabled });
  }, [config]);

  return (
    <>
      <CameraRig camera={config.camera} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 2]} intensity={1.2} />
      <ParticleBird config={config} />
      <PostEffects
        enabled={config.afterimageEnabled}
        damp={config.afterimageDamp}
      />
      <ButtonOverlay
        trailsEnabled={config.afterimageEnabled}
        onTrailsClick={handleTrailsClick}
      />
    </>
  );
}
