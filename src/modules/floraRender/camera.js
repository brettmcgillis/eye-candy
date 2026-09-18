const TARGET = [0, 5, 0];
const ORBIT_TARGET = [0, 6.2, 0];

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
    desktop: {
      fov: 30,
      pivot: ORBIT_TARGET,
      position: [0, 6.2, 26],
      target: ORBIT_TARGET,
    },
    mobile: {
      fov: 34,
      pivot: ORBIT_TARGET,
      position: [0, 6.2, 36],
      target: ORBIT_TARGET,
    },
  },
};

export default CAMERA;
