import React, { memo } from 'react';

import { CameraRig } from '@modules/cameraRig';
import { LightingRig } from '@modules/lightingRig';
import { PostRig } from '@modules/postRig';

import City from './components/City';
import useCityUniforms from './hooks/useCityUniforms';
import useFlatToneMapping from './hooks/useFlatToneMapping';
import useSceneControls from './hooks/useSceneControls';

function BlockParty() {
  const config = useSceneControls();
  const uniforms = useCityUniforms(config);

  useFlatToneMapping();

  return (
    <>
      <CameraRig camera={config.camera} />
      <LightingRig lighting={config.lighting} />
      <color attach="background" args={[config.backgroundColor]} />
      <City config={config} uniforms={uniforms} />
      <PostRig post={config.post} values={config} />
    </>
  );
}

export default memo(BlockParty);
