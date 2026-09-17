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

  'Longitudinal Glide': {
    tension: 0.35,
    closed: true,
    points: [
      P(5, 8, 17),
      P(-2, 6, 12),
      P(-7, 4.5, 4),
      P(-6, 3.5, -6),
      P(-1, 4.5, -16),
      P(6, 5, -11),
      P(8, 6, -1),
      P(7, 7, 9),
    ],
  },

  'Wide Crossing Loop': {
    tension: 0.4,
    closed: true,
    points: [
      P(-14, 5, 7),
      P(-9, 3.5, 0),
      P(-4, 3, -8),
      P(5, 3.5, -11),
      P(13, 5, -5),
      P(12, 7, 4),
      P(4, 9, 10),
      P(-7, 8, 11),
    ],
  },

  'Lateral Arc Sweep': {
    tension: 0.35,
    closed: true,
    points: [
      P(-21, 11, -2),
      P(-13, 7, -8),
      P(0, 6, -11),
      P(13, 7, -8),
      P(21, 11, -2),
      P(14, 14, 7),
      P(0, 16, 11),
      P(-14, 14, 7),
    ],
  },

  'Low Survey Orbit': {
    tension: 0.4,
    closed: true,
    points: [
      P(-18, 8, 12),
      P(-8, 5, 15),
      P(4, 4.5, 13),
      P(16, 6, 8),
      P(19, 9, -1),
      P(9, 12, -8),
      P(-5, 11, -9),
      P(-17, 9, -3),
    ],
  },

  'Ground-Level Slalom': {
    tension: 0.3,
    closed: true,
    points: [
      P(-3, 1.4, 17),
      P(4, 1.1, 11),
      P(-5, 1.6, 4),
      P(5, 1.2, -4),
      P(-4, 1.5, -11),
      P(3, 1.3, -17),
      P(10, 5, -10),
      P(11, 7, 0),
      P(9, 5, 10),
    ],
  },
};

export default CAMERA_SPLINE_PRESETS;
