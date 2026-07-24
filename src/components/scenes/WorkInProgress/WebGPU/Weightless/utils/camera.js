const TARGET = [0, 0, 0];

// The bird is auto-fit to ~2.2 world units centered on the origin
// (ParticleBird normalizes the GLTF's raw placement), so the camera orbits
// the origin at a distance that frames it front and center.
const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [0, 0.2, 4],
      target: TARGET,
      pivot: TARGET,
      fov: 45,
    },
    mobile: {
      position: [0, 0.2, 5.2],
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
          position: [0, 0.2, 4],
          target: TARGET,
          fov: 45,
        },
      },
    },
  },
};

export default CAMERA;
