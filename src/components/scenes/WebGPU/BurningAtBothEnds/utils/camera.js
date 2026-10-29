const TARGET = [0, 0.4, 0];

// Three-quarters on and a little above, far enough back for both flames
// and the floor's reflection.
const CAMERA = {
  defaultMode: 'orbit',
  far: 200,
  fov: 32,
  near: 0.05,
  orbit: {
    desktop: { pivot: TARGET, position: [6.5, 3.2, 14], target: TARGET },
    mobile: { pivot: TARGET, position: [8.5, 4, 21], target: TARGET },
  },
};

export default CAMERA;
