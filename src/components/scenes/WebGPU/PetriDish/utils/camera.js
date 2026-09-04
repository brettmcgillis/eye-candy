const TARGET = [0, 0, 0];

// Straight down on the bed, so the field reads as the flat 2D pattern the
// reference shader draws. The small z offset keeps the orbit controller off a
// degenerate look direction when the camera sits exactly on the up axis.
const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [0, 9.5, 0.01],
      target: TARGET,
      pivot: TARGET,
      fov: 46,
    },
    mobile: {
      position: [0, 12, 0.01],
      target: TARGET,
      pivot: TARGET,
      fov: 54,
    },
  },
};

export default CAMERA;
