const TARGET = [0, 5.5, 0];

// Flora's camera (floraRender/camera.js) aimed at the fitted specimen, whose
// mycelium hangs below the soil line the rig fits around y = 5.5.
const CAMERA = {
  defaultMode: 'spline',
  far: 200,
  near: 0.05,
  spline: {
    closed: true,
    desktop: { fov: 30, target: TARGET },
    duration: 36,
    mobile: { fov: 34, target: TARGET },
    orientationMode: 'target',
    preset: 'Lateral Arc Sweep',
    showPath: false,
    tension: 0.35,
  },
  orbit: {
    autoRotate: false,
    autoRotateSpeed: 0.35,
    azimuthUnlimited: true,
    enablePan: false,
    desktop: { fov: 30, pivot: TARGET, position: [0, 6.5, 24], target: TARGET },
    mobile: { fov: 34, pivot: TARGET, position: [0, 6.5, 32], target: TARGET },
  },
};

export default CAMERA;
