const TARGET = [0, -0.35, 0];

const CAMERA = {
  defaultMode: 'orbit',
  far: 100,
  near: 0.05,
  orbit: {
    desktop: {
      fov: 30,
      pivot: TARGET,
      position: [2.6, 1.6, 4.6],
      target: TARGET,
    },
    mobile: { fov: 40, pivot: TARGET, position: [3.2, 2, 5.8], target: TARGET },
  },
};

export default CAMERA;
