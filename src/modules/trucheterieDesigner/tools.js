import {
  canFlipDiagonal,
  canPlace,
  canSwapOrder,
  cellConnections,
  cellIndexAt,
  eraseCell,
  familySector,
  flipDiagonal,
  isSideOpen,
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

export function brushOrigin(design, x, y, size) {
  const clamp = (value) => Math.min(Math.max(value, 0), design.gridSize - size);
  return [clamp(Math.round(x - size / 2)), clamp(Math.round(y - size / 2))];
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

export function previewFor(design, tool, x, y, { brush }) {
  if (tool === 'paint') {
    const [column, row] = brushOrigin(design, x, y, brush);
    return {
      kind: 'brush',
      ok: canPlace(design, column, row, brush),
      rect: [column, row, brush],
    };
  }
  if (tool === 'erase') {
    const index = cellIndexAt(design, Math.floor(x), Math.floor(y));
    if (index < 0) return null;
    const { column, row, size } = design.cells[index];
    return { kind: 'erase', ok: true, rect: [column, row, size] };
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
      ok: open || cascade !== null,
      opening: !open,
      sides: cascade ?? [[picked.index, picked.side]],
    };
  }
  return null;
}

export function applyTool(design, tool, x, y, { autoConnect, brush, first }) {
  if (tool === 'paint') {
    const [column, row] = brushOrigin(design, x, y, brush);
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
