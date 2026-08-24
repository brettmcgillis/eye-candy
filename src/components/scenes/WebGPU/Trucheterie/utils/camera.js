const TARGET = [0, 0, 0];

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: { position: [0, 0, 9], target: TARGET, pivot: TARGET, fov: 40 },
    mobile: { position: [0, 0, 12], target: TARGET, pivot: TARGET, fov: 45 },
  },
  fixed: {
    activeShot: 'default',
    behavior: 'single',
    shots: {
      default: {
        desktop: { fov: 40, position: [0, 0, 9], target: TARGET },
      },
    },
  },
};

export default CAMERA;
