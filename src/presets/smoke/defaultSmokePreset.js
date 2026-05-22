import * as THREE from 'three';

import {
  cloneFireAndSmokeControlPoints,
  makeFireAndSmokeSmokeConfig,
} from '../../components/elements/fireAndSmoke/fireAndSmokeDefaults';
import { makeSpline } from '../splineAuthoring';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const E = (x, y, z) => new THREE.Euler(x, y, z);
const S = (x, y, z) => new THREE.Vector3(x, y, z);

const C = (px, py, pz, sx, sy, sz, rx = 0, ry = 0, rz = 0) => ({
  position: V(px, py, pz),
  rotation: E(rx, ry, rz),
  scale: S(sx, sy, sz),
});

// Points authored at scene scale (1 unit ≈ 1 metre).
// Toolbox camera sits at [0, 3, 12] — smoke should read within ~0–8 units.
const DEFAULT_SMOKE_PRESET = {
  Default: {
    splines: [
      // Centre upward column — mirrors the default smoke spline used in HotBox.
      makeSpline({
        name: 'Default Smoke',
        type: 'Smoke',
        smokeType: 'Particle',
        closed: false,
        tension: 0.7,
        pos: [0, -1, 0],
        points: [
          [0, 0, 0],
          [1.1, 2, 0.7],
          [-0.4, 5, 1.4],
          [-1.3, 8.2, -0.3],
          [0.6, 11, -1.1],
        ],
      }),
      makeSpline({
        name: 'Particle Smoke',
        type: 'Particle',
        tension: 0.5,
        closed: true,
        pos: [7, 1.5, 0],
        points: [
          [0, 0, 0],
          [-2, 2, 2],
          [-4, 0, 0],
          [-2, -2, -2],
        ],
      }),
      makeSpline({
        name: 'Volumetric Smoke',
        type: 'Volumetric',
        tension: 0.5,
        closed: true,
        pos: [5, 1.5, -2],
        points: [
          [0, 0, 0],
          [0, 2, 2],
          [0, 0, 4],
          [0, -2, 2],
        ],
      }),
    ],
    elements: {
      smokeBall: [
        {
          pos: [-5, 1, 0],
          rot: [0, 0, 0],
          scale: [1, 1, 1],
          config: {
            radius: 0.6,
            detail: 5,
            speed: 1.0,
            weight: 0.3,
            noiseFreq: 2.0,
            noiseAmp: 0.15,
            animated: true,
            smokeLightColor: '#bcbcbc',
            smokeDarkColor: '#262626',
          },
        },
      ],
      smokeBallSpline: [
        {
          pos: [0, 0, 0],
          rot: [0, 0, 0],
          scale: [1, 1, 1],
          showHandles: true,
          pointMode: 'translate',
          controlPoints: [
            C(-7, 0, 0, 1.0, 1.0, 1.0),
            C(-7, 0.9, 0, 0.9, 0.9, 0.9),
            C(-6.85, 1.8, 0, 1.0, 1.0, 1.0),
            C(-6.75, 2.7, 0.1, 1.3, 1.3, 1.3),
            C(-6.65, 3.6, 0.15, 1.6, 1.6, 1.6),
            C(-6.55, 4.5, 0.2, 2.0, 2.0, 2.0),
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
            smokeLightColor: '#bcbcbc',
            smokeDarkColor: '#262626',
          },
        },
      ],
      billboardSmoke: [
        {
          pos: [-3, 0, 0],
          config: {
            inverted: false,
            width: 1.5,
            height: 6.0,
            color: '#b8b8b8',
            opacity: 1.0,
            timeFrequency: 0.45,
            uvFrequencyX: 1.0,
            uvFrequencyY: 1.5,
            riseSpeed: 0.35,
            spreadStrength: 0.18,
          },
        },
      ],
      fireAndSmoke: [
        {
          pos: [-0.5, 0, -4.25],
          rot: [0, 0, 0],
          scale: [1, 1, 1],
          showHandles: true,
          showSpline: true,
          pointMode: 'translate',
          controlPoints: cloneFireAndSmokeControlPoints(),
          config: makeFireAndSmokeSmokeConfig(),
        },
      ],
    },
    attractors: [
      { position: [7, 3.5, 2], direction: [0, 1, 0], rotation: [0, 0, 0] },
      { position: [3, 3.5, -2], direction: [0, 1, 0], rotation: [0, 0, 0] },
      { position: [6, -0.5, 0], direction: [0, 1, 0], rotation: [0, 0, 0] },
      { position: [4, 2, 1.5], direction: [0, 1, 0], rotation: [0, 0, 0] },
    ],
  },
};

export default DEFAULT_SMOKE_PRESET;
