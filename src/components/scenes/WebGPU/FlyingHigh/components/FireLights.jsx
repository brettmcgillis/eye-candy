import React, { memo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { FIRE_LIGHTS, PLUMES } from '../utils/plumes';

const flicker = (t, i) =>
  1 +
  0.35 *
    (Math.sin(t * 9.1 + i * 1.7) * 0.5 +
      Math.sin(t * 15.7 + i * 2.9) * 0.3 +
      Math.sin(t * 23.3 + i * 0.6) * 0.2);

// Flickering firelight on the cowling and wing of each burning engine, in
// the plane's own space.
function FireLights({ config }) {
  const lights = useRef([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    FIRE_LIGHTS.forEach((_, i) => {
      const light = lights.current[i];
      if (light) light.intensity = config.plumeLightIntensity * flicker(t, i);
    });
  });

  if (config.plumeLightIntensity <= 0) return null;
  return FIRE_LIGHTS.map((position, i) =>
    config[PLUMES[i].key] ? (
      <pointLight
        // eslint-disable-next-line react/no-array-index-key
        key={i}
        ref={(light) => {
          lights.current[i] = light;
        }}
        color={config.plumeGlowColor}
        decay={2}
        distance={config.plumeLightDistance}
        intensity={config.plumeLightIntensity}
        position={position}
      />
    ) : null
  );
}

export default memo(FireLights);
