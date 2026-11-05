/* eslint-disable no-param-reassign */
import { part } from './parts';

const METAL = { c: [0.62, 0.64, 0.67], r: 0.23, m: 0.9 };
const INSULATOR = { c: [0.008, 0.008, 0.008], r: 0.8, m: 0 };
// Offsets run from the cable's end down the plug's axis; the first 0.32 is
// what shows above a jack's nut (a long tapered, ribbed strain-relief boot,
// the grip body and its collar), the rest is the shaft and tip inside it.
const PIECES = [
  { g: 'cap', offset: -0.035, radius: 0.042, half: 0.035, look: 'cable' },
  { g: 'cap', offset: -0.1, radius: 0.054, half: 0.032, look: 'cable' },
  { g: 'cap', offset: -0.155, radius: 0.064, half: 0.025, look: 'cable' },
  ...[-0.055, -0.09, -0.125].map((offset, i) => ({
    g: 'torus',
    offset,
    radius: 0.046 + i * 0.006,
    half: 0.007,
    look: 'cable',
  })),
  { g: 'knurl', offset: -0.235, radius: 0.085, half: 0.055, look: 'body' },
  { g: 'cyl', offset: -0.3, radius: 0.072, half: 0.012, look: METAL },
  { g: 'cyl', offset: -0.315, radius: 0.066, half: 0.006, look: INSULATOR },
  { g: 'cyl', offset: -0.39, radius: 0.045, half: 0.08, look: METAL },
  { g: 'cyl', offset: -0.482, radius: 0.045, half: 0.012, look: INSULATOR },
  { g: 'cyl', offset: -0.515, radius: 0.045, half: 0.02, look: METAL },
  {
    g: 'bullet',
    offset: -0.575,
    radius: 0.047,
    half: 0.04,
    look: METAL,
    flip: true,
  },
];
export const PLUG_PARTS_PER_END = PIECES.length;
export const PLUG_LENGTH = 0.615;

export function plugDirection(patch, id, end, out) {
  const rope = patch.world.ropes[id];
  const node = rope.start + (end === 0 ? 0 : rope.count - 1);
  const adjacent = node + (end === 0 ? 1 : -1);
  const p = patch.world.positions;
  const preview =
    patch.highlight &&
    patch.grabbed?.cable === id &&
    patch.grabbed?.end === end;
  if (patch.cables[id].ends[end] || preview) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 1;
    return;
  }
  if (
    patch.grabbed?.cable === id &&
    patch.grabbed?.end === end &&
    patch.grabbed.direction
  ) {
    out.set(patch.grabbed.direction);
    return;
  }
  const x = p[adjacent * 3] - p[node * 3];
  const y = p[adjacent * 3 + 1] - p[node * 3 + 1];
  const z = p[adjacent * 3 + 2] - p[node * 3 + 2];
  const length = Math.hypot(x, y, z) || 1;
  out[0] = x / length;
  out[1] = y / length;
  out[2] = z / length;
}

// A quarter-inch cord has a knurled metal barrel; an eighth-inch
// (Eurorack) one a moulded body in a deeper shade of its cable.
function lookOf(piece, cable) {
  if (piece.look === 'cable') return { c: cable.color, r: 0.65, m: 0 };
  if (piece.look !== 'body') return piece.look;
  if (cable.family === 'quarter') return METAL;
  return { c: cable.color.map((v) => v * 0.7), r: 0.45, m: 0 };
}

export function createPlugs(cables) {
  return cables.flatMap((cable) =>
    [0, 1].flatMap(() =>
      PIECES.map((piece) =>
        part(piece.g, [0, 0, 0], [1, 1, 1], lookOf(piece, cable), [0, 0, 0, 1])
      )
    )
  );
}

export function posePlug(parts, start, x, y, z, direction, scale) {
  const [dx, dy, dz] = direction;
  const length = Math.hypot(dx, dy, 1 + dz) || 1;
  const qx = dz < -0.9999 ? 1 : -dy / length;
  const qy = dz < -0.9999 ? 0 : dx / length;
  const qw = dz < -0.9999 ? 0 : (1 + dz) / length;
  for (let i = 0; i < PIECES.length; i += 1) {
    const spec = PIECES[i];
    const plug = parts[start + i];
    const offset = spec.offset * scale;
    plug.p[0] = x + dx * offset;
    plug.p[1] = y + dy * offset;
    plug.p[2] = z + dz * offset;
    plug.q[0] = spec.flip ? qw : qx;
    plug.q[1] = spec.flip ? 0 : qy;
    plug.q[2] = spec.flip ? -qy : 0;
    plug.q[3] = spec.flip ? -qx : qw;
    plug.s[0] = spec.radius * scale;
    plug.s[1] = spec.radius * scale;
    plug.s[2] = spec.half * scale;
  }
}
