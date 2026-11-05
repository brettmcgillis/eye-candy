import { INK } from '../kit';

const PITCH = 0.5;
// Bare bed round the jacks, and the room the top row's legends take.
const BORDER = 0.06;
const LEGEND_ROOM = 0.06;

export default function buildPatchBay(kit, { h, w }) {
  const { disc, slab, style } = kit;
  const cols = Math.max(2, Math.floor((w - 0.1) / PITCH));
  const rows = Math.max(1, Math.floor((h - 0.1) / PITCH));
  const jacks = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      jacks.push([
        (c - (cols - 1) / 2) * PITCH,
        ((rows - 1) / 2 - r) * PITCH - LEGEND_ROOM / 2,
      ]);
    }
  }
  const statics = [
    slab(
      0,
      0,
      (cols * PITCH) / 2 + BORDER,
      (rows * PITCH) / 2 + BORDER,
      0,
      0.012,
      style.rubber,
      0,
      'rbox'
    ),
  ];
  jacks.forEach(([x, y]) => {
    statics.push(
      disc(x, y, 0.12, 0.012, 0.06, style.metal, 'knurl'),
      disc(x, y, 0.07, 0.06, 0.06 + INK, style.hole),
      ...kit.legend(x, y + 0.19, 0.18, 0.022, { z0: 0.012 })
    );
  });
  return {
    statics,
    sockets: jacks.map(([x, y]) => ({
      family: 'eighth',
      p: [x, y, 0.06],
      scale: 1,
    })),
    signals: [],
    pose: null,
  };
}
