import React, { memo } from 'react';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';
import { PostRig } from '@modules/postRig';

import ButtonOverlay from './components/ButtonOverlay';
import Specimen from './components/Specimen';
import useSceneControls from './hooks/useSceneControls';

function Fungi() {
  const config = useSceneControls();

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <PostRig post={config.post} values={config} />
      <color attach="background" args={[config.backgroundColor]} />
      <Specimen config={config} lifecycleApiRef={config.lifecycleApiRef} />
      {config.showOverlay && (
        <ButtonOverlay
          onPause={config.togglePause}
          onRegenerate={config.regenerate}
          onReseed={config.onReseed}
          onRot={config.onRot}
          paused={config.paused}
        />
      )}
    </>
  );
}

export default memo(Fungi);
