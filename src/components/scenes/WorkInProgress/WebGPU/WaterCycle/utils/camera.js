const TARGET = [0, 1, -8];

const CAMERA = {
  defaultMode: 'spline',
  spline: {
    desktop: {
      target: TARGET,
      fov: 40,
    },
    mobile: {
      target: TARGET,
      fov: 52,
    },
    preset: 'Loop de Loop',
    duration: 180,
    scale: [10, 10, 10],
  },
  orbit: {
    desktop: {
      position: [0, 8, 30],
      target: TARGET,
      pivot: TARGET,
      fov: 40,
    },
    mobile: {
      position: [0, 9, 36],
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
          position: [0, 8, 30],
          target: TARGET,
          fov: 40,
        },
      },
    },
  },
};

export default CAMERA;
