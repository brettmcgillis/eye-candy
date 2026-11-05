const TARGET = [0, 3.2, -1.5];

// Three-quarters on from the nose side, as in the painting: the plane low
// in the frame and the smoke rising above it.
const CAMERA = {
  defaultMode: 'orbit',
  far: 300,
  fov: 42,
  near: 0.1,
  orbit: {
    desktop: { pivot: TARGET, position: [13, 4.5, 19], target: TARGET },
    mobile: { pivot: TARGET, position: [19, 6.5, 28], target: TARGET },
  },
};

export default CAMERA;
