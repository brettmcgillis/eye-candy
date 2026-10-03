// Level k sits at (k + offset) / levels; band k is the field between level k
// and level k + 1 and stands at level k's height (never below 0).
export const levelValue = (k, config) =>
  (k + config.levelOffset) / config.levels;
export const bandOf = (f, config) =>
  Math.floor(f * config.levels - config.levelOffset);
export const bandHeight = (k, config) => Math.max(levelValue(k, config), 0);

// The levels a field spanning [lo, hi] crosses: lo < level <= hi.
export function levelRange(lo, hi, config) {
  return [
    Math.floor(lo * config.levels - config.levelOffset) + 1,
    Math.floor(hi * config.levels - config.levelOffset),
  ];
}

// Marching squares over the grid, every crossed level at once, chained into
// polylines. A cell is walked counter-clockwise and each exit from the
// region f >= level is joined to an entry, so a segment always has the
// higher ground on its left and a crossing on a shared edge ends one cell's
// segment and starts its neighbour's. Saddles follow the cell's centre (the
// bilinear surface the shaders sample), so the walls meet the caps.
export default function traceContours(values, { aspect, nx, ny }, config) {
  const row = nx + 1;
  const hCount = nx * (ny + 1);
  const edges = hCount + (nx + 1) * ny;
  const cellX = (2 * aspect) / nx;
  const cellY = 2 / ny;
  const { levelOffset, levels } = config;
  const next = new Map();
  const hasPrevious = new Set();
  const slot = new Map();
  let coords = new Float64Array(4096);
  let used = 0;
  const keys = [0, 0, 0, 0];
  const entering = [false, false, false, false];
  const corners = [0, 0, 0, 0];
  const cellEdges = [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ];
  const setEdge = (e, id, a, b, ax, ay, bx, by) => {
    const edge = cellEdges[e];
    edge[0] = id;
    edge[1] = a;
    edge[2] = b;
    edge[3] = ax;
    edge[4] = ay;
    edge[5] = bx;
    edge[6] = by;
  };

  const crossing = (key, level, [, a, b, ax, ay, bx, by]) => {
    if (!slot.has(key)) {
      if (used + 2 > coords.length) {
        const grown = new Float64Array(coords.length * 2);
        grown.set(coords);
        coords = grown;
      }
      const t = (level - values[a]) / (values[b] - values[a]);
      coords[used] = -aspect + (ax + (bx - ax) * t) * cellX;
      coords[used + 1] = -1 + (ay + (by - ay) * t) * cellY;
      slot.set(key, used);
      used += 2;
    }
    return key;
  };

  for (let j = 0; j < ny; j += 1) {
    for (let i = 0; i < nx; i += 1) {
      const c0 = j * row + i;
      const c1 = c0 + 1;
      const c2 = c1 + row;
      const c3 = c0 + row;
      corners[0] = values[c0];
      corners[1] = values[c1];
      corners[2] = values[c2];
      corners[3] = values[c3];
      const lo = Math.min(corners[0], corners[1], corners[2], corners[3]);
      const hi = Math.max(corners[0], corners[1], corners[2], corners[3]);
      const kLo = Math.floor(lo * levels - levelOffset) + 1;
      const kHi = Math.floor(hi * levels - levelOffset);
      // eslint-disable-next-line no-continue
      if (kLo > kHi) continue;
      const centre = (corners[0] + corners[1] + corners[2] + corners[3]) / 4;
      // Canonical endpoint order (lower vertex first) so both cells sharing
      // an edge compute the identical crossing.
      setEdge(0, j * nx + i, c0, c1, i, j, i + 1, j);
      setEdge(1, hCount + j * row + i + 1, c1, c2, i + 1, j, i + 1, j + 1);
      setEdge(2, (j + 1) * nx + i, c3, c2, i, j + 1, i + 1, j + 1);
      setEdge(3, hCount + j * row + i, c0, c3, i, j, i, j + 1);
      for (let k = kLo; k <= kHi; k += 1) {
        const level = (k + levelOffset) / levels;
        let count = 0;
        let exits = 0;
        for (let e = 0; e < 4; e += 1) {
          const inA = corners[e] >= level;
          const inB = corners[(e + 1) % 4] >= level;
          if (inA !== inB) {
            keys[count] = crossing(
              k * edges + cellEdges[e][0],
              level,
              cellEdges[e]
            );
            entering[count] = !inA;
            if (inA) exits += 1;
            count += 1;
          }
        }
        const step = exits < 2 || centre >= level ? 1 : -1;
        for (let n = 0; n < count; n += 1) {
          if (!entering[n]) {
            let m = n;
            do {
              m = (m + step + count) % count;
            } while (!entering[m]);
            next.set(keys[n], keys[m]);
            hasPrevious.add(keys[m]);
          }
        }
      }
    }
  }

  const lines = [];
  const follow = (first) => {
    const k = Math.floor(first / edges);
    const out = [];
    let key = first;
    let closed = false;
    out.push(coords[slot.get(key)], coords[slot.get(key) + 1]);
    while (next.has(key)) {
      const end = next.get(key);
      next.delete(key);
      if (end === first) {
        closed = true;
        break;
      }
      out.push(coords[slot.get(end)], coords[slot.get(end) + 1]);
      key = end;
    }
    lines.push({
      closed,
      k,
      level: levelValue(k, config),
      points: Float32Array.from(out),
    });
  };
  [...next.keys()]
    .filter((key) => !hasPrevious.has(key))
    .forEach((key) => follow(key));
  [...next.keys()].forEach((key) => {
    if (next.has(key)) follow(key);
  });
  return lines;
}
