const TARGET = [0, 0.45, 0];

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [5.8, 3.1, 5.8],
      target: TARGET,
      pivot: TARGET,
      fov: 40,
    },
    mobile: {
      position: [4.8, 3.8, 5.4],
      target: TARGET,
      pivot: TARGET,
      fov: 45,
    },
  },
};

export default CAMERA;
