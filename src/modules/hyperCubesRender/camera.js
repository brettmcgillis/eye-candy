const TARGET = [0, 0, 0];

// Both references look down the (1, 0.6, 1) diagonal through an orthographic
// lens four units tall.
const CAMERA = {
  defaultMode: 'orbit',
  far: 200,
  frustumHeight: 4.2,
  mobileFrustumHeight: 6,
  near: 0.1,
  orbit: {
    desktop: { pivot: TARGET, position: [12.5, 7.5, 12.5], target: TARGET },
    mobile: { pivot: TARGET, position: [12.5, 7.5, 12.5], target: TARGET },
  },
  projection: 'orthographic',
};

export default CAMERA;
