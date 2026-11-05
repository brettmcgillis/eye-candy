const TARGET = [-0.275, 0.289, -0.089];
// The rabbit faces +X and turns a little toward +Z while grazing.
const SUBJECT = [0.04, 0.2, 0.03];

const CAMERA = {
  defaultMode: 'spline',
  orbit: {
    desktop: {
      position: [-0.608, 0.375, -1.012],
      target: TARGET,
      pivot: TARGET,
      fov: 30,
    },
    mobile: {
      position: [-0.917, 0.454, -1.869],
      target: TARGET,
      pivot: TARGET,
      fov: 40,
    },
    autoRotate: false,
    minDistance: 0.4,
    maxDistance: 4,
    maxDistanceUnlimited: false,
    maxPolarAngle: 88,
  },
  spline: {
    preset: 'Front Arc',
    yaw: 80,
    position: [0.06, 0, 0.02],
    scale: [0.26, 0.26, 0.26],
    duration: 40,
    tension: 0.4,
    desktop: { target: SUBJECT, fov: 30 },
    mobile: { target: SUBJECT, fov: 55 },
  },
};

export default CAMERA;
