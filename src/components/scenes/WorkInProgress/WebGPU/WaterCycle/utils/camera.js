const TARGET = [0, 0, 0];

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [0, 24, 48],
      target: TARGET,
      pivot: TARGET,
      fov: 45,
    },
    mobile: {
      position: [0, 28, 58],
      target: TARGET,
      pivot: TARGET,
      fov: 52,
    },
  },
  fixed: {
    behavior: 'single',
    activeShot: 'overview',
    shots: {
      overview: {
        desktop: {
          position: [0, 26, 50],
          target: TARGET,
          fov: 45,
        },
      },
    },
  },
};

export default CAMERA;
