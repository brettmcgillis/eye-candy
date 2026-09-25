const TARGET = [0, 0.3, 0];

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [1.9, 1.5, 2.1],
      target: TARGET,
      pivot: TARGET,
      fov: 40,
    },
    mobile: {
      position: [2.4, 2.2, 3.1],
      target: TARGET,
      pivot: TARGET,
      fov: 55,
    },
  },
};

export default CAMERA;
