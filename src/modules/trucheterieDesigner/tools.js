import {
  canFlipDiagonal,
  canPlace,
  canSwapOrder,
  cellConnections,
  cellIndexAt,
  connectedGroup,
  eraseCell,
  familySector,
  flipDiagonal,
  isSideOpen,
  moveCells,
  placeCell,
  setSide,
  sideCascade,
  swapOrder,
} from '@modules/trucheterieBlob';

export const DESIGN_TOOLS = [
  'off',
  'paint',
  'erase',
  'connect',
  'diagonal',
  'order',
  'move',
];

const CELL_TOOLS = {
  diagonal: { allowed: canFlipDiagonal, apply: flipDiagonal, marks: 2 },
  order: { allowed: canSwapOrder, apply: swapOrder, marks: 1 },
};

const cellUnder = (design, x, y) =>
  cellIndexAt(design, Math.floor(x), Math.floor(y));

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

export const MAX_BRUSH = 12;
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

const groupRects = (design, group, dx = 0, dy = 0) =>
  group.map((index) => {
    const { column, row, size } = design.cells[index];
    return [column + dx, row + dy, size];
  });

export function groupAt(design, x, y) {
  return connectedGroup(design, cellUnder(design, x, y));
}

// Where a drag of `group` by (dx, dy) lands: the moved design, or the base one with a blocked ghost.
export function moveGroup(base, group, dx, dy) {
  const design = moveCells(base, group, dx, dy);
  const ok = design !== base || (dx === 0 && dy === 0);
  return {
    design,
    preview: {
      kind: 'move',
      ok,
      rects: ok ? groupRects(design, group) : groupRects(base, group, dx, dy),
    },
  };
}

export function previewFor(design, tool, x, y, { autoConnect, brush }) {
  if (tool === 'move') {
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

export function applyTool(design, tool, x, y, { autoConnect, brush, first }) {
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
