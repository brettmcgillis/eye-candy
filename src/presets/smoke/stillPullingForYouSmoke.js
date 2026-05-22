import { makeSpline } from '../splineAuthoring';

// Points are at scene scale (1 unit ≈ 1 metre), matching the toolbox editor
// and the StillPullingForYou WIP scene coordinate system.
const STILL_PULLING_SPLINE_1 = makeSpline({
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
  pos: [-0.804, 1.385, -0.473],
  points: [
    [0, 0, 0],
    [-0.236, 0.462, -0.189],
    [-0.511, 0.86, -0.195],
    [-0.27, 1.161, -0.397],
    [0.304, 0.919, -0.536],
    [0.125, 0.971, -0.047],
    [-0.181, 1.271, -0.076],
    [-0.336, 1.714, -0.434],
    [-0.354, 2.104, -0.444],
  ],
});

const STILL_PULLING_SPLINE_2 = makeSpline({
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
  pos: [-0.804, 1.385, -0.473],
  points: [
    [0, 0, 0],
    [0.018, 0.462, -0.189],
    [-0.511, 1.139, -0.195],
    [0.391, 1.26, -0.047],
    [-0.354, 1.843, 0.444],
    [-1.464, 1.841, -1.11],
  ],
});

const ROUGH_WATERS_SPLINE_1 = makeSpline({
  ...STILL_PULLING_SPLINE_1,
  name: 'Rough Waters Spline 1',
  pos: [-0.406, 1.869, -0.226],
  points: [
    [0, 0, 0],
    [-0.037, 0.45, -0.047],
    [-0.112, 0.95, -0.141],
    [-0.342, 1.35, -0.431],
    [-0.715, 1.35, -0.901],
    [-1.088, 1.35, -1.371],
  ],
});

const ROUGH_WATERS_SPLINE_2 = makeSpline({
  ...STILL_PULLING_SPLINE_2,
  name: 'Rough Waters Spline 2',
  pos: [-0.406, 1.869, -0.226],
  points: [
    [0, 0, 0],
    [-0.05, 0.379, -0.063],
    [-0.162, 0.819, -0.204],
    [-0.466, 1.319, -0.587],
    [-0.839, 1.319, -1.057],
    [-1.212, 1.319, -1.527],
  ],
});

const STILL_PULLING_PRESET = {
  splines: [STILL_PULLING_SPLINE_1, STILL_PULLING_SPLINE_2],
};

const STILL_PULLING_FOR_YOU_SMOKE = {
  'Still Pulling For You': STILL_PULLING_PRESET,
};

STILL_PULLING_FOR_YOU_SMOKE['Still Pulling'] = STILL_PULLING_PRESET;

STILL_PULLING_FOR_YOU_SMOKE['Rough Waters'] = {
  splines: [ROUGH_WATERS_SPLINE_1, ROUGH_WATERS_SPLINE_2],
};

export default STILL_PULLING_FOR_YOU_SMOKE;
