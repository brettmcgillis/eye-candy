import React, { memo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { FIRE_LIGHTS } from '../utils/cruiser';

// Three incommensurate wobbles and a rare gust, so no two lights pulse alike.
export const flicker = (t, i) =>
  1 +
  0.32 *
    (Math.sin(t * 9.1 + i * 1.7) * 0.5 +
      Math.sin(t * 15.7 + i * 2.9) * 0.3 +
      Math.sin(t * 23.3 + i * 0.6) * 0.2) +
  0.25 * Math.max(0, Math.sin(t * 1.3 + i * 2.1)) ** 8;

// Firelight from the cabin and engine bay. The light over the cabin casts
// the car's flickering shadow onto the ground round it.
function FireLights({ config }) {
  const lights = useRef([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < FIRE_LIGHTS.length; i += 1) {
      const light = lights.current[i];
      if (light) {
        light.intensity =
          config.fireLightIntensity * (i === 0 ? 1 : 0.45) * flicker(t, i);
        light.position.set(
          FIRE_LIGHTS[i][0] + Math.sin(t * 3.1 + i) * 0.06,
          FIRE_LIGHTS[i][1] + Math.sin(t * 4.3 + i * 2) * 0.05,
          FIRE_LIGHTS[i][2] + Math.sin(t * 2.7 + i * 3) * 0.06
        );
      }
    }
  });

  if (config.fireLightIntensity <= 0) return null;
  return FIRE_LIGHTS.map((position, i) => (
    <pointLight
      // eslint-disable-next-line react/no-array-index-key
      key={i}
      ref={(light) => {
        lights.current[i] = light;
      }}
      castShadow={i === 0 && config.fireLightShadows}
      color={config.fireLightColor}
      decay={2}
      distance={config.fireLightDistance}
      position={position}
      shadow-bias={-0.002}
      shadow-mapSize={[512, 512]}
      shadow-radius={4}
    />
  ));
}

export default memo(FireLights);
