import * as THREE from 'three';

import {
  cloneFireAndSmokeControlPoints,
  makeFireAndSmokeFireConfig,
} from '@elements/fireAndSmoke/fireAndSmokeDefaults';

import { makeSpline } from '../splineAuthoring';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const E = (x, y, z) => new THREE.Euler(x, y, z);
const S = (x, y, z) => new THREE.Vector3(x, y, z);

const C = (px, py, pz, sx, sy, sz, rx = 0, ry = 0, rz = 0) => ({
  position: V(px, py, pz),
  rotation: E(rx, ry, rz),
  scale: S(sx, sy, sz),
});

const risingCurve = (x, z = 0) => ({
  pos: [x, -1, z],
  points: [
    [0, 0, 0],
    [0.8, 2.2, 0.7],
    [-0.4, 5, 1.4],
    [-1.3, 8.2, -0.3],
    [0.6, 11, -1.1],
  ],
});

// Points are at scene scale (1 unit ≈ 1 metre).
// HotBox composes its mixed default sandbox by merging this fire-only preset
// with the smoke default preset, keeping smoke-owned defaults in one place.
const DEFAULT_FIRE_PRESET = {
  splines: [
    makeSpline({
      name: 'Classic Fire',
      type: 'Fire',
      fireType: 'Classic',
      closed: false,
      tension: 0.7,
      ...risingCurve(-5.5, 2.2),
    }),
    makeSpline({
      name: 'RayMarch Fire',
      type: 'Fire',
      fireType: 'RayMarch',
      closed: false,
      tension: 0.7,
      ...risingCurve(5.75, 1.6),
    }),
  ],
  elements: {
    fireball: [
      {
        pos: [-7, 1, -2.75],
        rot: [0, 0, 0],
        scale: [1, 1, 1],
        config: {
          radius: 0.4,
          detail: 5,
          speed: 1.0,
          weight: 0.3,
          noiseFreq: 2.0,
          noiseAmp: 0.15,
          animated: true,
        },
      },
    ],
    fireSpline: [
      {
        pos: [-5.75, 0, -1.6],
        rot: [0, 0, 0],
        scale: [1, 1, 1],
        showHandles: true,
        showSpline: true,
        pointMode: 'translate',
        controlPoints: [
          C(3.5, 0, 2.8, 1.0, 1.0, 1.0),
          C(3.5, 0.9, 2.8, 0.9, 0.9, 0.9),
          C(3.65, 1.8, 2.8, 1.0, 1.0, 1.0),
          C(3.75, 2.7, 2.9, 1.3, 1.3, 1.3),
          C(3.85, 3.6, 2.95, 1.6, 1.6, 1.6),
          C(3.95, 4.5, 3.0, 2.0, 2.0, 2.0),
        ],
        config: {
          baseRadius: 0.6,
          tubularSegments: 64,
          radialSegments: 32,
          capSegments: 8,
          speed: 1.0,
          weight: 0.3,
          noiseFreq: 2.0,
          noiseAmp: 0.15,
          animated: true,
          smokeLightColor: '#4a4a58',
          smokeDarkColor: '#1a1a22',
        },
      },
    ],
    flame: [
      {
        pos: [-0.5, 0, -3],
        rot: [0, 0, 0],
        scale: [1.2, 1.2, 1.2],
        config: {
          inverted: false,
          motion: {
            baseSpeed: 1.15,
            minSpeed: 0.28,
            slowFreq: 0.7,
            slowAmp: 0.55,
            fastFreq: 2.6,
            fastAmp: 0.25,
            microFreq: 5.7,
            microAmp: 0.08,
            swayX: 0.015,
            swayZ: 0.014,
            pulseFreq: 3.4,
            pulseAmp: 0.04,
            scaleX: 1,
            scaleY: 1,
          },
        },
      },
    ],
    volumetricFire: [
      {
        pos: [4.25, 0, -2.6],
        rot: [0, 0, 0],
        scale: [1, 1, 1],
        config: {
          width: 0.8,
          height: 2.0,
          depth: 0.8,
          sliceSpacing: 0.04,
          bendX: 0,
          bendZ: 0,
          animated: true,
          animSpeed: 0.5,
          showSpline: false,
          showVolume: false,
          magnitude: 1.3,
          lacunarity: 2.0,
          gain: 0.5,
          tintColor: '#ffffff',
          saturation: 1.0,
          brightness: 1.5,
        },
      },
    ],
    cs184Fire: [
      {
        pos: [0.75, 0, 3.2],
        rot: [0, 0, 0],
        scale: [1, 1, 1],
        config: {
          width: 0.5,
          height: 1.5,
          depth: 0.5,
          bendX: 0,
          bendZ: 0,
          animated: true,
          animSpeed: 0.5,
          magnitude: 1.3,
          lacunarity: 2.0,
          gain: 0.5,
          speed: 0.8,
          density: 1.2,
          brightness: 1.8,
          saturation: 1.0,
          tintColor: '#ffffff',
          coreColor: '#ffffcc',
          borderColor: '#ff6600',
          smokeColor: '#330000',
          emberDensity: 0.15,
          emberSize: 0.25,
          emberColor: '#ff4400',
          steps: 64,
          stepSize: 1.0,
        },
      },
    ],
    fireAndSmoke: [
      {
        pos: [7, 0, 3],
        rot: [0, 0, 0],
        scale: [1, 1, 1],
        showHandles: true,
        showSpline: true,
        pointMode: 'translate',
        controlPoints: cloneFireAndSmokeControlPoints(),
        config: makeFireAndSmokeFireConfig(),
      },
    ],
  },
};

export default DEFAULT_FIRE_PRESET;
