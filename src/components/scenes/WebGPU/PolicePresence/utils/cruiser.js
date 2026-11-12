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

export const ROOF_Y = 1.5;

// Where the fire burns: the cabin itself, the body of the blaze, rising
// through the roof, and the openings it licks out of. Each source is a point
// and the way its flames leave, grouped behind the scene's Fire toggles.
// Side windows face out, the glass ends lean along the car, the hood burns
// straight up. `core` sources sit inside the cabin.
export const OPENINGS = [
  {
    key: 'fireCabin',
    label: 'Cabin',
    vents: [
      { at: [0.05, 0.75, -4], core: true, out: [0, 1, 0], scale: 1.7 },
      { at: [-0.8, 0.75, -4], core: true, out: [0, 1, 0], scale: 1.6 },
    ],
  },
  {
    key: 'fireWindshield',
    label: 'Windshield',
    vents: [{ at: [0.55, 1.18, -4], out: [0.5, 1, 0] }],
  },
  {
    key: 'fireDriverWindow',
    label: 'Driver Windows',
    vents: [
      { at: [0.12, 1.12, -4.7], out: [0, 0.5, -1], scale: 0.8 },
      { at: [-0.68, 1.12, -4.72], out: [0, 0.5, -1], scale: 0.8 },
    ],
  },
  {
    key: 'firePassengerWindow',
    label: 'Passenger Windows',
    vents: [
      { at: [0.12, 1.12, -3.3], out: [0, 0.5, 1], scale: 0.8 },
      { at: [-0.68, 1.12, -3.28], out: [0, 0.5, 1], scale: 0.8 },
    ],
  },
  {
    key: 'fireRearWindow',
    label: 'Rear Window',
    vents: [{ at: [-1.35, 1.2, -4], out: [-0.6, 1, 0], scale: 0.9 }],
  },
  {
    key: 'fireHood',
    label: 'Hood',
    vents: [{ at: [1.55, 1.0, -4.05], out: [0.15, 1, 0], scale: 0.85 }],
  },
];

// Firelight in the cabin and under the hood, flickering out of phase. The
// first is the one that casts shadows.
export const FIRE_LIGHTS = [
  [-0.2, 2.1, -4],
  [0.6, 1.25, -4],
  [-1.1, 1.3, -4],
  [1.6, 1.3, -4],
];
