const AXIS = [0, 0, 0];

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    enablePan: false,
    minDistance: 1,
    maxDistance: 20,
    maxDistanceUnlimited: false,
    minPolarAngle: 20,
    maxPolarAngle: 125,
    desktop: {
      position: [7, 0.5, 0],
      target: AXIS,
      pivot: AXIS,
      fov: 55,
    },
    mobile: {
      position: [7, 0.5, 0],
      target: AXIS,
      pivot: AXIS,
      fov: 68,
    },
  },
  fixed: {
    behavior: 'single',
    activeShot: 'rope',
    shots: {
      rope: {
        desktop: { position: [6, 0.5, 0], target: [-26, -6, 0], fov: 55 },
        mobile: { position: [6, 0.5, 0], target: [-26, -6, 0], fov: 68 },
      },
      overTheEdge: {
        desktop: { position: [21, 4, 0], target: [4, -70, 2], fov: 62 },
      },
      lookingUp: {
        desktop: { position: [0, -3, 0], target: [6, 60, 4], fov: 74 },
      },
      nearStair: {
        desktop: { position: [17, 1, 3], target: [31, -10, 12], fov: 50 },
      },
      heldFrame: {
        desktop: { position: [2, 0, 0], target: [28, -14, 0], fov: 82 },
      },
    },
  },
};

export default CAMERA;
