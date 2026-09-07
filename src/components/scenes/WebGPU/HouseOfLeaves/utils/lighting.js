// There is no fill. The flashlight and, later, the flares and the column
// falling from the opening far above are the only light in the piece — the
// darkness is a material, not an absence of lamps.
//
// This slot exists so the blockout can be raised out of pure black while
// something is being positioned. Every preset leaves it at zero.
const LIGHTING = {
  fill: {
    type: 'ambient',
    color: '#6d7484',
    intensity: 0,
  },
};

export default LIGHTING;
