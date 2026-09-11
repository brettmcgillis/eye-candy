// Deep water sits at +z and the rock shelf at -z, so the default view stands
// out over the swell and looks in at the break.
const TARGET = [0, 0, -6];

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [4, 12, 26],
      target: TARGET,
      pivot: TARGET,
      fov: 42,
    },
    mobile: {
      position: [5, 16, 34],
      target: TARGET,
      pivot: TARGET,
      fov: 54,
    },
  },
};

export default CAMERA;
