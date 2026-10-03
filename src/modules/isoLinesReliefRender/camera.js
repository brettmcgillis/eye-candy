const TARGET = [0, 0.2, 0];

const CAMERA = {
  defaultMode: 'orbit',
  far: 100,
  near: 0.05,
  orbit: {
    autoRotate: false,
    autoRotateSpeed: 0.3,
    desktop: {
      fov: 30,
      pivot: TARGET,
      position: [1.6, 3.2, 3.4],
      target: TARGET,
    },
    mobile: { fov: 38, pivot: TARGET, position: [2, 4.2, 4.6], target: TARGET },
  },
};

export default CAMERA;
