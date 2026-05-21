import * as THREE from 'three';

import { normalizeSplinePreset } from '../../components/elements/splineGroup/splineDefaults';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const E = (x, y, z) => new THREE.Euler(x, y, z);

const P = (x, y, z) => ({
  position: V(x, y, z),
  rotation: E(0, 0, 0),
  scale: V(1, 1, 1),
});

const POLICE_PRESENCE_FIRE = {
  splines: [
    {
      name: 'Windshield Fire',
      type: 'Fire',
      fireType: 'Classic',
      tension: 0.5,
      closed: false,
      fireWidth: 1.2,
      fireDepth: 0.8,
      fireHeight: 2.8,
      fireAnimated: true,
      fireAnimSpeed: 0.6,
      fireMagnitude: 1.5,
      fireBrightness: 1.6,
      points: [P(0.6, 1.1, -4.0), P(0.5, 1.9, -4.1), P(0.4, 2.8, -4.2)],
    },
    {
      name: 'Driver Window Fire',
      type: 'Fire',
      fireType: 'Classic',
      tension: 0.5,
      closed: false,
      fireWidth: 0.6,
      fireDepth: 0.5,
      fireHeight: 1.8,
      fireAnimated: true,
      fireAnimSpeed: 0.5,
      fireMagnitude: 1.3,
      fireBrightness: 1.4,
      points: [P(0.0, 1.0, -4.72), P(-0.2, 1.7, -4.9), P(-0.35, 2.3, -5.1)],
    },
    {
      name: 'Passenger Window Fire',
      type: 'Fire',
      fireType: 'Classic',
      tension: 0.5,
      closed: false,
      fireWidth: 0.6,
      fireDepth: 0.5,
      fireHeight: 1.8,
      fireAnimated: true,
      fireAnimSpeed: 0.55,
      fireMagnitude: 1.3,
      fireBrightness: 1.4,
      points: [P(0.0, 1.0, -3.28), P(-0.2, 1.7, -3.1), P(-0.35, 2.3, -2.9)],
    },
    {
      name: 'Hood Fire',
      type: 'Fire',
      fireType: 'Classic',
      tension: 0.5,
      closed: false,
      fireWidth: 0.9,
      fireDepth: 0.7,
      fireHeight: 1.5,
      fireAnimated: true,
      fireAnimSpeed: 0.45,
      fireMagnitude: 1.1,
      fireBrightness: 1.3,
      points: [P(1.4, 0.85, -4.0), P(1.5, 1.4, -4.0), P(1.6, 2.0, -4.0)],
    },
    {
      name: 'Roof Fire',
      type: 'Fire',
      fireType: 'Classic',
      tension: 0.5,
      closed: false,
      fireWidth: 1.0,
      fireDepth: 0.9,
      fireHeight: 2.2,
      fireAnimated: true,
      fireAnimSpeed: 0.55,
      fireMagnitude: 1.4,
      fireBrightness: 1.5,
      points: [P(-0.4, 1.25, -4.0), P(-0.6, 2.0, -4.1), P(-0.8, 2.9, -4.3)],
    },
    {
      name: 'Smoke Column',
      type: 'Smoke',
      smokeType: 'Particle',
      tension: 0.5,
      closed: false,
      particleCount: 400,
      particleSize: 70,
      particleColor: '#161616',
      opacity: 0.09,
      growth: 3.5,
      fadeExponent: 1.3,
      springK: 1.0,
      flowSpeed: 0.12,
      damping: 0.93,
      attractorStrength: 0,
      attractorRadius: 0,
      maxDrift: 4.0,
      turbulence: 0.6,
      turbulenceSpeed: 0.35,
      buoyancy: 0.8,
      rotSpeed: 0.2,
      fadeRate: 1.5,
      spawnSpread: 0.9,
      blendMode: 'Normal',
      points: [
        P(0.3, 1.8, -4.0),
        P(0.1, 3.2, -4.1),
        P(-0.2, 5.0, -4.3),
        P(-0.6, 7.5, -4.5),
        P(-1.0, 10.0, -4.8),
      ],
    },
  ],
};

POLICE_PRESENCE_FIRE.splines = POLICE_PRESENCE_FIRE.splines.map(
  normalizeSplinePreset
);

export default POLICE_PRESENCE_FIRE;
