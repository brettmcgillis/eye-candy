import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Floor sits at Y = -200 in the GridBox workspace.
const FLOOR_Y = -200;

const HOTBOX_PRESETS = {
  Default: {
    splines: [
      {
        type: 'Smoke',
        smokeType: 'Both',
        closed: false,
        tension: 0.7,
        points: [
          V(0, FLOOR_Y, 0),
          V(110, 100, 70),
          V(-40, 400, 140),
          V(-130, 720, -30),
          V(60, 1000, -110),
        ],
      },
      {
        type: 'Fire',
        closed: false,
        tension: 0.7,
        points: [
          V(20, FLOOR_Y, -15),
          V(80, 120, 120),
          V(-80, 430, 100),
          V(-90, 690, -70),
          V(100, 970, -70),
        ],
      },
    ],
  },
};

export default HOTBOX_PRESETS;
