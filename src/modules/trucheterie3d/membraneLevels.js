// The membrane's display grids, one per Loop subdivision level. A strip of
// C columns and R rows becomes 2C (loop) or 2C - 1 columns and 2R - 1 rows,
// and the regular split keeps every level the same triangulated grid, so a
// level needs only its strip table and a per-vertex layout:
// (base, columns, rows, loop + 2·strip).
function splitTable(table) {
  const strips = table.length / 4;
  const next = new Float32Array(table.length);
  let base = 0;
  for (let s = 0; s < strips; s += 1) {
    const cols = table[s * 4 + 1];
    const rows = table[s * 4 + 2];
    const loop = table[s * 4 + 3];
    const nextCols = loop ? cols * 2 : cols * 2 - 1;
    const nextRows = rows * 2 - 1;
    next.set([base, nextCols, nextRows, loop], s * 4);
    base += nextCols * nextRows;
  }
  return { count: base, table: next };
}

function layoutOf({ count, table }) {
  const layout = new Float32Array(count * 4);
  for (let s = 0; s < table.length / 4; s += 1) {
    const [base, cols, rows, loop] = table.subarray(s * 4, s * 4 + 4);
    for (let v = base; v < base + cols * rows; v += 1) {
      layout.set([base, cols, rows, loop + 2 * s], v * 4);
    }
  }
  return layout;
}

function gridIndex({ count, table }) {
  let quads = 0;
  for (let s = 0; s < table.length / 4; s += 1) {
    const cols = table[s * 4 + 1];
    const across = table[s * 4 + 2] - 1;
    quads += (table[s * 4 + 3] ? cols : cols - 1) * across;
  }
  const index = new Uint32Array(quads * 6);
  let t = 0;
  for (let s = 0; s < table.length / 4; s += 1) {
    const [base, cols, rows, loop] = table.subarray(s * 4, s * 4 + 4);
    for (let c = 0; c < (loop ? cols : cols - 1); c += 1) {
      const next = (c + 1) % cols;
      for (let k = 0; k < rows - 1; k += 1) {
        const a = base + c * rows + k;
        const b = base + next * rows + k;
        index.set([a, a + 1, b + 1, a, b + 1, b], t);
        t += 6;
      }
    }
  }
  return { count, index };
}

export default function membraneLevels(membrane, level) {
  const levels = [{ count: membrane.pinned.length, table: membrane.strips }];
  for (let l = 1; l <= level; l += 1)
    levels.push(splitTable(levels[l - 1].table));
  const top = levels[level];
  const step = 2 ** level;
  const sampleOf = new Uint32Array(top.count);
  const simTable = membrane.strips;
  for (let s = 0; s < top.table.length / 4; s += 1) {
    const [base, cols, rows] = top.table.subarray(s * 4, s * 4 + 3);
    const simBase = simTable[s * 4];
    const simCols = simTable[s * 4 + 1];
    const simRows = simTable[s * 4 + 2];
    for (let c = 0; c < cols; c += 1) {
      const column = Math.round(c / step) % simCols;
      const sample = membrane.sampleOf[simBase + column * simRows];
      sampleOf.fill(sample, base + c * rows, base + (c + 1) * rows);
    }
  }
  return {
    index: gridIndex(top).index,
    levels: levels.map((entry, l) => ({
      ...entry,
      layout: l > 0 ? layoutOf(entry) : null,
    })),
    sampleOf,
  };
}
