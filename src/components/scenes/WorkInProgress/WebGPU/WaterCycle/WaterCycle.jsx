import React, { memo, useState } from 'react';

import { CameraRig } from '../../../../../modules/cameraRig';
import RainSystem from './components/RainSystem';
import WaterSurface from './components/WaterSurface';
import useSceneControls from './hooks/useSceneControls';

function WaterCycle() {
  const config = useSceneControls();
  const [waterRuntime, setWaterRuntime] = useState(null);

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={['#000000']} />
      <WaterSurface config={config} onReady={setWaterRuntime} />
      {waterRuntime && (
        <RainSystem config={config} waterRuntime={waterRuntime} />
      )}
    </>
  );
}

export default memo(WaterCycle);
