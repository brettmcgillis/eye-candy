import { DEG, TAU, part, quatZ, rot2 } from './parts';
import { hash01 } from './signals';

export const INK = 0.004;
const SPILL = 4;
const SPILL_GLOW = 0.35;
export const SWEEP = 300 * DEG;

// Knob pointers sweep 300° through 12 o'clock: 0 at seven, 1 at five.
export const pointerAngle = (v) => (0.5 - v) * SWEEP;

// The drawing helpers a control builds from, bound to its panel's style and
// its own random stream. Coordinates are the control's own, origin at its
// module's centre, one unit per grid cell.
export default function createKit(style, rng, { labelled = true } = {}) {
  const slab = (x, y, hw, hh, z0, z1, look, angle = 0, g = 'box') =>
    part(
      g,
      [x, y, (z0 + z1) / 2],
      [hw, hh, (z1 - z0) / 2],
      look,
      angle ? quatZ(angle) : undefined
    );

  const disc = (x, y, r, z0, z1, look, g = 'cyl', angle = 0) =>
    part(
      g,
      [x, y, (z0 + z1) / 2],
      [r, r, (z1 - z0) / 2],
      look,
      angle ? quatZ(angle) : undefined
    );

  const ink = (x, y, hw, hh, angle = 0, z0 = 0, look = style.legend) =>
    slab(x, y, hw, hh, z0, z0 + INK, look, angle);

  function ticks({
    count,
    from = -SWEEP / 2,
    look = style.legend,
    r0,
    r1,
    to = SWEEP / 2,
    width = 0.012,
    x = 0,
    y = 0,
    z0 = 0,
  }) {
    return Array.from({ length: count }, (_, i) => {
      const a = count > 1 ? from + ((to - from) * i) / (count - 1) : 0;
      const [dx, dy] = rot2(0, (r0 + r1) / 2, a);
      return ink(x + dx, y + dy, width / 2, (r1 - r0) / 2, a, z0, look);
    });
  }

  function dots({ count, from, r, size, to, x = 0, y = 0, z0 = 0 }) {
    return Array.from({ length: count }, (_, i) => {
      const a = count > 1 ? from + ((to - from) * i) / (count - 1) : 0;
      const [dx, dy] = rot2(0, r, a);
      return disc(x + dx, y + dy, size, z0, z0 + INK, style.legend);
    });
  }

  // A printed word rubbed by fingers: sometimes a gap worn through it,
  // sometimes its end gone, decided by where it sits so plots agree.
  function worn(left, w, y, height, z0, look) {
    const key = [Math.round(left * 1000), Math.round(y * 1000)];
    const roll = hash01(...key);
    const at = 0.2 + 0.6 * hash01(key[0] + 7, key[1]);
    const piece = (from, to) =>
      to - from > height * 0.2
        ? [ink((from + to) / 2, y, (to - from) / 2, height / 2, 0, z0, look)]
        : [];
    if (roll < 0.28) {
      const gap = height * (0.25 + 0.5 * hash01(key[0], key[1] + 3));
      const cut = left + w * at;
      return [...piece(left, cut - gap / 2), ...piece(cut + gap / 2, left + w)];
    }
    if (roll < 0.4) return piece(left, left + w * (0.55 + 0.4 * at));
    return piece(left, left + w);
  }
  // Greeked text: a line of word bars. Legends stay unreadable on purpose,
  // so no panel says whose it is.
  function greek(
    x,
    y,
    width,
    height,
    { align = 'center', look = style.legend, z0 = 0 } = {}
  ) {
    const words = [];
    let used = 0;
    while (used < width) {
      const word = height * (1.2 + rng() * 3.5);
      if (used + word > width && words.length > 0) break;
      words.push(Math.min(word, width));
      used += word + height * 0.9;
    }
    const total =
      words.reduce((sum, w) => sum + w, 0) + (words.length - 1) * height * 0.9;
    const shift = { left: 0, right: total }[align] ?? total / 2;
    let cursor = x - shift;
    return words.flatMap((w) => {
      const left = cursor;
      cursor += w + height * 0.9;
      return worn(left, w, y, height, z0, look);
    });
  }

  const legend = (x, y, width, height = 0.035, options = {}) =>
    labelled ? greek(x, y, width, height, options) : [];

  const hole = (x, y, r, z0 = 0) => disc(x, y, r, z0, z0 + 0.002, style.hole);

  // Fasteners vary as real ones do, by where they sit: slotted or
  // Phillips, some left a little proud, some duller with age.
  function screw(x, y, r = 0.045, z0 = 0) {
    const a = rng() * TAU;
    const kind = hash01(Math.round(x * 997), Math.round(y * 991));
    const proud = hash01(Math.round(x * 613), Math.round(y * 617)) < 0.3;
    const top = z0 + r * (proud ? 0.68 : 0.5);
    const head =
      kind < 0.25
        ? { ...style.brushed, c: style.brushed.c.map((v) => v * 0.62), r: 0.6 }
        : style.brushed;
    const slot = (angle) =>
      slab(x, y, r * 0.95, r * 0.14, top, top + r * 0.06, style.hole, angle);
    return [
      disc(x, y, r, z0, top, head),
      slot(a),
      ...(kind > 0.55 ? [slot(a + Math.PI / 2)] : []),
    ];
  }

  // The light a lit lamp throws on the surface round it.
  function spill(x, y, reach, z0, index, level) {
    if (level < 0.1) return [];
    return [
      part('glow', [x, y, z0 + 0.002], [reach, reach, 0.001], {
        c: [0, 0, 0],
        e: style.led(index, level * SPILL_GLOW).e,
        m: 0,
        r: 1,
      }),
    ];
  }
  function led(x, y, r, index, level, { square = false, z0 = 0 } = {}) {
    const look = style.led(index, level);
    const lit = spill(x, y, r * SPILL, z0, index, level);
    if (square) return [slab(x, y, r, r * 0.6, z0, z0 + r * 0.6, look), ...lit];
    return [
      disc(x, y, r * 1.25, z0, z0 + r * 0.25, style.knob),
      part('sphere', [x, y, z0 + r * 0.25], [r, r, r * 0.8], look),
      ...lit,
    ];
  }

  return {
    disc,
    dots,
    greek,
    hole,
    ink,
    led,
    legend,
    rng,
    screw,
    slab,
    spill,
    style,
    ticks,
  };
}
