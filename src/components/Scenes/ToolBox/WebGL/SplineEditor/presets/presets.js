import * as THREE from 'three';

const SPLINE_PRESETS = {
  Default: {
    tension: 0.5,
    closed: true,
    showUniform: true,
    showCentripetal: false,
    showChordal: false,
    points: [
      new THREE.Vector3(289.768, 452.515, 56.1),
      new THREE.Vector3(236.536, 171.497, 327.115),
      new THREE.Vector3(-91.401, 176.431, 335.528),
      new THREE.Vector3(-383.785, 491.137, 47.869),
      new THREE.Vector3(-185.136, 424.472, -164.286),
    ],
  },
  Loop: {
    tension: 0.5,
    closed: true,
    showUniform: true,
    showCentripetal: false,
    showChordal: false,
    points: [
      new THREE.Vector3(300, 200, 0),
      new THREE.Vector3(0, 400, 200),
      new THREE.Vector3(-300, 200, 0),
      new THREE.Vector3(0, 0, -200),
    ],
  },
  FlatXZ: {
    tension: 0.5,
    closed: false,
    showUniform: true,
    showCentripetal: false,
    showChordal: false,
    points: [
      new THREE.Vector3(-300, 0, -200),
      new THREE.Vector3(-100, 0, 200),
      new THREE.Vector3(100, 0, -200),
      new THREE.Vector3(300, 0, 200),
    ],
  },
};

export default SPLINE_PRESETS;
