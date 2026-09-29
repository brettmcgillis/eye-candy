const TARGET = [0, 0, 0];

const CAMERA = {
  defaultMode: 'orbit',
  far: 200,
  near: 0.05,
  orbit: {
    autoRotate: false,
    autoRotateSpeed: 0.3,
    enablePan: true,
    desktop: {
      fov: 30,
      pivot: TARGET,
      position: [3.2, 1.4, 17],
      target: TARGET,
    },
    mobile: {
      fov: 36,
      pivot: TARGET,
      position: [2.6, 1.2, 21],
      target: TARGET,
    },
  },
};

export default CAMERA;
