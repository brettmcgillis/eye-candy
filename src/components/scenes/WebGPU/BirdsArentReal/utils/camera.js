const TARGET = [0, 0.35, 0];

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [3.0, 1.1, 4.6],
      target: TARGET,
      pivot: TARGET,
      fov: 36,
    },
    mobile: {
      position: [3.6, 1.4, 6.0],
      target: TARGET,
      pivot: TARGET,
      fov: 50,
    },
  },
  fixed: {
    behavior: 'single',
    activeShot: 'hero',
    shots: {
      hero: {
        desktop: {
          position: [3.0, 1.1, 4.6],
          target: TARGET,
          fov: 36,
        },
      },
    },
  },
};

export default CAMERA;
