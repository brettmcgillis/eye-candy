import {
  axisAt,
  hash01,
  riseTo,
  uAtRise,
  wallRadiusAt,
} from '@modules/houseOfLeaves';

const TAU = Math.PI * 2;

// One grid for everything that touches the shaft wall. Rows are metres of
// depth below the room floor, columns are angle, and every consumer — the
// streamed wall, the patches cut for the landing mouths, the skirt at the
// bottom — indexes the same rows and columns, so what one draws meets what
// another draws vertex for vertex. Indexing by depth rather than by path
// means a landing's plateau, which consumes path without gaining depth, owns
// no rows at all.
export const ROW_METRES = 1.25;
export const COLUMNS = 192;

export default function createShaftGrid(p) {
  const rows = new Map();
  const rowData = (k) => {
    let row = rows.get(k);
    if (!row) {
      const depth = k * ROW_METRES;
      const u = uAtRise(depth, p);
      // Sampled at the depth itself, not at the path: uAtRise lands on a
      // plateau's start, and the profile is a function of depth anyway.
      const axis = axisAt(u, p);
      row = { u, y: -depth, axis, radius: wallRadiusAt(u, p) };
      rows.set(k, row);
    }
    return row;
  };
  const angleOf = (c) => (c / COLUMNS) * TAU;

  return {
    rowMetres: ROW_METRES,
    cols: COLUMNS,
    rowOfDepth: (depth) => depth / ROW_METRES,
    rowOfU: (u) => riseTo(u, p) / ROW_METRES,
    row: rowData,
    ring: (k, c) => {
      const row = rowData(k);
      const a = angleOf(c);
      return [
        row.axis.x + Math.cos(a) * row.radius,
        row.y,
        row.axis.z + Math.sin(a) * row.radius,
      ];
    },
    inward: (k, c) => {
      const a = angleOf(c);
      return [-Math.cos(a), 0, -Math.sin(a)];
    },
    colOf: (angle) => ((((angle % TAU) + TAU) % TAU) / TAU) * COLUMNS,
    angleOf,
    hash: (n) => hash01(n),
  };
}
