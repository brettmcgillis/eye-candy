import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const E = (x, y, z) => new THREE.Euler(x, y, z);

const P = (x, y, z) => ({
  position: V(x, y, z),
  rotation: E(0, 0, 0),
});

const CAMERA_SPLINE_PRESETS = {
  'Loop de Loop': {
    tension: 0.5,
    closed: true,
    points: [
      P(0, 3, 8),
      P(6, 5, 4),
      P(8, 6, 0),
      P(6, 4, -4),
      P(0, 3, -7),
      P(-6, 4, -4),
      P(-8, 3, 0),
      P(-6, 2, 4),
      P(-4, 2, 6),
      P(0, 1.5, 7),
      P(4, 2, 6),
      P(6, 2.5, 4),
      P(7, 3.5, 2),
    ],
  },

  'High Orbit to Close': {
    tension: 0.5,
    closed: true,
    points: [
      P(8, 6, 0),
      P(0, 7, 8),
      P(-8, 6, 0),
      P(0, 6, -8),
      P(10, 4, 0),
      P(0, 5, 10),
      P(-10, 4, 0),
      P(0, 4, -10),
      P(5, 2, 0),
      P(0, 1.5, 5),
      P(-5, 2, 0),
      P(0, 2, -5),
    ],
  },

  'Figure Eight': {
    tension: 0.5,
    closed: true,
    points: [
      P(6, 4, -1),
      P(3, 6, 3),
      P(0, 5, 1),
      P(-3, 6, 3),
      P(-6, 4, -1),
      P(-3, 2, -4),
      P(0, 1, -6),
      P(3, 2, -4),
      P(6, 4, -8),
      P(3, 6, -12),
      P(0, 5, -10),
      P(-3, 6, -12),
      P(-6, 4, -8),
    ],
  },

  'Spiral Up': {
    tension: 0.5,
    closed: true,
    points: [
      P(5, 1, 0),
      P(0, 2, 5),
      P(-5, 2, 0),
      P(0, 3, -5),
      P(7, 4, 0),
      P(0, 5, 7),
      P(-7, 4, 0),
      P(0, 5, -7),
      P(6, 6, 1),
      P(1, 7, 6),
      P(-6, 6, 1),
      P(1, 6.5, -6),
    ],
  },
};

export default CAMERA_SPLINE_PRESETS;
