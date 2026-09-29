import React, { memo } from 'react';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import Bouquet from './components/Bouquet';
import ButtonOverlay from './components/ButtonOverlay';
import useSceneControls from './hooks/useSceneControls';

function Flora() {
  const config = useSceneControls();

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <color attach="background" args={[config.backgroundColor]} />
      <Bouquet config={config} lifecycleApiRef={config.lifecycleApiRef} />
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
