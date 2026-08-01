const TARGET = [0, 0.55, 0];

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [3.4, 1.7, 4.4],
      target: TARGET,
      pivot: TARGET,
      fov: 40,
    },
    mobile: {
      position: [4.2, 2.0, 5.4],
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
          position: [3.0, 1.4, 3.8],
          target: TARGET,
          fov: 38,
        },
      },
    },
  },
};

export default CAMERA;
