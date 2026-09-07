// The walker owns the camera whenever Walk is on. These frames are what the
// scene falls back to with it off — an outside view for checking that the
// streamed geometry actually meets, and a shot the recorder can hold.
const CAMERA = {
  defaultMode: 'fixed',
  fixed: {
    behavior: 'single',
    activeShot: 'walk',
    shots: {
      walk: {
        desktop: { position: [0, 1.65, 0], target: [-12, 1.4, 0], fov: 72 },
        mobile: { position: [0, 1.65, 0], target: [-12, 1.4, 0], fov: 82 },
      },
      outside: {
        desktop: { position: [40, 26, 40], target: [0, -10, 0], fov: 55 },
      },
    },
  },
  orbit: {
    enablePan: true,
    minDistance: 2,
    maxDistance: 400,
    maxDistanceUnlimited: true,
    minPolarAngle: 5,
    maxPolarAngle: 165,
    desktop: { position: [30, 14, 30], target: [0, -6, 0], fov: 55 },
    mobile: { position: [40, 18, 40], target: [0, -6, 0], fov: 68 },
  },
};

export default CAMERA;
