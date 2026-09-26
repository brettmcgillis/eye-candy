import React, { memo } from 'react';

import useRenderScale from '@hooks/useRenderScale';
import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import Panel from './components/Panel';
import Tangle from './components/Tangle';
import useSceneControls from './hooks/useSceneControls';

function PushComesToShove() {
  const { camera, lighting, scene } = useSceneControls();
  useSceneBackdrop({ color: scene.backgroundColor });
  useRenderScale(scene.renderScale);

  return (
    <>
      <CameraRig camera={camera} />
      <LightingRig lighting={lighting} />
      <Panel config={scene} />
      <Tangle config={scene} />
    </>
  );
}

export default memo(PushComesToShove);
