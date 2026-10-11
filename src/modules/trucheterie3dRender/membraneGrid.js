import {
  Fn,
  If,
  cross,
  float,
  instanceIndex,
  int,
  length,
  uint,
  vec3,
  vec4,
} from 'three/tsl';

// Every strip, at every level, is the same triangulated grid; these are its
// six neighbours, as (column, row) steps.
export const RING = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [-1, -1],
];

// A vertex of a strip grid, decoded from its layout (base, columns, rows,
// loop + 2·strip).
export function gridVertex(layout, i) {
  const m = layout.element(i);
  const base = int(m.x);
  const cols = int(m.y);
  const rows = int(m.z);
  const local = int(i).sub(base);
  const flags = int(m.w);
  return {
    base,
    col: local.div(rows),
    cols,
    loop: flags.mod(2).equal(1),
    row: local.mod(rows),
    rows,
    strip: flags.div(2),
  };
}

export const wrapColumn = (c, cols, loop) =>
  loop.select(c.add(cols).mod(cols), c.clamp(0, cols.sub(1)));

// A simulation vertex's flags (rest.w): pinned + 2 · on the bottom skin.
export const isPinned = (flags) => flags.mod(2).greaterThan(0.5);
export const skinSide = (flags) =>
  flags.greaterThan(1.5).select(float(-1), float(1));

// Central differences across a grid: +Z where it lies flat, whichever skin
// it is. Along a row collapsed to a point (a pivot, a cut end) the row
// tangent is rounding noise, so it is taken from the next row in.
export function createNormalPass({ count, layout, name, normals, positions }) {
  return Fn(() => {
    const i = instanceIndex;
    const v = gridVertex(layout, i);
    const at = (c, k) =>
      positions.element(
        uint(v.base.add(wrapColumn(c, v.cols, v.loop).mul(v.rows)).add(k))
      ).xyz;
    const alongRow = (k) => at(v.col.add(1), k).sub(at(v.col.sub(1), k));
    const inward = v.row
      .equal(0)
      .select(int(1), v.row.equal(v.rows.sub(1)).select(v.rows.sub(2), v.row));
    const along = alongRow(v.row).toVar();
    If(length(along).lessThan(1e-5), () => {
      along.assign(alongRow(inward));
    });
    const across = at(v.col, v.row.add(1).min(v.rows.sub(1))).sub(
      at(v.col, v.row.sub(1).max(0))
    );
    const n = cross(along, across).toVar();
    If(length(n).lessThan(float(1e-12)), () => {
      n.assign(vec3(0, 0, 1));
    });
    normals.element(i).assign(vec4(n.normalize(), 0));
  })()
    .compute(count)
    .setName(name);
}
