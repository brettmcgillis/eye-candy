const WORLD_TARGET = [0, 0, 0];

const CAMERA = {
  defaultMode: 'orbit',
  far: 400,
  near: 0.1,
  orbit: {
    autoRotate: false,
    autoRotateSpeed: 0.4,
    azimuthUnlimited: true,
    enablePan: true,
    maxPolarAngle: 84,
    desktop: {
      fov: 24,
      pivot: WORLD_TARGET,
      position: [62, 58, 62],
      target: WORLD_TARGET,
    },
    mobile: {
      fov: 30,
      pivot: WORLD_TARGET,
      position: [80, 76, 80],
      target: WORLD_TARGET,
    },
  },
};

export default CAMERA;
