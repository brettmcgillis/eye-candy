import * as THREE from 'three';

import { normalizeSplinePreset } from '../../components/elements/splineGroup/splineDefaults';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const E = (x, y, z) => new THREE.Euler(x, y, z);

const P = (x, y, z) => ({
  position: V(x, y, z),
  rotation: E(0, 0, 0),
  scale: V(1, 1, 1),
});

const BURNING_AT_BOTH_ENDS_FIRE = {
  splines: [
    {
      name: 'Top Wick Fire',
      type: 'Fire',
      fireType: 'Classic',
      tension: 0.5,
      closed: false,
      fireWidth: 0.8,
      fireHeight: 2.0,
      fireDepth: 0.725,
      fireSliceSpacing: 0.05,
      fireMagnitude: 0.5,
      fireLacunarity: 4.0,
      fireGain: 0.0,
      fireTintColor: '#ffffff',
      fireSaturation: 1.0,
      fireBrightness: 1.5,
      fireAnimated: true,
      fireAnimSpeed: 0.5,
      points: [
        P(0.06, 3.21, 0.06),
        P(0.07, 3.52, 0.06),
        P(0.08, 3.86, 0.06),
        P(0.08, 4.22, 0.06),
      ],
    },
    {
      name: 'Bottom Wick Fire',
      type: 'Fire',
      fireType: 'Classic',
      tension: 0.5,
      closed: false,
      fireWidth: 0.8,
      fireHeight: 2.0,
      fireDepth: 0.725,
      fireSliceSpacing: 0.05,
      fireMagnitude: 0.5,
      fireLacunarity: 4.0,
      fireGain: 0.0,
      fireTintColor: '#ffffff',
      fireSaturation: 1.0,
      fireBrightness: 1.5,
      fireAnimated: true,
      fireAnimSpeed: 0.5,
      points: [
        P(0.06, -3.21, 0.06),
        P(0.07, -3.52, 0.06),
        P(0.08, -3.86, 0.06),
        P(0.08, -4.22, 0.06),
      ],
    },
    {
      name: 'Top Wick Smoke',
      type: 'Smoke',
      smokeType: 'Volumetric',
      tension: 0.3,
      closed: false,
      volParticleCount: 8000,
      volColor: '#b8b8b8',
      volOpacity: 0.01,
      volSize: 1,
      volBlendMode: 'Normal',
      volSpread: 0.35,
      volSpringK: 1.2,
      volDamping: 0.06,
      volTurbulence: 2,
      volTurbulenceSpeed: 0.25,
      volMaxDrift: 2.4,
      flowSpeed: 0.04,
      fadeRate: 4,
      points: [
        P(0.18, 3.34, 0.088),
        P(0.18, 4.09, 0.088),
        P(0.18, 4.84, 0.088),
        P(0.18, 5.59, 0.088),
        P(0.18, 6.34, 0.088),
      ],
    },
    {
      name: 'Bottom Wick Smoke',
      type: 'Smoke',
      smokeType: 'Volumetric',
      tension: 0.3,
      closed: false,
      volParticleCount: 8000,
      volColor: '#b8b8b8',
      volOpacity: 0.01,
      volSize: 1,
      volBlendMode: 'Normal',
      volSpread: 0.35,
      volSpringK: 1.2,
      volDamping: 0.06,
      volTurbulence: 2,
      volTurbulenceSpeed: 0.25,
      volMaxDrift: 2.4,
      flowSpeed: 0.04,
      fadeRate: 4,
      points: [
        P(0.18, -3.34, 0.088),
        P(0.18, -4.09, 0.088),
        P(0.18, -4.84, 0.088),
        P(0.18, -5.59, 0.088),
        P(0.18, -6.34, 0.088),
      ],
    },
  ],
};

BURNING_AT_BOTH_ENDS_FIRE.splines = BURNING_AT_BOTH_ENDS_FIRE.splines.map(
  normalizeSplinePreset
);

export default BURNING_AT_BOTH_ENDS_FIRE;
