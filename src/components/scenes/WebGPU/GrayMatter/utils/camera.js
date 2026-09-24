const TARGET = [0, 1.45, 0];

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      fov: 36,
      pivot: TARGET,
      position: [0.9, 2.1, 5.4],
      target: TARGET,
    },
    mobile: {
      fov: 48,
      pivot: TARGET,
      position: [1.1, 2.3, 6.6],
      target: TARGET,
    },
  },
};

export default CAMERA;
