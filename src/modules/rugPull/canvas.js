import { R } from './palettes';

// The cartoon: one palette role per knot, painted in layers. A painter
// returns a role, or -1 to leave the knot as it is.
export default function createCanvas(cols, rows, fill = 0) {
  const roles = new Uint8Array(cols * rows).fill(fill);

  return {
    cols,
    roles,
    rows,

    get: (x, y) => roles[y * cols + x],

    set(x, y, role) {
      if (x >= 0 && y >= 0 && x < cols && y < rows) roles[y * cols + x] = role;
    },

    paint(x0, y0, x1, y1, painter) {
      const ax = Math.max(0, Math.floor(x0));
      const ay = Math.max(0, Math.floor(y0));
      const bx = Math.min(cols, Math.ceil(x1));
      const by = Math.min(rows, Math.ceil(y1));
      for (let y = ay; y < by; y += 1) {
        for (let x = ax; x < bx; x += 1) {
          const role = painter(x + 0.5, y + 0.5, x, y);
          if (role >= 0) roles[y * cols + x] = role;
        }
      }
    },
  };
}

const ACCENTS = [
  [R.red, 3],
  [R.blue, 3],
  [R.ivory, 2.5],
  [R.gold, 2],
  [R.green, 1.2],
  [R.rose, 1],
  [R.sky, 1],
  [R.camel, 1],
];

// Picks yarns that read against what they sit on. Luminance alone decides
// the outline; accents only avoid the ground they lie on and each other.
export function createInk(lum, rng) {
  const contrast = (a, b) => Math.abs(lum[a] - lum[b]);

  function weightedFrom(entries) {
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = rng() * total;
    for (let i = 0; i < entries.length; i += 1) {
      roll -= entries[i][1];
      if (roll <= 0) return entries[i][0];
    }
    return entries[entries.length - 1][0];
  }

  function lineOn(ground) {
    if (contrast(ground, R.dark) > 0.12) return R.dark;
    return lum[R.ivory] > lum[R.gold] ? R.ivory : R.gold;
  }

  function accent(ground, avoid = []) {
    const taken = new Set([ground, ...avoid]);
    const entries = ACCENTS.filter(([role]) => !taken.has(role)).map(
      ([role, w]) => [role, w * (0.25 + Math.min(contrast(role, ground), 0.4))]
    );
    return entries.length ? weightedFrom(entries) : R.ivory;
  }

  // A motif's yarns on a ground: an outline and three fills, all distinct.
  function set(ground) {
    const line = lineOn(ground);
    const a = accent(ground, [line]);
    const b = accent(ground, [line, a]);
    const c = accent(ground, [line, a, b]);
    return { a, b, c, ground, line };
  }

  return { accent, contrast, lineOn, set };
}
