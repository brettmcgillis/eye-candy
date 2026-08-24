const TARGET = [0, 0, 0];
const FACE_DISTANCE = 22;

// Same axis-aligned points ViewHotkey.jsx cycles through on spacebar, in
// smooth-orbit order (y+ -> z+ -> y- -> z-) instead of that component's own
// cycle order, so Spline Motion sweeps past all 4 symmetry faces.
const FOUR_FACES_POINTS = [
  { position: [0, FACE_DISTANCE, 0] },
  { position: [0, 0, FACE_DISTANCE] },
  { position: [0, -FACE_DISTANCE, 0] },
  { position: [0, 0, -FACE_DISTANCE] },
];

// generateTest rescales every test to fit a radius-7 sphere (see
// utils/testGenerator.js TARGET_RADIUS), so a fixed orbit distance frames
// any seed consistently.
const CAMERA = {
  defaultMode: 'orbit',
  orbit: {
    desktop: {
      position: [0, 4, 22],
      target: TARGET,
      pivot: TARGET,
      fov: 42,
    },
    mobile: {
      position: [0, 6, 28],
      target: TARGET,
      pivot: TARGET,
      fov: 50,
    },
  },
  spline: {
    desktop: {
      target: TARGET,
      fov: 42,
    },
    mobile: {
      target: TARGET,
      fov: 50,
    },
    closed: true,
    preset: 'Four Faces',
    paths: {
      'Four Faces': {
        points: FOUR_FACES_POINTS,
      },
    },
  },
};

export default CAMERA;
