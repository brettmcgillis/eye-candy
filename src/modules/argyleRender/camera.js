const frame = { fov: 35, position: [0, 0, 80], target: [0, 0, 0] };
export default {
  defaultMode: 'orbit',
  projection: 'orthographic',
  frustumHeight: 28,
  mobileFrustumHeight: 32,
  near: 0.1,
  far: 250,
  fixed: {
    activeShot: 'default',
    behavior: 'single',
    shots: { default: { desktop: frame, mobile: frame } },
  },
  orbit: {
    autoRotate: false,
    enablePan: true,
    desktop: { ...frame, pivot: [0, 0, 0] },
    mobile: { ...frame, pivot: [0, 0, 0] },
  },
};
