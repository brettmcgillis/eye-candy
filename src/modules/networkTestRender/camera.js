const TARGET = [0, 0, 0];

const CAMERA = {
  defaultMode: 'orbit',
  far: 100,
  near: 0.05,
  orbit: {
    autoRotate: true,
    autoRotateSpeed: 0.4,
    azimuthUnlimited: true,
    desktop: {
      fov: 32,
      pivot: TARGET,
      position: [4.2, 1.6, 3.6],
      target: TARGET,
    },
    mobile: { fov: 40, pivot: TARGET, position: [5.4, 2, 4.6], target: TARGET },
  },
};

export default CAMERA;
