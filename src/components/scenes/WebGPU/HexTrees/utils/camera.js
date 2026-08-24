// Default preset (3 trees, spacing 45, generationLimit 4) spans roughly
// ±40 world units, growing up from y=0 — the orbit target sits above ground
// level to frame the canopy rather than the trunk bases, pulled back far
// enough to hold the whole forest without clipping the near field.
const TARGET = [0, 18, 0];

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [65, 45, 95],
      target: TARGET,
      pivot: TARGET,
      fov: 45,
    },
    mobile: {
      position: [80, 55, 115],
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
          position: [65, 45, 95],
          target: TARGET,
          fov: 45,
        },
      },
    },
  },
};

export default CAMERA;
