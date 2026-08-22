import React, { memo, useState } from 'react';

import { CameraRig } from '../../../../../modules/cameraRig';
import RainSystem from './components/RainSystem';
import RainTarget from './components/RainTarget';
import WaterSurface from './components/WaterSurface';
import useSceneControls from './hooks/useSceneControls';
import { OCEAN_TARGET } from './utils/targetGeometry';

function WaterCycle() {
  const config = useSceneControls();
  const [surface, setSurface] = useState(null);

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={['#000000']} />
      {config.target.mode === OCEAN_TARGET ? (
        <WaterSurface config={config} onReady={setSurface} />
      ) : (
        <RainTarget config={config} onReady={setSurface} />
      )}
      {surface && <RainSystem config={config} surface={surface} />}
    </>
  );
}

export default memo(WaterCycle);
