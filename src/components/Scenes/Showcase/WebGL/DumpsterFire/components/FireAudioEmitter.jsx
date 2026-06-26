import React from 'react';

import usePositionalLoopedAudio from '../../../../../../hooks/usePositionalLoopedAudio';
import { DEFAULT_FIRE_AUDIO, FIRE_LOOP_TRACK } from '../utils/sceneData';

/**
 * Spatialized fire ambience. Rendered inside the flame's instance group so the
 * anchor inherits the same transform as the fire and the roar pans/attenuates
 * as the camera orbits. Driven by the Leva "Fire Audio" controls.
 */
export default function FireAudioEmitter({ config }) {
  const {
    volume = DEFAULT_FIRE_AUDIO.volume,
    refDistance = DEFAULT_FIRE_AUDIO.refDistance,
    rolloffFactor = DEFAULT_FIRE_AUDIO.rolloffFactor,
    maxDistance = DEFAULT_FIRE_AUDIO.maxDistance,
    offset = [
      DEFAULT_FIRE_AUDIO.offsetX,
      DEFAULT_FIRE_AUDIO.offsetY,
      DEFAULT_FIRE_AUDIO.offsetZ,
    ],
  } = config ?? {};

  const anchorRef = usePositionalLoopedAudio(FIRE_LOOP_TRACK, {
    volume,
    panner: { refDistance, rolloffFactor, maxDistance },
  });

  return <object3D ref={anchorRef} position={offset} />;
}
