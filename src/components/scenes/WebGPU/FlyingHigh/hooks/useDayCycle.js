import { useCallback, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three/webgpu';

import { LOOKS, blendGrade, bodies, cycleDay } from '../utils/dayCycle';
import { flightYaw } from '../utils/sky/flight';

// The live day/night state everything reads each frame: `day` (0 night, 1
// day), the sun, moon and key light in sky space (`keyWorld` in the
// scene's), how strongly the key lights and how golden it is, and, while
// the cycle runs, the grade between the two looks. With the cycle off,
// `day` is the Daylight control and nothing else is touched. The rig's fill
// lights come in through `onLightChange` and are blended here too, then
// handed back to the controls when the cycle stops.
function place(c, config) {
  Object.assign(c, bodies(c.day, config));
  c.keyWorld
    .copy(c.key)
    .applyQuaternion(
      flightYaw(
        config.planeRotXDeg,
        config.planeRotYDeg,
        config.planeRotZDeg
      ).invert()
    );
}

export default function useDayCycle(config) {
  const cycle = useRef({
    active: false,
    clock: 0,
    day: 0,
    glow: 0,
    grade: {},
    keyWorld: new THREE.Vector3(0, 1, 0),
    warm: 0,
  });
  const lights = useRef({});
  const onLightChange = useCallback((id, light) => {
    lights.current[id] = light;
  }, []);

  useFrame((_, delta) => {
    const c = cycle.current;
    const { ambient, sky } = lights.current;
    if (!config.cycleEnabled) {
      if (c.active) {
        ambient?.color.set(config.lightAmbientColor);
        if (ambient) ambient.intensity = config.lightAmbientIntensity;
        sky?.color.set(config.lightSkySkyColor);
        sky?.groundColor.set(config.lightSkyGroundColor);
        if (sky) sky.intensity = config.lightSkyIntensity;
      }
      c.active = false;
      c.clock = 0;
      c.day = config.skyDay;
      place(c, config);
      return;
    }
    c.active = true;
    c.clock += Math.min(delta, 0.1);
    c.day = cycleDay(
      c.clock,
      config.cycleHold,
      config.cycleTransition,
      config.skyDay >= 0.5
    );
    place(c, config);
    c.grade = blendGrade(c.day, c.glow);
    const n = LOOKS.night.fill;
    const d = LOOKS.day.fill;
    if (ambient) {
      ambient.color.copy(n.ambientColor).lerp(d.ambientColor, c.day);
      ambient.intensity =
        n.ambientIntensity + (d.ambientIntensity - n.ambientIntensity) * c.day;
    }
    if (sky) {
      sky.color.copy(n.sky).lerp(d.sky, c.day);
      sky.groundColor.copy(n.ground).lerp(d.ground, c.day);
      sky.intensity =
        n.skyIntensity + (d.skyIntensity - n.skyIntensity) * c.day;
    }
  }, -3);

  return { cycle, onLightChange };
}
