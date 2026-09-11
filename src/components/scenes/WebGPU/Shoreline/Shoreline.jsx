import React, { memo } from 'react';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import GrainField from './components/GrainField';
import useSceneControls from './hooks/useSceneControls';

function Shoreline() {
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
      <GrainField config={config} />
    </>
  );
}

export default memo(Shoreline);
