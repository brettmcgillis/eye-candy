const TARGET = [-0.8, 0.25, 0.3];

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [5, 4, 7],
      target: TARGET,
      pivot: TARGET,
      fov: 40,
    },
    mobile: {
      position: [8, 6, 10],
      target: TARGET,
      pivot: TARGET,
      fov: 50,
    },
  },
};

export default CAMERA;
