import React, { memo } from 'react';

import useSceneBackdrop from '@hooks/useSceneBackdrop';
import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';
import { PostRig } from '@modules/postRig';

import City from './components/City';
import useCityUniforms from './hooks/useCityUniforms';
import useFlatToneMapping from './hooks/useFlatToneMapping';
import useSceneControls from './hooks/useSceneControls';

function BlockParty() {
  const config = useSceneControls();
  const { colors, uniforms } = useCityUniforms(config);

  useFlatToneMapping();
  useSceneBackdrop({ color: colors.backgroundColor });

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <City config={config} uniforms={uniforms} />
      <PostRig post={config.post} values={config} />
    </>
  );
}

export default memo(BlockParty);
