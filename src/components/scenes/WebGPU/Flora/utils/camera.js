const TARGET = [0, 6.2, 0];

const CAMERA = {
  defaultMode: 'orbit',
  far: 200,
  near: 0.05,
  orbit: {
    autoRotate: false,
    autoRotateSpeed: 0.35,
    azimuthUnlimited: true,
    enablePan: false,
    desktop: {
      fov: 30,
      pivot: TARGET,
      position: [0, 6.2, 26],
      target: TARGET,
    },
    mobile: {
      fov: 34,
      pivot: TARGET,
      position: [0, 6.2, 36],
      target: TARGET,
    },
  },
};

export default CAMERA;
