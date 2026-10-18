const TARGET = [0, 0, 0];

const CAMERA = {
  defaultMode: 'fixed',
  far: 10,
  fixed: {
    activeShot: 'default',
    behavior: 'single',
    shots: {
      default: {
        desktop: { position: [0, 0, 1], target: TARGET },
        mobile: { position: [0, 0, 1], target: TARGET },
      },
    },
  },
  frustumHeight: 2,
  near: 0.1,
  orbit: {
    desktop: { pivot: TARGET, position: [0, 0, 1], target: TARGET },
    mobile: { pivot: TARGET, position: [0, 0, 1], target: TARGET },
  },
  projection: 'orthographic',
};

export default CAMERA;
