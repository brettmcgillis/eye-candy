import React, { memo, useMemo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';

import Relief from './components/Relief';
import usePiece from './hooks/usePiece';
import useSceneControls from './hooks/useSceneControls';

function SubdivisionRelief() {
  const config = useSceneControls();
  const canvas = useMemo(
    () => ({ height: config.height, width: config.width }),
    [config.height, config.width]
  );
  const piece = usePiece(config, canvas);
  useSceneBackdrop({ color: config.bgColor });

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <Relief config={config} piece={piece} />
    </>
  );
}

export default memo(SubdivisionRelief);
