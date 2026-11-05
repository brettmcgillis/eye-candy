const TARGET = [0, 0, 0];

// Square on to the panel, a little above it, close enough to read a knob.
const CAMERA = {
  defaultMode: 'orbit',
  far: 400,
  fov: 30,
  near: 0.1,
  orbit: {
    desktop: { pivot: TARGET, position: [-6, 5, 32], target: TARGET },
    mobile: { pivot: TARGET, position: [-6, 5, 52], target: TARGET },
  },
};

export default CAMERA;
