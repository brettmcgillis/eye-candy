// Lamp centres on the PoliceCruiser model, measured from its GLB (front at
// +x, the car centred on z = -4).

// The light bar's two glass halves, one rotating beacon in each.
export const BEACONS = [
  [-0.24, 1.44, -3.66],
  [-0.24, 1.44, -4.33],
];

// Two lamps a side, just proud of the glass.
export const HEADLIGHTS = [
  [2.27, 0.68, -4.67],
  [2.31, 0.68, -4.5],
  [2.31, 0.68, -3.5],
  [2.27, 0.68, -3.33],
];

// The upper tail-light lens each side, just behind the glass.
export const BRAKE_LIGHTS = [
  [-2.42, 0.71, -4.65],
  [-2.42, 0.71, -3.35],
];

export const CINDERBLOCKS = [
  { id: 'cinderBlock1', label: 'Front Left' },
  { id: 'cinderBlock2', label: 'Rear Left' },
  { id: 'cinderBlock3', label: 'Front Right' },
  { id: 'cinderBlock4', label: 'Rear Right' },
];
