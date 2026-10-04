const TARGET = [0, 0.2, 0];

const CAMERA = {
  defaultMode: 'orbit',
  far: 200,
  near: 0.05,
  orbit: {
    autoRotate: false,
    autoRotateSpeed: 0.3,
    desktop: {
      fov: 30,
      pivot: TARGET,
      position: [0, 9.5, 12.5],
      target: TARGET,
    },
    mobile: { fov: 40, pivot: TARGET, position: [0, 12, 16], target: TARGET },
  },
};

export default CAMERA;
