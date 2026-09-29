const TARGET = [0, 0, 0];

const CAMERA = {
  defaultMode: 'fixed',
  far: 100,
  fixed: {
    activeShot: 'default',
    behavior: 'single',
    shots: {
      default: {
        desktop: { position: [0, 0, 20], target: TARGET },
        mobile: { position: [0, 0, 20], target: TARGET },
      },
    },
  },
  frustumHeight: 14,
  mobileFrustumHeight: 22,
  near: 0.1,
  orbit: {
    desktop: { pivot: TARGET, position: [0, 0, 20], target: TARGET },
    mobile: { pivot: TARGET, position: [0, 0, 20], target: TARGET },
  },
  projection: 'orthographic',
};

export default CAMERA;
