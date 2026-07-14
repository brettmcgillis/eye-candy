const TARGET = [0, 0, 0];

// Default preset (level 7, matching ~/dev/examples/260708_AutomataChunks's
// own default) spans roughly ±38.4 world units per axis — the orbit sits
// back far enough to frame the whole structure without clipping the near
// field, angled slightly down to read the growth silhouette against the
// godray beam.
const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [64, 48, 96],
      target: TARGET,
      pivot: TARGET,
      fov: 45,
    },
    mobile: {
      position: [80, 60, 120],
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
          position: [64, 48, 96],
          target: TARGET,
          fov: 45,
        },
      },
    },
  },
};

export default CAMERA;
