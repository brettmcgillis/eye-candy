import * as THREE from 'three';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const E = (x, y, z) => new THREE.Euler(x, y, z);

const P = (x, y, z) => ({
  position: V(x, y, z),
  rotation: E(0, 0, 0),
});

const DEFAULT_CAMERA_SPLINE = {
  'Default Circular': {
    tension: 0.5,
    closed: true,
    showPoints: true,
    showUniform: true,
    showCentripetal: false,
    showChordal: false,
    points: [P(300, 200, 0), P(0, 400, 200), P(-300, 200, 0), P(0, 0, -200)],
  },
};

export default DEFAULT_CAMERA_SPLINE;
