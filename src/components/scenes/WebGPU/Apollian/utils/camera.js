const TARGET = [0, 0, 0];

// Matches the shader's own camera (ro = [-4, 1, 0], focal 3.0 → ~36.9° vfov)
// so switching View from Shader Camera to Scene Camera lands on the same shot.
const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [-4, 1, 0.001],
      target: TARGET,
      pivot: TARGET,
      fov: 37,
    },
    mobile: {
      position: [-5, 1.25, 0.001],
      target: TARGET,
      pivot: TARGET,
      fov: 45,
    },
  },
  fixed: {
    behavior: 'single',
    activeShot: 'hero',
    shots: {
      hero: {
        desktop: {
          position: [-4, 1, 0.001],
          target: TARGET,
          fov: 37,
        },
      },
    },
  },
};

export default CAMERA;
