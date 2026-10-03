/* eslint-disable no-bitwise */
import buildHoleField from './holeField';

const STEP = 0.04;

// Marching-squares edges of a cell, by corner mask (bit 0 = bottom-left,
// counter-clockwise). Edges are 0 bottom, 1 right, 2 top, 3 left.
const CASES = [
  [],
  [[3, 0]],
  [[0, 1]],
  [[3, 1]],
  [[1, 2]],
  [
    [3, 2],
    [1, 0],
  ],
  [[0, 2]],
  [[3, 2]],
  [[2, 3]],
  [[2, 0]],
  [
    [0, 3],
    [2, 1],
  ],
  [[2, 1]],
  [[1, 3]],
  [[1, 0]],
  [[0, 3]],
  [],
];

function chain(segments) {
  const key = ([x, y]) => `${x.toFixed(5)},${y.toFixed(5)}`;
  const ends = new Map();
  segments.forEach((segment, index) => {
    segment.forEach((point) => {
      const k = key(point);
      if (!ends.has(k)) ends.set(k, []);
      ends.get(k).push(index);
    });
  });
  const used = new Uint8Array(segments.length);
  const lines = [];
  segments.forEach((first, start) => {
    if (used[start]) return;
    used[start] = 1;
    const line = [...first];
    const grow = (atEnd) => {
      for (;;) {
        const tip = atEnd ? line[line.length - 1] : line[0];
        const next = (ends.get(key(tip)) ?? []).find((i) => !used[i]);
        if (next == null) return;
        used[next] = 1;
        const [a, b] = segments[next];
        const other = key(a) === key(tip) ? b : a;
        if (atEnd) line.push(other);
        else line.unshift(other);
      }
    };
    grow(true);
    grow(false);
    lines.push(line);
  });
  return lines;
}

// The hole walls as closed polylines in the panel plane: the cutter's zero
// level, which is where the fillet meets the wall.
export default function holeOutlines(config, layout) {
  const originX = -layout.panelHalfWidth;
  const originY = -layout.panelHalfHeight;
  const cols = Math.ceil((layout.panelHalfWidth * 2) / STEP) + 1;
  const rows = Math.ceil((layout.panelHalfHeight * 2) / STEP) + 1;
  const field = buildHoleField({
    cols,
    fieldHalfHeight: layout.fieldHalfHeight,
    fieldHalfWidth: layout.fieldHalfWidth,
    holeMargin: config.holeMargin,
    holeScale: config.holeScale,
    holeThreshold: config.holeThreshold,
    holeWarp: config.holeWarp,
    originX,
    originY,
    rows,
    seed: config.holeSeed,
    step: STEP,
  });
  const at = (i, j) => field[j * cols + i];
  const segments = [];

  for (let j = 0; j < rows - 1; j += 1) {
    for (let i = 0; i < cols - 1; i += 1) {
      const v = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)];
      const mask =
        (v[0] < 0 ? 1 : 0) |
        (v[1] < 0 ? 2 : 0) |
        (v[2] < 0 ? 4 : 0) |
        (v[3] < 0 ? 8 : 0);
      const corner = [
        [i, j],
        [i + 1, j],
        [i + 1, j + 1],
        [i, j + 1],
      ];
      const cross = (edge) => {
        const a = edge;
        const b = (edge + 1) % 4;
        const t = v[a] / (v[a] - v[b]);
        return [
          originX + (corner[a][0] + (corner[b][0] - corner[a][0]) * t) * STEP,
          originY + (corner[a][1] + (corner[b][1] - corner[a][1]) * t) * STEP,
        ];
      };
      CASES[mask].forEach(([ea, eb]) => segments.push([cross(ea), cross(eb)]));
    }
  }

  return chain(segments);
}
