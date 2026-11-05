const TARGET = [0, 0.4, 1];

const CAMERA = {
  defaultMode: 'orbit',
  far: 60,
  near: 0.02,
  orbit: {
    autoRotate: false,
    autoRotateSpeed: 0.3,
    azimuthUnlimited: true,
    enablePan: true,
    maxPolarAngle: 88,
    desktop: {
      fov: 42,
      pivot: TARGET,
      position: [4.4, 3.2, 5.6],
      target: TARGET,
    },
    mobile: {
      fov: 58,
      pivot: TARGET,
      position: [5, 3.8, 6.6],
      target: TARGET,
    },
  },
};

export default CAMERA;
