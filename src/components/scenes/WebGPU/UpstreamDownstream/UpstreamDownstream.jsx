import React, { memo } from 'react';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import StreamField from './components/StreamField';
import useSceneControls from './hooks/useSceneControls';

function UpstreamDownstream() {
  const config = useSceneControls();

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={[config.backgroundColor]} />
      <fog
        attach="fog"
        args={[config.backgroundColor, config.fogNear, config.fogFar]}
      />
      <LightingRig lighting={config.lighting} />
      <StreamField config={config} />
    </>
  );
}

export default memo(UpstreamDownstream);
