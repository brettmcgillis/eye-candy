const TARGET = [0, 0.05, 0];

// Three-quarters above the hole, the whole field in frame.
const CAMERA = {
  defaultMode: 'orbit',
  far: 200,
  fov: 35,
  near: 0.02,
  orbit: {
    desktop: { pivot: TARGET, position: [1.5, 1.9, 2.3], target: TARGET },
    mobile: { pivot: TARGET, position: [2.2, 2.9, 3.4], target: TARGET },
  },
};

export default CAMERA;
