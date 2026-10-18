// Two-shots: the camera arcs across the ghost's front-side (face 72–94° off
// camera) with the ghost in one third and its subject in the other.
const PATHS = {
  'Black Hole Drift': {
    tension: 0.5,
    closed: true,
    points: [
      [1.06, 0.03, 2.38],
      [1.45, 0.27, 2.32],
      [1.84, 0.45, 2.19],
      [1.96, 0.21, 1.9],
      [1.59, -0.03, 1.89],
      [1.2, -0.15, 2.07],
    ],
  },
  'Ocean Drift': {
    tension: 0.5,
    closed: true,
    points: [
      [2.85, 2.03, 6.39],
      [3.89, 2.47, 6.23],
      [4.95, 2.8, 5.9],
      [5.29, 2.36, 5.11],
      [4.27, 1.92, 5.09],
      [3.22, 1.7, 5.58],
    ],
  },
  'Wing Drift': {
    tension: 0.5,
    closed: true,
    points: [
      [-2.85, 1.83, 6.39],
      [-3.89, 2.27, 6.23],
      [-4.95, 2.6, 5.9],
      [-5.29, 2.16, 5.11],
      [-4.27, 1.72, 5.09],
      [-3.22, 1.5, 5.58],
    ],
  },
  'Tiny Moon Drift': {
    tension: 0.5,
    closed: true,
    points: [
      [1.38, 0.6, 3.11],
      [1.89, 1, 3.03],
      [2.4, 1.3, 2.87],
      [2.57, 0.9, 2.48],
      [2.08, 0.5, 2.47],
      [1.56, 0.3, 2.71],
    ],
  },
  'Lunar Drift': {
    tension: 0.5,
    closed: true,
    points: [
      [2.64, 1.2, 5.94],
      [3.62, 1.6, 5.79],
      [4.6, 1.9, 5.48],
      [4.91, 1.5, 4.74],
      [3.97, 1.1, 4.73],
      [2.99, 0.9, 5.18],
    ],
  },
  'Campfire Drift': {
    tension: 0.5,
    closed: true,
    points: [
      [-0.83, 1.24, 4.73],
      [-0.35, 1.56, 5.03],
      [0.28, 1.8, 5.27],
      [0.79, 1.48, 4.98],
      [0.32, 1.16, 4.55],
      [-0.38, 1.0, 4.4],
    ],
  },
};

const CAMERA = {
  defaultMode: 'spline',
  near: 0.05,
  // The ocean's sky dome is a 500km box.
  far: 1000000,
  orbit: {
    desktop: {
      position: [1.5, 0.6, 3],
      target: [0, 0, 0],
      pivot: [0, 0, 0],
      fov: 45,
    },
    mobile: {
      position: [2, 0.8, 4.5],
      target: [0, 0, 0],
      pivot: [0, 0, 0],
      fov: 65,
    },
  },
  spline: {
    preset: 'Black Hole Drift',
    paths: PATHS,
    duration: 80,
    orientationMode: 'target',
    desktop: { target: [-16, 0, -8], fov: 58 },
    mobile: { target: [-16, 0, -8], fov: 70 },
  },
};

export default CAMERA;
