// Straight down, the way the reference footage is shot: no horizon, the frame
// itself is the composition. Held just off nadir so the grains present a lit
// face rather than only their tops.
//
// The height and FOV are chosen together to keep the whole frame inside the
// 48m domain at a 16:9 aspect, with a few metres of margin. Framing wider than
// that puts the edge of the grain field on screen, and the target is pushed
// shoreward so the coastline sits across the middle rather than at the top.
const TARGET = [0, 0, -6];

const CAMERA = {
  defaultMode: 'spline',
  orbit: {
    desktop: {
      position: [0, 40, -3],
      target: TARGET,
      pivot: TARGET,
      fov: 33,
    },
    mobile: {
      position: [0, 43, -5],
      target: TARGET,
      pivot: TARGET,
      fov: 50,
    },
  },
  spline: {
    preset: 'Wide Crossing Loop',
    desktop: {
      target: TARGET,
      fov: 33,
    },
    mobile: {
      target: TARGET,
      fov: 50,
    },
  },
};

export default CAMERA;
