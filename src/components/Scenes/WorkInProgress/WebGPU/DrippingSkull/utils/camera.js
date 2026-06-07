const TARGET = [0, 0.5, 0];

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [0, 1.1, 4.2],
      target: TARGET,
      pivot: TARGET,
      fov: 42,
    },
    mobile: {
      position: [0, 1.3, 5.2],
      target: TARGET,
      pivot: TARGET,
      fov: 56,
    },
  },
  fixed: {
    behavior: 'single',
    activeShot: 'hero',
    shots: {
      hero: {
        desktop: {
          position: [1.8, 1.3, 3.8],
          target: TARGET,
          fov: 42,
        },
      },
    },
  },
};

export default CAMERA;
