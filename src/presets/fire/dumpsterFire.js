import * as THREE from 'three';

import { normalizeSplinePreset } from '../../components/elements/splineGroup/splineDefaults';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const E = (x, y, z) => new THREE.Euler(x, y, z);

const P = (x, y, z) => ({
  position: V(x, y, z),
  rotation: E(0, 0, 0),
  scale: V(1, 1, 1),
});

const DUMPSTER_FIRE = {
  splines: [
    {
      name: 'Dumpster Core Fire',
      type: 'Fire',
      fireType: 'Classic',
      tension: 0.5,
      closed: false,
      fireWidth: 0.9,
      fireHeight: 1.2,
      fireDepth: 0.5,
      fireMagnitude: 1.4,
      fireBrightness: 1.6,
      fireAnimated: true,
      fireAnimSpeed: 0.5,
      points: [P(-2.0, 0.5, 0.0), P(-1.95, 1.0, 0.0), P(-1.9, 1.6, 0.0)],
    },
    {
      name: 'Dumpster Plume Volumetric',
      type: 'Smoke',
      smokeType: 'Volumetric',
      tension: 0.5,
      closed: false,
      volParticleCount: 20000,
      volSize: 45,
      volColor: '#6a6a6a',
      volOpacity: 0.032,
      volBlendMode: 'Normal',
      volSpringK: 5.0,
      volDamping: 0.14,
      volTurbulence: 90,
      volTurbulenceSpeed: 0.18,
      volSpread: 40,
      volMaxDrift: 350,
      flowSpeed: 0.03,
      fadeRate: 4,
      points: [
        P(-1.0, 1.4, 0.0),
        P(-0.6, 1.9, 0.05),
        P(-0.1, 2.4, 0.1),
        P(0.5, 2.9, 0.0),
        P(1.2, 3.3, -0.08),
        P(2.0, 3.8, 0.1),
        P(3.0, 4.3, -0.05),
        P(4.2, 4.8, 0.15),
        P(5.5, 5.3, -0.1),
        P(7.0, 5.8, 0.0),
      ],
    },
    {
      name: 'Dumpster Plume Particle',
      type: 'Smoke',
      smokeType: 'Particle',
      tension: 0.5,
      closed: false,
      particleCount: 8000,
      particleSize: 55,
      particleColor: '#555555',
      opacity: 0.04,
      growth: 2.5,
      fadeExponent: 1.0,
      blendMode: 'Normal',
      springK: 6.0,
      flowSpeed: 0.03,
      damping: 0.15,
      turbulence: 70,
      turbulenceSpeed: 0.22,
      spawnSpread: 30,
      maxDrift: 300,
      buoyancy: 8,
      rotSpeed: 0.15,
      fadeRate: 4,
      points: [
        P(-1.0, 1.4, 0.0),
        P(-0.6, 1.9, 0.05),
        P(-0.1, 2.4, 0.1),
        P(0.5, 2.9, 0.0),
        P(1.2, 3.3, -0.08),
        P(2.0, 3.8, 0.1),
        P(3.0, 4.3, -0.05),
        P(4.2, 4.8, 0.15),
        P(5.5, 5.3, -0.1),
        P(7.0, 5.8, 0.0),
      ],
    },
  ],
};

DUMPSTER_FIRE.splines = DUMPSTER_FIRE.splines.map(normalizeSplinePreset);

export default DUMPSTER_FIRE;
