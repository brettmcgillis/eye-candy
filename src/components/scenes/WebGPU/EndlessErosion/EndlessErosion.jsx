import React, { memo } from 'react';

import { CameraRig } from '@modules/cameraRig';

import Terrain from './components/Terrain';
import useErosionField from './hooks/useErosionField';
import useSceneControls from './hooks/useSceneControls';

function EndlessErosion() {
  const config = useSceneControls();
  const { field, uniforms } = useErosionField(config.fieldResolution);

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={['#000000']} />
      <Terrain config={config} field={field} uniforms={uniforms} />
    </>
  );
}

export default memo(EndlessErosion);
