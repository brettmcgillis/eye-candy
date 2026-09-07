const TARGET = [24, -3, 4];

const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    enablePan: true,
    minDistance: 1,
    maxDistance: 400,
    minPolarAngle: 5,
    maxPolarAngle: 170,
    desktop: { position: [40, 14, 34], target: TARGET, pivot: TARGET, fov: 45 },
    mobile: { position: [52, 18, 44], target: TARGET, pivot: TARGET, fov: 58 },
  },
};

export default CAMERA;
