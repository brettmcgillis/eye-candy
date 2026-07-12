// Framed to sit just outside the default worldSize=40 box (see presets.js)
// with enough headroom to see the flock roam near its edges.
const TARGET = [0, 0, 0];

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [0, 22, 62],
      target: TARGET,
      pivot: TARGET,
      fov: 45,
    },
    mobile: {
      position: [0, 26, 76],
      target: TARGET,
      pivot: TARGET,
      fov: 55,
    },
  },
};

export default CAMERA;
