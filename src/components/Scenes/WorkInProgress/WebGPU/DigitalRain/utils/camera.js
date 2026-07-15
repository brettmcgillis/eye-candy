const TARGET = [0, 6, 0];

// Framed to keep the cloud (centered ~[0,8,0], ~16 wide/deep, 9 tall), the
// rain reaching down to the backdrop floor, and the backdrop's edges all in
// view at once (see todo.md's "show the edges of the backdrop").
const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [20, 13, 28],
      target: TARGET,
      pivot: TARGET,
      fov: 42,
    },
    mobile: {
      position: [26, 15, 34],
      target: TARGET,
      pivot: TARGET,
      fov: 52,
    },
  },
  fixed: {
    behavior: 'single',
    activeShot: 'hero',
    shots: {
      hero: {
        desktop: {
          position: [20, 13, 28],
          target: TARGET,
          fov: 42,
        },
      },
    },
  },
};

export default CAMERA;
