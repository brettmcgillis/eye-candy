import React, { memo } from 'react';

import { CameraRig } from '@modules/cameraRig';
import { PostRig } from '@modules/postRig';

import City from './components/City';
import useCityUniforms from './hooks/useCityUniforms';
import useSceneControls from './hooks/useSceneControls';

// An isometric city grown from the recursive quad subdivision in the reference
// sketch. The sketch is a print — flat paper, a few authored greys, near-black
// cells, a little neon — so the cards here are real geometry under a real
// orthographic camera but carry no lighting at all: tone comes from which face
// you are looking at. No LightingRig by design.
function BlockParty() {
  const config = useSceneControls();
  const uniforms = useCityUniforms(config);

  return (
    <>
      <CameraRig camera={config.camera} />
      <color attach="background" args={[config.backgroundColor]} />
      <City config={config} uniforms={uniforms} />
      <PostRig post={config.post} values={config} />
    </>
  );
}

export default memo(BlockParty);
