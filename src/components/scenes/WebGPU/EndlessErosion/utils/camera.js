const TARGET = [0, 0.4, 0];

// The reference frames the terrain on a long lens from a shallow rise: distance
// 3.25 at a 24.6 degree elevation resolves to this orbit position, and the
// 60-second spin is one revolution per minute.
const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    autoRotate: true,
    autoRotateSpeed: 1,
    azimuthUnlimited: true,
    desktop: {
      position: [-2.81, 1.75, -0.91],
      target: TARGET,
      pivot: TARGET,
      fov: 11,
    },
    mobile: {
      position: [-3.4, 2.1, -1.1],
      target: TARGET,
      pivot: TARGET,
      fov: 16,
    },
  },
  fixed: {
    behavior: 'single',
    activeShot: 'ridge',
    shots: {
      ridge: {
        desktop: {
          position: [-2.81, 1.75, -0.91],
          target: TARGET,
          fov: 11,
        },
      },
    },
  },
};

export default CAMERA;
