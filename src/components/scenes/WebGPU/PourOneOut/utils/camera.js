const TARGET = [0, -0.2, 0];

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [2.4, 1.6, 9.5],
      target: TARGET,
      pivot: TARGET,
      fov: 40,
    },
    mobile: {
      position: [2.8, 1.8, 13],
      target: TARGET,
      pivot: TARGET,
      fov: 52,
    },
  },
};

export default CAMERA;
