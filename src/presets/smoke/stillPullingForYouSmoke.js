import * as THREE from 'three';

import { normalizeSplinePreset } from '../../components/elements/splineGroup/splineDefaults';

// Points are at scene scale (1 unit ≈ 1 metre), matching the toolbox editor
// and the StillPullingForYou WIP scene coordinate system.
function point(x, y, z) {
  return {
    position: new THREE.Vector3(x, y, z),
    rotation: new THREE.Euler(0.0, 0.0, 0.0),
    scale: new THREE.Vector3(1.0, 1.0, 1.0),
  };
}

const STILL_PULLING_FOR_YOU_SMOKE = {
  'Still Pulling For You': {
    splines: [
      {
        name: 'Still Pulling Spline 1',
        type: 'Particle',
        visible: true,
        tension: 0.6,
        closed: false,
        arcSegments: 200,
        particleCount: 3000,
        particleSize: 0.4,
        particleColor: '#a8a8a0',
        opacity: 0.02,
        growth: 1.3,
        fadeExponent: 1,
        springK: 4.3,
        flowSpeed: 0,
        damping: 0.93,
        turbulence: 0.4,
        turbulenceSpeed: 0,
        spawnSpread: 0.3,
        maxDrift: 1,
        fadeRate: 1.5,
        buoyancy: 0,
        rotSpeed: 0,
        blendMode: 'Normal',
        volParticleCount: 3000,
        volSize: 0.6,
        volColor: '#9090a0',
        volOpacity: 0.06,
        volFlowSpeed: 0.04,
        volFadeRate: 8,
        volSpread: 0.3,
        volSpringK: 1,
        volDamping: 0.9,
        volTurbulence: 0.5,
        volTurbulenceSpeed: 0.25,
        volMaxDrift: 2,
        volGrowth: 1.5,
        volFadeExp: 1.2,
        volBuoyancy: 0,
        volBlendMode: 'Normal',
        points: [
          {
            position: new THREE.Vector3(-0.804, 1.385, -0.473),
            rotation: new THREE.Euler(0.0, 0.0, 0.0),
            scale: new THREE.Vector3(1.0, 1.0, 1.0),
          },
          {
            position: new THREE.Vector3(-1.04, 1.847, -0.662),
            rotation: new THREE.Euler(0.0, 0.0, 0.0),
            scale: new THREE.Vector3(1.0, 1.0, 1.0),
          },
          {
            position: new THREE.Vector3(-1.315, 2.245, -0.668),
            rotation: new THREE.Euler(0.0, 0.0, 0.0),
            scale: new THREE.Vector3(1.0, 1.0, 1.0),
          },
          {
            position: new THREE.Vector3(-1.074, 2.546, -0.87),
            rotation: new THREE.Euler(0.0, 0.0, 0.0),
            scale: new THREE.Vector3(1.0, 1.0, 1.0),
          },
          {
            position: new THREE.Vector3(-0.5, 2.304, -1.009),
            rotation: new THREE.Euler(0.0, 0.0, 0.0),
            scale: new THREE.Vector3(1.0, 1.0, 1.0),
          },
          {
            position: new THREE.Vector3(-0.679, 2.356, -0.52),
            rotation: new THREE.Euler(0.0, 0.0, 0.0),
            scale: new THREE.Vector3(1.0, 1.0, 1.0),
          },
          {
            position: new THREE.Vector3(-0.985, 2.656, -0.549),
            rotation: new THREE.Euler(0.0, 0.0, 0.0),
            scale: new THREE.Vector3(1.0, 1.0, 1.0),
          },
          {
            position: new THREE.Vector3(-1.14, 3.099, -0.907),
            rotation: new THREE.Euler(0.0, 0.0, 0.0),
            scale: new THREE.Vector3(1.0, 1.0, 1.0),
          },
          {
            position: new THREE.Vector3(-1.158, 3.489, -0.917),
            rotation: new THREE.Euler(0.0, 0.0, 0.0),
            scale: new THREE.Vector3(1.0, 1.0, 1.0),
          },
        ],
      },
      {
        name: 'Still Pulling Spline 2',
        type: 'Volumetric',
        visible: true,
        tension: 0.6,
        closed: false,
        arcSegments: 200,
        particleCount: 3000,
        particleSize: 0.4,
        particleColor: '#a8a8a0',
        opacity: 0.35,
        growth: 2,
        fadeExponent: 1,
        springK: 1,
        flowSpeed: 0.15,
        damping: 0.93,
        turbulence: 0.5,
        turbulenceSpeed: 0.3,
        spawnSpread: 0.3,
        maxDrift: 2,
        fadeRate: 1.5,
        buoyancy: 0,
        rotSpeed: 0,
        blendMode: 'Normal',
        volParticleCount: 3000,
        volSize: 0.6,
        volColor: '#97979b',
        volOpacity: 0.035,
        volFlowSpeed: 0.01,
        volFadeRate: 8,
        volSpread: 0.3,
        volSpringK: 1,
        volDamping: 0.9,
        volTurbulence: 0.3,
        volTurbulenceSpeed: 0.07,
        volMaxDrift: 0.5,
        volGrowth: 1.5,
        volFadeExp: 1.2,
        volBuoyancy: 0,
        volBlendMode: 'Normal',
        points: [
          {
            position: new THREE.Vector3(-0.804, 1.385, -0.473),
            rotation: new THREE.Euler(0.0, 0.0, 0.0),
            scale: new THREE.Vector3(1.0, 1.0, 1.0),
          },
          {
            position: new THREE.Vector3(-0.786, 1.847, -0.662),
            rotation: new THREE.Euler(0.0, 0.0, 0.0),
            scale: new THREE.Vector3(1.0, 1.0, 1.0),
          },
          {
            position: new THREE.Vector3(-1.315, 2.524, -0.668),
            rotation: new THREE.Euler(0.0, 0.0, 0.0),
            scale: new THREE.Vector3(1.0, 1.0, 1.0),
          },
          {
            position: new THREE.Vector3(-0.413, 2.645, -0.52),
            rotation: new THREE.Euler(0.0, 0.0, 0.0),
            scale: new THREE.Vector3(1.0, 1.0, 1.0),
          },
          {
            position: new THREE.Vector3(-1.158, 3.228, -0.029),
            rotation: new THREE.Euler(0.0, 0.0, 0.0),
            scale: new THREE.Vector3(1.0, 1.0, 1.0),
          },
          {
            position: new THREE.Vector3(-2.268, 3.226, -1.583),
            rotation: new THREE.Euler(0.0, 0.0, 0.0),
            scale: new THREE.Vector3(1.0, 1.0, 1.0),
          },
        ],
      },
    ],
  },
};

