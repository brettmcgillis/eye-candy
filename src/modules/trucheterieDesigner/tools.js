import {
  brushCell,
  canFlipDiagonal,
  canPlace,
  canReorder,
  canStraighten,
  canSwapOrder,
  cellConnections,
  cellIndexAt,
  connectedGroup,
  cornerCascade,
  cornerPoints,
  duplicateCells,
  eraseCell,
  familySector,
  flipDiagonal,
  isCornerOpen,
  isSideOpen,
  isTriangleDesign,
  latticeOffset,
  moveCells,
  pickCorner,
  placeCell,
  raiseCorner,
  setCorner,
  setSide,
  sideCascade,
  swapOrder,
  toggleStraight,
  triIndexAt,
  triangleGeometry,
} from '@modules/trucheterieBlob';

export const DESIGN_TOOLS = [
  'off',
  'paint',
  'erase',
  'connect',
  'diagonal',
  'order',
  'straight',
  'move',
  'duplicate',
];

export const isDragTool = (tool) => tool === 'move' || tool === 'duplicate';

const CELL_TOOLS = {
  diagonal: { allowed: canFlipDiagonal, apply: flipDiagonal, marks: 2 },
  order: { allowed: canSwapOrder, apply: swapOrder, marks: 1 },
  straight: { allowed: canStraighten, apply: toggleStraight, marks: 0 },
};

const cellUnder = (design, x, y) =>
  isTriangleDesign(design)
    ? triIndexAt(design, x, y)
    : cellIndexAt(design, Math.floor(x), Math.floor(y));

// A triangle cell's outline, in micro-cell units.
const cellPolygon = (design, index) =>
  cornerPoints(triangleGeometry(design.cells[index]));

// Points along a corner's two half-sides, as segments for the overlay.
export function halfSides(design, index, corner) {
  const points = cellPolygon(design, index);
  const [px, py] = points[corner];
  if (design.layout === 'subdivide')
    return [[px, py, ...points[(corner + 1) % 3]]];
  return [1, 2].map((step) => {
    const [qx, qy] = points[(corner + step) % 3];
    return [px, py, (px + qx) / 2, (py + qy) / 2];
  });
}

// The pivots the arcs turn about once the click lands: both for a diagonal, the top family for an order swap.
function pivotsAfter(design, index, tool) {
  const next = tool.apply(design, index);
  return cellConnections(next, index)
    .slice(0, tool.marks)
    .map(([type, edge]) => {
      const { x, y } = familySector(next.cells[index], type, edge);
      return [x, y];
    });
}

export const MAX_BRUSH = 32;
export const isStrokeTool = (tool) => tool === 'paint' || tool === 'erase';

export function brushOrigin(x, y, size) {
  return [Math.round(x - size / 2), Math.round(y - size / 2)];
}

// The side of the cell under (x, y) nearest the pointer, in micro-cell units.
export function pickSide(design, x, y) {
  const index = cellIndexAt(design, Math.floor(x), Math.floor(y));
  if (index < 0) return null;
  const { column, row, size } = design.cells[index];
  const distances = [y - row, column + size - x, row + size - y, x - column];
  const side = distances.indexOf(Math.min(...distances));
  return { index, side };
}

const groupPolys = (design, group, da, db) =>
  group.map((index) => {
    const cell = design.cells[index];
    return cornerPoints(
      triangleGeometry({
        ...cell,
        column: cell.column + da,
        row: cell.row + db,
      })
    );
  });

const groupRects = (design, group, dx = 0, dy = 0) =>
  group.map((index) => {
    const { column, row, size } = design.cells[index];
    return [column + dx, row + dy, size];
  });

export function groupAt(design, x, y) {
  return connectedGroup(design, cellUnder(design, x, y));
}

// Where a drag of `group` by (dx, dy) lands: the moved (or copied) design, or the base one with a blocked ghost.
// A drag in micro-cell units as the whole step a group moves by: grid cells,
// or a lattice translation on a triangle design.
export function dragStep(design, dx, dy) {
  return isTriangleDesign(design)
    ? latticeOffset(dx, dy)
    : [Math.round(dx), Math.round(dy)];
}

export function moveGroup(base, group, dx, dy, { copy = false } = {}) {
  const design = (copy ? duplicateCells : moveCells)(base, group, dx, dy);
  const ok = design !== base || (dx === 0 && dy === 0);
  return {
    design,
    preview: isTriangleDesign(base)
      ? { kind: 'move', ok, polys: groupPolys(base, group, dx, dy) }
      : { kind: 'move', ok, rects: groupRects(base, group, dx, dy) },
  };
}

// The corner the order tool puts on top, and the pivot of the fan on top afterwards.
function orderPreview(design, x, y) {
  const picked = pickCorner(design, x, y);
  if (!picked) return null;
  const { corner, index } = picked;
  const ok = canReorder(design, index);
  const next = raiseCorner(design, index, corner);
  const top = ok ? cellConnections(next, index)[0][1] % 3 : -1;
  return {
    kind: 'cell',
    marks: ok ? [cellPolygon(next, index)[top]] : [],
    ok,
    polys: [cellPolygon(design, index)],
  };
}

