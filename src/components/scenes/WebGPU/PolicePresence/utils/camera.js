const TARGET = [-2, 2.6, -4];

// As in the painting: front three-quarters from the driver's side, nose at
// lower left, the smoke column leaning back over the upper frame.
const CAMERA = {
  defaultMode: 'orbit',
  far: 200,
  fov: 34,
  near: 0.1,
  orbit: {
    desktop: { pivot: TARGET, position: [2.6, 6.4, -14.8], target: TARGET },
    mobile: { pivot: TARGET, position: [3.8, 9, -21], target: TARGET },
  },
};

export default CAMERA;
