const TARGET = [0, 1.0, 0];

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [-2.2, 1.6, 6.4],
      target: TARGET,
      pivot: TARGET,
      fov: 42,
    },
    mobile: {
      position: [-2.4, 1.8, 8.0],
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
          position: [-2.2, 1.6, 6.4],
          target: TARGET,
          fov: 42,
        },
      },
    },
  },
};

export default CAMERA;
