const TARGET = [0, 2.1, 0];

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [4.2, 2.4, 6.6],
      target: TARGET,
      pivot: TARGET,
      fov: 46,
    },
    mobile: {
      position: [5.4, 2.8, 8.6],
      target: TARGET,
      pivot: TARGET,
      fov: 54,
    },
  },
};

export default CAMERA;
