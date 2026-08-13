const TARGET = [0, 0, 0];

// generateTest rescales every test to fit a radius-7 sphere (see
// utils/testGenerator.js TARGET_RADIUS), so a fixed orbit distance frames
// any seed consistently.
const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [0, 4, 22],
      target: TARGET,
      pivot: TARGET,
      fov: 42,
    },
    mobile: {
      position: [0, 6, 28],
      target: TARGET,
      pivot: TARGET,
      fov: 50,
    },
  },
};

export default CAMERA;
