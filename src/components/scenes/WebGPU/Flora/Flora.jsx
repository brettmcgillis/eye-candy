import React, { memo } from 'react';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import ButtonOverlay from './components/ButtonOverlay';
import Specimen from './components/Specimen';
import useSceneControls from './hooks/useSceneControls';

function Flora() {
  const config = useSceneControls();

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <color attach="background" args={[config.backgroundColor]} />
      <Specimen config={config} lifecycleApiRef={config.lifecycleApiRef} />
      {config.showOverlay && (
        <ButtonOverlay
          onPause={config.togglePause}
          onRegenerate={config.regenerate}
          onReseed={config.onReseed}
          onUnravel={config.onRegrow}
          paused={config.paused}
        />
      )}
    </>
  );
}

export default memo(Flora);
