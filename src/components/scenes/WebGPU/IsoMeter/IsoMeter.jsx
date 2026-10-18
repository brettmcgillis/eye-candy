import React, { memo } from 'react';

import { CameraRig } from '@modules/cameraRig';

import Block from './components/Block';
import VoxelWinterkammer from './components/VoxelWinterkammer';
import Winterkammer from './components/Winterkammer';
import useFlatOutput from './hooks/useFlatOutput';
import useSceneControls from './hooks/useSceneControls';

function WinterkammerView({ config }) {
  return config.view === 'voxel' ? (
    <VoxelWinterkammer config={config} />
  ) : (
    <Winterkammer config={config} />
  );
}

function IsoMeter() {
  const config = useSceneControls();
  useFlatOutput();

  return (
    <>
      <CameraRig camera={config.camera} />
      {config.piece === 'winterkammer' ? (
        <WinterkammerView config={config} />
      ) : (
        <Block config={config} />
      )}
    </>
  );
}

export default memo(IsoMeter);
