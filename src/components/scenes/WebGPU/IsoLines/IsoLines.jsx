import React, { memo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { PostRig } from '@modules/postRig';

import FlatCamera from './components/FlatCamera';
import Iso from './components/Iso';
import useFlatToneMapping from './hooks/useFlatToneMapping';
import useSceneControls from './hooks/useSceneControls';

function IsoLines() {
  const config = useSceneControls();

  useFlatToneMapping();
  useSceneBackdrop({ color: config.background });

  return (
    <>
      <FlatCamera />
      <Iso config={config} />
      <PostRig post={config.post} values={config} />
    </>
  );
}

export default memo(IsoLines);
