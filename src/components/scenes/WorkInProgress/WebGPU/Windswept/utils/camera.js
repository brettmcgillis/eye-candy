const TARGET = [0, 0, 0];

// The swarm is origin-centered; at the default worldScale (1.4) the Thomas
// Labyrinth manifold spans roughly ±6-7 world units, so the orbit sits back
// far enough to frame it without clipping the near field.
const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [0, 4, 14],
      target: TARGET,
      pivot: TARGET,
      fov: 45,
    },
    mobile: {
      position: [0, 5, 18],
      target: TARGET,
      pivot: TARGET,
      fov: 55,
    },
  },
  fixed: {
    behavior: 'single',
    activeShot: 'hero',
    shots: {
      hero: {
        desktop: {
          position: [0, 4, 14],
          target: TARGET,
          fov: 45,
        },
      },
    },
  },
};

export default CAMERA;
