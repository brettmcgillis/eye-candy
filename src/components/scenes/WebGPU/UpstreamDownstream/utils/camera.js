// Looking down the reach from above and a little to the side, not straight
// down. A stream reads as a stream because the water is going somewhere, and
// the only framing that shows that is one where the channel recedes: from
// nadir the flow direction is ambiguous and the scene becomes a pattern.
//
// The height and FOV are chosen together to keep the far bank inside the 36m
// domain at 16:9, with the fog set to swallow the boundary rather than the
// camera being pulled back off it.
const TARGET = [0, 0, -4];

const CAMERA = {
  defaultMode: 'spline',
  orbit: {
    desktop: {
      position: [6, 15, 20],
      target: TARGET,
      pivot: TARGET,
      fov: 34,
    },
    mobile: {
      position: [4, 17, 22],
      target: TARGET,
      pivot: TARGET,
      fov: 52,
    },
  },
  spline: {
    preset: 'Lateral Arc Sweep',
    desktop: {
      target: TARGET,
      fov: 34,
    },
    mobile: {
      target: TARGET,
      fov: 52,
    },
  },
};

export default CAMERA;
