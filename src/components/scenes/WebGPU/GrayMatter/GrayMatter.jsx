import React, { memo } from 'react';

import Studio from '@elements/Studio/Studio';
import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';
import { PostRig } from '@modules/postRig';

import DifferentialGrowth from './components/DifferentialGrowth';
import MazeTubes from './components/MazeTubes';
import Threads from './components/Threads';
import useSceneControls from './hooks/useSceneControls';

function GrayMatter() {
  const config = useSceneControls();

  useSceneBackdrop({
    color: config.backgroundColor,
    fogFar: config.fogFar,
    fogNear: config.fogNear,
  });

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <Studio config={config} />
      {config.form === 'RD Tubes' ? (
        <MazeTubes config={config} restartRef={config.restartRef} />
      ) : null}
      {config.form === 'Differential Growth' ? (
        <DifferentialGrowth config={config} restartRef={config.restartRef} />
      ) : null}
      {config.form === 'Threads' ? (
        <Threads config={config} restartRef={config.restartRef} />
      ) : null}
      <PostRig post={config.post} values={config} />
    </>
  );
}

export default memo(GrayMatter);
