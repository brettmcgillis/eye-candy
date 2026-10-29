const target = [0, 1.1, 0];
export default {
  defaultMode: 'orbit',
  projection: 'perspective',
  fov: 50,
  near: 0.01,
  far: 100,
  orbit: {
    desktop: { position: [0, 1.1, 3], target, pivot: target },
    mobile: { position: [0, 1.1, 4.8], target, pivot: target },
  },
};
