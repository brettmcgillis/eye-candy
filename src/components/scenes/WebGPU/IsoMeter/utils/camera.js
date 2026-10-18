const TARGET = [0, 0, 0];
const POSITION = [0, 0, 20];
const ISO = [80, 80, 80];

const CAMERA = {
  defaultMode: 'fixed',
  far: 1000,
  fixed: {
    activeShot: 'default',
    behavior: 'single',
    shots: {
      default: {
        desktop: { position: POSITION, target: TARGET },
        mobile: { position: POSITION, target: TARGET },
      },
    },
  },
  frustumHeight: 10,
  mobileFrustumHeight: 10,
  near: 0.1,
  orbit: {
    desktop: { pivot: TARGET, position: ISO, target: TARGET },
    mobile: { pivot: TARGET, position: ISO, target: TARGET },
  },
  projection: 'orthographic',
};

export default CAMERA;
