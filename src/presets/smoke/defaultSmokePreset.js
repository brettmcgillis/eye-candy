import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const E = (x, y, z) => new THREE.Euler(x, y, z);

const P = (x, y, z) => ({
  position: V(x, y, z),
  rotation: E(0, 0, 0),
});

const DEFAULT_SMOKE_PRESET = {
  Default: {
    splines: [
      {
        name: 'Particle Smoke',
        type: 'Particle',
        tension: 0.5,
        closed: true,
        points: [
          P(700, 150, 0),
          P(500, 350, 200),
          P(300, 150, 0),
          P(500, -50, -200),
        ],
      },
      {
        name: 'Volumetric Smoke',
        type: 'Volumetric',
        tension: 0.5,
        closed: true,
        points: [
          P(500, 150, -200),
          P(500, 350, 0),
          P(500, 150, 200),
          P(500, -50, 0),
        ],
      },
    ],
  },
};

export default DEFAULT_SMOKE_PRESET;
