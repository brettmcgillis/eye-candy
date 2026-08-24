const TARGET = [0, 0.7, 0];

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [3.4, 1.5, 5.6],
      target: TARGET,
      pivot: TARGET,
      fov: 38,
    },
    mobile: {
      position: [3.8, 1.8, 7.2],
      target: TARGET,
      pivot: TARGET,
      fov: 52,
    },
  },
  fixed: {
    behavior: 'single',
    activeShot: 'hero',
    shots: {
      hero: {
        desktop: {
          position: [3.4, 1.5, 5.6],
          target: TARGET,
          fov: 38,
        },
      },
    },
  },
};

export default CAMERA;
