import { useEffect, useMemo, useRef } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

const WAVE_REST = -5;
const DEG = Math.PI / 180;

function ease(current, target, rate, delta) {
  return current + (target - current) * (1 - Math.exp(-rate * delta));
}

const lerp = (a, b, t) => a + (b - a) * t;

// A held front is a chord length: at `progress` p the outgoing sky covers
// the cap within angle (1 - p) * 180deg of the wave centre, so 0.5 splits the
// dome in two along the great circle perpendicular to the centre.
function heldFront(radius, progress) {
  return Math.max(radius * 2 * Math.cos((progress * Math.PI) / 2), WAVE_REST);
}

// A horizontal centre at `angle` puts a half-held seam upright through the
// dome; pointing it across the view runs the seam down the middle of frame.
function setHeldCentre(target, angle) {
  target.set(Math.sin(angle * DEG), 0, Math.cos(angle * DEG));
}

function targets({
  nightLightIntensity,
  nightMode,
  radius,
  transitionHold,
  transitionProgress,
}) {
  const lightOf = (night) => (night ? nightLightIntensity : 1);
  const dayOf = (night) => (night ? 0 : 1);
  if (!transitionHold) {
    return {
      day: dayOf(nightMode),
      front: WAVE_REST,
      light: lightOf(nightMode),
    };
  }
  return {
    day: lerp(dayOf(!nightMode), dayOf(nightMode), transitionProgress),
    front: heldFront(radius, transitionProgress),
    light: lerp(lightOf(!nightMode), lightOf(nightMode), transitionProgress),
  };
}

// wolf2's day/night switch is a spherical wipe, not a crossfade: a wave front
// starts past the far side of the dome and collapses toward the point the
// camera is looking at, revealing the incoming sky behind it and glowing along
// the front itself. `flip` swaps which texture is incoming so one graph serves
// both directions. `transitionHold` freezes the wipe part way, `nightMode`
// naming the incoming side.
export default function useDayNight(options) {
  const {
    nightMode,
    terrainExtent,
    transitionAngle,
    transitionHold,
    transitionRate,
    waveHeight,
    waveLength,
  } = options;
  const camera = useThree((state) => state.camera);
  const radius = terrainExtent * 0.75;
  const goal = targets({ ...options, radius });

  const frontRef = useRef(goal.front);
  const lightRef = useRef(goal.light);
  const dayRef = useRef(goal.day);
  const nightRef = useRef(nightMode);

  const uniforms = useMemo(() => {
    const centre = new THREE.Vector3(0, -0.5, -1);
    if (transitionHold) setHeldCentre(centre, transitionAngle);
    return {
      dayAmount: uniform(goal.day),
      flip: uniform(nightMode ? 1 : 0),
      lightIntensity: uniform(goal.light),
      radius: uniform(radius),
      waveCenter: uniform(centre),
      waveFront: uniform(goal.front),
      waveHeight: uniform(waveHeight),
      waveLength: uniform(waveLength),
    };
  }, []);

  useEffect(() => {
    uniforms.radius.value = radius;
    uniforms.waveHeight.value = waveHeight;
    uniforms.waveLength.value = waveLength;
  }, [radius, uniforms, waveHeight, waveLength]);

  useEffect(() => {
    if (transitionHold) {
      setHeldCentre(uniforms.waveCenter.value, transitionAngle);
    }
  }, [transitionAngle, transitionHold, uniforms]);

  useEffect(() => {
    if (nightRef.current === nightMode) return;

    nightRef.current = nightMode;
    uniforms.flip.value = nightMode ? 1 : 0;
    if (transitionHold) return;

    uniforms.waveCenter.value.copy(camera.position).normalize();
    frontRef.current = radius * 2;
  }, [camera, nightMode, radius, transitionHold, uniforms]);

  useFrame((_, delta) => {
    frontRef.current = ease(
      frontRef.current,
      goal.front,
      transitionRate,
      delta
    );
    uniforms.waveFront.value = frontRef.current;

    lightRef.current = ease(
      lightRef.current,
      goal.light,
      transitionRate,
      delta
    );
    uniforms.lightIntensity.value = lightRef.current;

    dayRef.current = ease(dayRef.current, goal.day, transitionRate, delta);
    uniforms.dayAmount.value = dayRef.current;
  });

  return uniforms;
}
