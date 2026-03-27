import * as THREE from 'three';

const P = (x, y, z) => ({
  position: new THREE.Vector3(x, y, z),
  rotation: new THREE.Euler(0, 0, 0),
  scale: new THREE.Vector3(1, 1, 1),
});

const STILL_PULLING_FOR_YOU_SMOKE = {
  'Still Pulling For You - Main': {
    tension: 0.6,
    closed: false,
    points: [
      P(-260, 220, 20),
      P(-120, 300, 80),
      P(40, 390, 120),
      P(210, 500, 60),
      P(330, 650, -20),
    ],
  },
  'Still Pulling For You - Stub 2': {
    tension: 0.6,
    closed: false,
    points: [
      P(-300, 200, -40),
      P(-170, 290, 40),
      P(-10, 380, 120),
      P(160, 480, 90),
      P(320, 620, 10),
    ],
  },
};

export default STILL_PULLING_FOR_YOU_SMOKE;