function trianglePreview(
  design,
  tool,
  x,
  y,
  { autoConnect, brush, orientation }
) {
  if (isDragTool(tool)) {
    const group = groupAt(design, x, y);
    if (group.length === 0) return null;
    return { kind: 'move', ok: true, polys: groupPolys(design, group, 0, 0) };
  }
  if (tool === 'paint') {
    const cell = brushCell(x, y, brush, orientation);
    return {
      kind: 'brush',
      ok: canPlace(design, cell.column, cell.row, cell.size, {
        connect: autoConnect,
        up: cell.up,
      }),
      polys: [cornerPoints(cell)],
    };
  }
  const index = cellUnder(design, x, y);
  if (index < 0) return null;
  if (tool === 'erase') {
    return {
      kind: 'erase',
      ok: eraseCell(design, index) !== design,
      polys: [cellPolygon(design, index)],
    };
  }
  if (tool === 'order') return orderPreview(design, x, y);
  if (tool === 'straight') {
    return {
      kind: 'cell',
      marks: [],
      ok: canStraighten(design, index),
      polys: [cellPolygon(design, index)],
    };
  }
  if (tool === 'connect') {
    const { corner } = pickCorner(design, x, y, { connector: true });
    const open = isCornerOpen(design, index, corner);
    const cascade = open
      ? [[index, corner]]
      : cornerCascade(design, index, corner);
    return {
      kind: 'sides',
      ok: setCorner(design, index, corner, !open) !== design,
      opening: !open,
      segments: (cascade ?? [[index, corner]]).flatMap(([cell, c]) =>
        halfSides(design, cell, c)
      ),
    };
  }
  return {
    kind: 'cell',
    marks: [],
    ok: false,
    polys: [cellPolygon(design, index)],
  };
}

function applyTriangleTool(
  design,
  tool,
  x,
  y,
  { autoConnect, brush, first, orientation }
) {
  if (tool === 'paint') {
    const cell = brushCell(x, y, brush, orientation);
    return placeCell(design, cell.column, cell.row, cell.size, {
      connect: autoConnect,
      up: cell.up,
    });
  }
  if (tool === 'erase') return eraseCell(design, cellUnder(design, x, y));
  if (!first) return design;
  if (tool === 'straight')
    return toggleStraight(design, cellUnder(design, x, y));
  const picked = pickCorner(design, x, y, { connector: tool === 'connect' });
  if (!picked) return design;
  if (tool === 'order') return raiseCorner(design, picked.index, picked.corner);
  if (tool === 'connect') {
    return setCorner(
      design,
      picked.index,
      picked.corner,
      !isCornerOpen(design, picked.index, picked.corner)
    );
  }
  return design;
}

export function previewFor(
  design,
  tool,
  x,
  y,
  { autoConnect, brush, orientation }
) {
  if (isTriangleDesign(design)) {
    return trianglePreview(design, tool, x, y, {
      autoConnect,
      brush,
      orientation,
    });
  }
  if (isDragTool(tool)) {
    const group = groupAt(design, x, y);
    if (group.length === 0) return null;
    return { kind: 'move', ok: true, rects: groupRects(design, group) };
  }
  if (tool === 'paint') {
    const [column, row] = brushOrigin(x, y, brush);
    return {
      kind: 'brush',
      ok: canPlace(design, column, row, brush, { connect: autoConnect }),
      rect: [column, row, brush],
    };
  }
  if (tool === 'erase') {
    const index = cellIndexAt(design, Math.floor(x), Math.floor(y));
    if (index < 0) return null;
    const { column, row, size } = design.cells[index];
    return {
      kind: 'erase',
      ok: eraseCell(design, index) !== design,
      rect: [column, row, size],
    };
  }
  if (CELL_TOOLS[tool]) {
    const index = cellUnder(design, x, y);
    if (index < 0) return null;
    const { column, row, size } = design.cells[index];
    const ok = CELL_TOOLS[tool].allowed(design, index);
    return {
      kind: 'cell',
      marks: ok ? pivotsAfter(design, index, CELL_TOOLS[tool]) : [],
      ok,
      rect: [column, row, size],
    };
  }
  if (tool === 'connect') {
    const picked = pickSide(design, x, y);
    if (!picked) return null;
    const open = isSideOpen(design, picked.index, picked.side);
    const cascade = open
      ? [[picked.index, picked.side]]
      : sideCascade(design, picked.index, picked.side);
    return {
      kind: 'sides',
      ok: setSide(design, picked.index, picked.side, !open) !== design,
      opening: !open,
      sides: cascade ?? [[picked.index, picked.side]],
    };
  }
  return null;
}

export function applyTool(
  design,
  tool,
  x,
  y,
  { autoConnect, brush, first, orientation }
) {
  if (isTriangleDesign(design)) {
    return applyTriangleTool(design, tool, x, y, {
      autoConnect,
      brush,
      first,
      orientation,
    });
  }
  if (tool === 'paint') {
    const [column, row] = brushOrigin(x, y, brush);
    return placeCell(design, column, row, brush, { connect: autoConnect });
  }
  if (tool === 'erase') {
    return eraseCell(design, cellIndexAt(design, Math.floor(x), Math.floor(y)));
  }
  if (CELL_TOOLS[tool] && first) {
    return CELL_TOOLS[tool].apply(design, cellUnder(design, x, y));
  }
  if (tool === 'connect' && first) {
    const picked = pickSide(design, x, y);
    if (!picked) return design;
    return setSide(
      design,
      picked.index,
      picked.side,
      !isSideOpen(design, picked.index, picked.side)
    );
  }
  return design;
}
