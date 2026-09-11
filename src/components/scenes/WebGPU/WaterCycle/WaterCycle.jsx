import React, { memo, useState } from 'react';

import { CameraRig } from '@modules/cameraRig';

import MountainSurface from './components/MountainSurface';
import RainSystem from './components/RainSystem';
import RainTarget from './components/RainTarget';
import WaterSurface from './components/WaterSurface';
import useSceneControls from './hooks/useSceneControls';
import { MOUNTAIN_TARGET, OCEAN_TARGET } from './utils/targetGeometry';

const SURFACES = {
  [MOUNTAIN_TARGET]: MountainSurface,
  [OCEAN_TARGET]: WaterSurface,
};

function WaterCycle() {
  const config = useSceneControls();
  const [surface, setSurface] = useState(null);
  const Surface = SURFACES[config.target.mode] ?? RainTarget;

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={['#000000']} />
      <Surface config={config} onReady={setSurface} />
      {surface && <RainSystem config={config} surface={surface} />}
    </>
  );
}

export default memo(WaterCycle);