const roughWatersParticlePoints = [
  point(-0.406, 1.869, -0.226),
  point(-0.443, 2.319, -0.273),
  point(-0.518, 2.819, -0.367),
  point(-0.748, 3.219, -0.657),
  point(-1.121, 3.219, -1.127),
  point(-1.494, 3.219, -1.597),
];

const roughWatersVolumetricPoints = [
  point(-0.406, 1.869, -0.226),
  point(-0.456, 2.248, -0.289),
  point(-0.568, 2.688, -0.43),
  point(-0.872, 3.188, -0.813),
  point(-1.245, 3.188, -1.283),
  point(-1.618, 3.188, -1.753),
];

const stillPullingSplines =
  STILL_PULLING_FOR_YOU_SMOKE['Still Pulling For You'].splines;

STILL_PULLING_FOR_YOU_SMOKE['Still Pulling'] =
  STILL_PULLING_FOR_YOU_SMOKE['Still Pulling For You'];

STILL_PULLING_FOR_YOU_SMOKE['Rough Waters'] = {
  splines: [
    {
      ...stillPullingSplines[0],
      name: 'Rough Waters Spline 1',
      points: roughWatersParticlePoints,
    },
    {
      ...stillPullingSplines[1],
      name: 'Rough Waters Spline 2',
      points: roughWatersVolumetricPoints,
    },
  ],
};

Object.values(STILL_PULLING_FOR_YOU_SMOKE).forEach((preset) => {
  if (!Array.isArray(preset?.splines)) return;
  const normalizedSplines = preset.splines.map(normalizeSplinePreset);
  Object.assign(preset, { splines: normalizedSplines });
});

export default STILL_PULLING_FOR_YOU_SMOKE;
