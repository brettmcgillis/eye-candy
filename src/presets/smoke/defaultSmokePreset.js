import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const E = (x, y, z) => new THREE.Euler(x, y, z);

const P = (x, y, z) => ({
  position: V(x, y, z),
  rotation: E(0, 0, 0),
});

// Points authored at scene scale (1 unit ≈ 1 metre).
// Toolbox camera sits at [0, 3, 12] — smoke should read within ~0–8 units.
const DEFAULT_SMOKE_PRESET = {
  Default: {
    splines: [
      // Centre upward column — mirrors the default smoke spline used in HotBox.
      {
        name: 'Default Smoke',
        type: 'Smoke',
        smokeType: 'Particle',
        closed: false,
        tension: 0.7,
        points: [
          P(0, -1, 0),
          P(1.1, 1, 0.7),
          P(-0.4, 4, 1.4),
          P(-1.3, 7.2, -0.3),
          P(0.6, 10, -1.1),
        ],
      },
      {
        name: 'Particle Smoke',
        type: 'Particle',
        tension: 0.5,
        closed: true,
        points: [P(7, 1.5, 0), P(5, 3.5, 2), P(3, 1.5, 0), P(5, -0.5, -2)],
      },
      {
        name: 'Volumetric Smoke',
        type: 'Volumetric',
        tension: 0.5,
        closed: true,
        points: [P(5, 1.5, -2), P(5, 3.5, 0), P(5, 1.5, 2), P(5, -0.5, 0)],
      },
    ],
  },
};

export default DEFAULT_SMOKE_PRESET;
