const TARGET = [0, 0, -0.6];

const CAMERA = {
  defaultMode: 'orbit',
  near: 0.1,
  far: 80,
  orbit: {
    autoRotate: false,
    enablePan: false,
    minDistance: 4,
    maxDistance: 22,
    maxDistanceUnlimited: false,
    minPolarAngle: 55,
    maxPolarAngle: 125,
    azimuthUnlimited: false,
    minAzimuthAngle: -40,
    maxAzimuthAngle: 40,
    desktop: {
      fov: 30,
      pivot: TARGET,
      position: [0, 0, 14.4],
      target: TARGET,
    },
    mobile: {
      fov: 42,
      pivot: TARGET,
      position: [0, 0, 16],
      target: TARGET,
    },
  },
};

export default CAMERA;
