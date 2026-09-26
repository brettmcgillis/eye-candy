const TARGET = [0, 0.04, 0];

// Low and raking along the threads: the reference is a macro shot that sits
// almost in the plane of the field, which is what makes the flat stretches
// read as bands and the crests break the silhouette.
const CAMERA = {
  defaultMode: 'orbit',
  far: 100,
  near: 0.01,
  orbit: {
    autoRotate: false,
    autoRotateSpeed: 0.2,
    azimuthUnlimited: true,
    enablePan: true,
    desktop: {
      fov: 24,
      pivot: TARGET,
      position: [-1.9, 0.42, 1.75],
      target: TARGET,
    },
    mobile: {
      fov: 32,
      pivot: TARGET,
      position: [-2.3, 0.5, 2.1],
      target: TARGET,
    },
  },
};

export default CAMERA;
