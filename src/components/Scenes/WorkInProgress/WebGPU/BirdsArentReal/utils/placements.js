// Hand-placed perches for the fake birds. The scene no longer scatters birds
// procedurally — each bird sits at a deliberate spot in the urban set (see the
// scene todo). Order here is stable and drives both the Leva "Birds" folder and
// the rendered flock.
//
// Each slot's `pos`/`rotY` live in the preset under flat, globally-unique keys
// (`<key>Pos` / `<key>RotY`) so the preset matches the Leva schema 1:1. Keys are
// `bird*`-prefixed so they never collide with other folders (e.g. Street's
// `manholeRotY`). Leva requires every key to be unique across the whole panel.
//
// To add/remove a perch: add a slot here AND matching `<key>Pos`/`<key>RotY`
// entries in the preset.
//
// Optional per-slot statics (not Leva-tunable):
//   roll   - z-rotation in radians (e.g. PI/2 to lay a bird on its side)
//   animate: false - freeze this bird's body animation
//   still: true    - kill the camera-head sweep (no lens movement)

const BIRD_SLOTS = [
  { key: 'birdTrashRim', label: 'Trash Can Rim' },
  { key: 'birdManhole', label: 'By Manhole' },
  { key: 'birdBench', label: 'Bus Stop — Bench' },
  { key: 'birdGround', label: 'Bus Stop — Floor' },
  { key: 'birdRoofFrontA', label: 'Roof Front-Left A' },
  { key: 'birdRoofFrontB', label: 'Roof Front-Left B' },
  { key: 'birdRoofBack', label: 'Roof Back-Right' },
  { key: 'birdCrossbar', label: 'Bus Stop — Crossbar' },
  { key: 'birdNest', label: 'By the Nest' },
  // Sells the fake-ness: a busted bird on its side, frozen, lens dead, LED still on.
  {
    key: 'birdFallen',
    label: 'Fallen (on side)',
    roll: Math.PI / 2,
    animate: false,
    still: true,
  },
];

export const posKey = (slot) => `${slot.key}Pos`;
export const rotKey = (slot) => `${slot.key}RotY`;

export default BIRD_SLOTS;
