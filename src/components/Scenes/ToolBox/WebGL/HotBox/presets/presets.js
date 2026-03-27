import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const E = (x, y, z) => new THREE.Euler(x, y, z);

const P = (x, y, z) => ({
  position: V(x, y, z),
  rotation: E(0, 0, 0),
  scale: V(1, 1, 1),
});

// Floor sits at Y = -200 in the GridBox workspace.
const FLOOR_Y = -100;

const HOTBOX_PRESETS = {
  Default: {
    splines: [
      {
        type: 'Smoke',
        smokeType: 'Both',
        closed: false,
        tension: 0.7,
        points: [
          P(0, FLOOR_Y, 0),
          P(110, 100, 70),
          P(-40, 400, 140),
          P(-130, 720, -30),
          P(60, 1000, -110),
        ],
      },
      {
        type: 'Fire',
        closed: false,
        tension: 0.7,
        points: [
          P(20, FLOOR_Y, -15),
          P(80, 120, 120),
          P(-80, 430, 100),
          P(-90, 690, -70),
          P(100, 970, -70),
        ],
      },
    ],
  },
};

export default HOTBOX_PRESETS;
