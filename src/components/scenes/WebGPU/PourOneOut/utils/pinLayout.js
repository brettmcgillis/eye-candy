import * as THREE from 'three';

import { GRID, MAX_PINS } from './domain';

function createRng(seed) {
  let step = 0;
  return () => {
    step += 1;
    const x = Math.sin(seed * 127.1 + step * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
}

// A pincushion: capsules on a jittered lattice across the face of a vertical
// plate, each pointing off in its own near-horizontal direction. Authored on
// the CPU so the collider uniforms and the drawn meshes are the same numbers.
export function buildPins(config) {
  const {
    pinCount,
    pinLength,
    pinRadius,
    pinSeed,
    pinSpread,
    pinTilt,
    plateY,
  } = config;

  const random = createRng(pinSeed + 1);
  const count = Math.min(MAX_PINS, Math.max(1, Math.round(pinCount)));
  const columns = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / columns);
  const center = GRID * 0.5;

  const pins = [];
  for (let i = 0; i < count; i += 1) {
    const column = i % columns;
    const row = Math.floor(i / columns);

    const origin = new THREE.Vector3(
      center + (column - (columns - 1) / 2) * pinSpread,
      plateY + ((rows - 1) / 2 - row) * pinSpread,
      center
    );
    origin.x += (random() - 0.5) * pinSpread * 0.35;
    origin.y += (random() - 0.5) * pinSpread * 0.35;
    origin.z += (random() - 0.5) * pinSpread * 0.35;

    const theta = random() * Math.PI * 2;
    const axis = new THREE.Vector3(
      Math.cos(theta),
      (random() - 0.5) * 2 * pinTilt,
      Math.sin(theta)
    ).normalize();

    const half = axis.clone().multiplyScalar(pinLength * 0.5);
    pins.push({
      a: origin.clone().sub(half),
      axis,
      b: origin.clone().add(half),
      length: pinLength,
      origin,
      radius: pinRadius,
    });
  }

  return pins;
}

export function buildPlate(config) {
  const center = GRID * 0.5;
  return {
    center: new THREE.Vector3(center, config.plateY, center),
    half: new THREE.Vector3(
      config.plateSize * 0.5,
      config.plateSize * 0.5,
      config.plateThickness * 0.5
    ),
  };
}
