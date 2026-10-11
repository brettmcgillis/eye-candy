const TARGET = [0, 0, 0.4];

const CAMERA = {
  defaultMode: 'orbit',
  far: 200,
  near: 0.05,
  fixed: {
    activeShot: 'default',
    behavior: 'single',
    shots: {
      default: {
        desktop: { fov: 32, position: [-7.5, -3.5, 17], target: TARGET },
        mobile: { fov: 40, position: [-6, -3, 24], target: TARGET },
      },
    },
  },
  orbit: {
    autoRotate: false,
    autoRotateSpeed: 0.3,
    enablePan: true,
    desktop: {
      fov: 32,
      pivot: TARGET,
      position: [-7.5, -3.5, 17],
      target: TARGET,
    },
    mobile: { fov: 40, pivot: TARGET, position: [-6, -3, 24], target: TARGET },
  },
};

export default CAMERA;
