import React, { memo } from 'react';

import { useFrame } from '@react-three/fiber';

import { writePoses } from '../utils/poseWriter';
import CreatureField from './CreatureField';

function Population({ frames, store, uniforms, visible, skinMode }) {
  useFrame(() => {
    if (visible) {
      writePoses(store, frames.current, performance.now());
    }
  });

  return (
    <group visible={visible}>
      <CreatureField skinMode={skinMode} store={store} uniforms={uniforms} />
    </group>
  );
}

export default memo(Population);
