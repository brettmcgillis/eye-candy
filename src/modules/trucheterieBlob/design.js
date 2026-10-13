/* eslint-disable no-bitwise */
import { assembleField } from './field';
import { resolveConnections } from './grid';
import mulberry32 from './mulberry32';
import { hashSeed } from './rng';

// Mask bits 0-3 are the field's connectorMask sides (top, right, bottom, left);
// 64 pins the cell's choices: 16 pairs a four-way cell's other diagonal, 32 swaps its draw order.
export const ALT_PAIRING = 16;
export const SWAPPED_ORDER = 32;
export const PINNED_CHOICES = 64;
const MASK_BITS = 127;
export const DESIGN_MIN_GRID = 4;
export const DESIGN_MAX_GRID = 50;
const CODE_PREFIX = 'tb1.';

const opposite = (side) => (side + 2) % 4;
const hasSide = (mask, side) => (mask & (1 << side)) !== 0;
const withSide = (mask, side, on) =>
  on ? mask | (1 << side) : mask & ~(1 << side);

export function emptyDesign(gridSize) {
  const size = Math.round(
    Math.min(DESIGN_MAX_GRID, Math.max(DESIGN_MIN_GRID, gridSize))
  );
  return { cells: [], gridSize: size };
}

export function occupancy(design) {
  const { cells, gridSize } = design;
  const owner = new Int32Array(gridSize * gridSize).fill(-1);
  cells.forEach(({ column, row, size }, index) => {
    for (let c = column; c < column + size; c += 1) {
      for (let r = row; r < row + size; r += 1) {
        owner[r * gridSize + c] = index;
      }
    }
  });
  return owner;
}

function ownerAt(design, owner, column, row) {
  const { gridSize } = design;
  if (column < 0 || row < 0 || column >= gridSize || row >= gridSize) {
    return -1;
  }
  return owner[row * gridSize + column];
}

export function cellIndexAt(design, column, row) {
  return ownerAt(design, occupancy(design), column, row);
}

function sideProbes(cell, side) {
  const { column, row, size } = cell;
  return Array.from({ length: size }, (_, j) => {
    if (side === 0) return [column + j, row - 1];
    if (side === 1) return [column + size, row + j];
    if (side === 2) return [column + j, row + size];
    return [column - 1, row + j];
  });
}

function neighboursAlong(design, owner, index, side) {
  const found = new Set();
  const probes = sideProbes(design.cells[index], side);
  for (let i = 0; i < probes.length; i += 1) {
    const other = ownerAt(design, owner, probes[i][0], probes[i][1]);
    if (other < 0) return null;
    found.add(other);
  }
  return [...found];
}

// The reference's checkNeighborConnections: it is what guarantees every arc reaching an edge meets another.
function normalizeCells(design, cells) {
  const next = { ...design, cells: cells.map((cell) => ({ ...cell })) };
  const owner = occupancy(next);
  const along = next.cells.map((_, index) =>
    [0, 1, 2, 3].map((side) => neighboursAlong(next, owner, index, side))
  );
  const masks = next.cells.map(({ mask }, index) =>
    [0, 1, 2, 3].reduce(
      (acc, side) => (along[index][side] ? acc : withSide(acc, side, false)),
      mask
    )
  );
  const blocked = (index, side) =>
    along[index][side].some((other) => !hasSide(masks[other], opposite(side)));
  let changed = true;
  while (changed) {
    changed = false;
    for (let index = 0; index < masks.length; index += 1) {
      for (let side = 0; side < 4; side += 1) {
        if (hasSide(masks[index], side) && blocked(index, side)) {
          masks[index] = withSide(masks[index], side, false);
          changed = true;
        }
      }
    }
  }
  return {
    ...design,
    cells: next.cells.map((cell, index) => ({ ...cell, mask: masks[index] })),
  };
}

export function normalizeDesign(design) {
  return normalizeCells(design, design.cells);
}

// Sides are all-or-nothing across every neighbour, so opening one can open a whole run of them.
export function sideCascade(design, index, side) {
  const owner = occupancy(design);
  const seen = new Set();
  const queue = [[index, side]];
  const result = [];
  while (queue.length > 0) {
    const [cell, s] = queue.shift();
    const key = cell * 4 + s;
    if (!seen.has(key)) {
      seen.add(key);
      const others = neighboursAlong(design, owner, cell, s);
      if (!others) return null;
      result.push([cell, s]);
      others.forEach((other) => queue.push([other, opposite(s)]));
    }
  }
  return result;
}

export function setSide(design, index, side, open) {
  const cells = design.cells.map((cell) => ({ ...cell }));
  if (!open) {
    cells[index].mask = withSide(cells[index].mask, side, false);
    return normalizeCells(design, cells);
  }
  const cascade = sideCascade(design, index, side);
  if (!cascade) return design;
  cascade.forEach(([cell, s]) => {
    cells[cell].mask = withSide(cells[cell].mask, s, true);
  });
  return normalizeCells(design, cells);
}

export function toggleSide(design, index, side) {
  return setSide(design, index, side, !hasSide(design.cells[index].mask, side));
}

export function isSideOpen(design, index, side) {
  return hasSide(design.cells[index].mask, side);
}

export function canPlace(design, column, row, size) {
  const { gridSize } = design;
  if (size < 1 || column < 0 || row < 0) return false;
  if (column + size > gridSize || row + size > gridSize) return false;
  const owner = occupancy(design);
  for (let c = column; c < column + size; c += 1) {
    for (let r = row; r < row + size; r += 1) {
      if (owner[r * gridSize + c] >= 0) return false;
    }
  }
  return true;
}

export function placeCell(design, column, row, size, { connect = true } = {}) {
  if (!canPlace(design, column, row, size)) return design;
  let next = {
    ...design,
    cells: [...design.cells, { column, mask: 0, row, size }],
  };
  if (connect) {
    const index = next.cells.length - 1;
    [0, 1, 2, 3].forEach((side) => {
      next = setSide(next, index, side, true);
    });
  }
  return next;
}

export function eraseCell(design, index) {
  if (index < 0 || index >= design.cells.length) return design;
  return normalizeCells(
    design,
    design.cells.filter((_, i) => i !== index)
  );
}

const connectorsOf = (mask) => [0, 1, 2, 3].map((side) => hasSide(mask, side));

function canonicalConnections(connectors, mask) {
  return resolveConnections(connectors, () => (mask & ALT_PAIRING ? 1 : 0));
}

// Unpinned cells are seeded by position so editing one never reshuffles another.
function connectionsFor({ column, mask, row, size }) {
  const connectors = connectorsOf(mask);
  if (mask & PINNED_CHOICES) {
    const connections = canonicalConnections(connectors, mask);
    return mask & SWAPPED_ORDER ? connections.reverse() : connections;
  }
  const random = mulberry32(hashSeed(`${column},${row},${size}`));
  const connections = resolveConnections(connectors, random);
  connections.sort(() => (random() < 0.5 ? -1 : 1));
  return connections;
}

function choiceBits(connectors, connections) {
  const alt =
    connections.some(([type, edge]) => type === 2 && edge === 1) &&
    connectors.every(Boolean);
  const canonical = canonicalConnections(connectors, alt ? ALT_PAIRING : 0);
  const swapped =
    connections.length === 2 && connections[0][1] !== canonical[0][1];
  return (
    PINNED_CHOICES | (alt ? ALT_PAIRING : 0) | (swapped ? SWAPPED_ORDER : 0)
  );
}

function pinCell(cell) {
  if (cell.mask & PINNED_CHOICES) return cell;
  return {
    ...cell,
    mask:
      (cell.mask & 15) |
      choiceBits(connectorsOf(cell.mask), connectionsFor(cell)),
  };
}

export function pinChoices(design) {
  return { ...design, cells: design.cells.map(pinCell) };
}

export function cellConnections(design, index) {
  return connectionsFor(design.cells[index]);
}

export const canFlipDiagonal = (design, index) =>
  connectorsOf(design.cells[index].mask).every(Boolean);

export const canSwapOrder = (design, index) =>
  connectionsFor(design.cells[index]).length === 2;

function toggleChoice(design, index, bit) {
  const cells = [...design.cells];
  const pinned = pinCell(cells[index]);
  cells[index] = { ...pinned, mask: pinned.mask ^ bit };
  return { ...design, cells };
}

export function flipDiagonal(design, index) {
  if (index < 0 || !canFlipDiagonal(design, index)) return design;
  return toggleChoice(design, index, ALT_PAIRING);
}

export function swapOrder(design, index) {
  if (index < 0 || !canSwapOrder(design, index)) return design;
  return toggleChoice(design, index, SWAPPED_ORDER);
}

export function fieldFromDesign(design, canvasSize) {
  const drawn = [...design.cells]
    .sort((a, b) => (a.row !== b.row ? a.row - b.row : a.column - b.column))
    .map((cell) => ({
      cell: {
        column: cell.column,
        connectors: connectorsOf(cell.mask),
        row: cell.row,
        size: cell.size,
      },
      connections: connectionsFor(cell),
    }));
  return assembleField(drawn, design.gridSize, canvasSize);
}

// Pins every cell's choices, so the design draws exactly as the field did.
export function designFromField(field) {
  return {
    cells: field.cells.map(({ cell, connections }) => ({
      column: cell.column,
      mask:
        cell.connectors.reduce((acc, on, side) => withSide(acc, side, on), 0) |
        choiceBits(cell.connectors, connections),
      row: cell.row,
      size: cell.size,
    })),
    gridSize: field.gridSize,
  };
}

// Keeps the design centred; cells that no longer fit are dropped.
export function resizeDesign(design, gridSize) {
  const target = emptyDesign(gridSize).gridSize;
  const shift = Math.floor((target - design.gridSize) / 2);
  const fits = ({ column, row, size }) =>
    column >= 0 && row >= 0 && column + size <= target && row + size <= target;
  const cells = pinChoices(design)
    .cells.map((cell) => ({
      ...cell,
      column: cell.column + shift,
      row: cell.row + shift,
    }))
    .filter(fits);
  return normalizeCells({ ...design, gridSize: target }, cells);
}

export function designToJson(design, extra = {}) {
  return {
    ...extra,
    cells: design.cells.map(({ column, mask, row, size }) => [
      column,
      row,
      size,
      mask,
    ]),
    gridSize: design.gridSize,
  };
}

export function designFromJson(json) {
  if (!json || !Array.isArray(json.cells)) return null;
  const gridSize = Number(json.gridSize);
  if (
    !Number.isInteger(gridSize) ||
    gridSize < DESIGN_MIN_GRID ||
    gridSize > DESIGN_MAX_GRID
  ) {
    return null;
  }
  let design = { cells: [], gridSize };
  for (let i = 0; i < json.cells.length; i += 1) {
    const [column, row, size, mask] = json.cells[i].map(Number);
    if (![column, row, size, mask].every(Number.isInteger)) return null;
    if (!canPlace(design, column, row, size)) return null;
    design = {
      ...design,
      cells: [...design.cells, { column, mask: mask & MASK_BITS, row, size }],
    };
  }
  return normalizeDesign(design);
}

function toBase64Url(bytes) {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/gu, '-')
    .replace(/\//gu, '_')
    .replace(/[=]+$/u, '');
}

function fromBase64Url(text) {
  const binary = atob(text.replace(/-/gu, '+').replace(/_/gu, '/'));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function encodeDesign(design) {
  const bytes = new Uint8Array(1 + design.cells.length * 4);
  bytes[0] = design.gridSize;
  design.cells.forEach(({ column, mask, row, size }, i) => {
    bytes.set([column, row, size, mask], 1 + i * 4);
  });
  return `${CODE_PREFIX}${toBase64Url(bytes)}`;
}

export function decodeDesign(code) {
  if (typeof code !== 'string' || !code.startsWith(CODE_PREFIX)) return null;
  let bytes;
  try {
    bytes = fromBase64Url(code.slice(CODE_PREFIX.length));
  } catch {
    return null;
  }
  if (bytes.length < 1 || (bytes.length - 1) % 4 !== 0) return null;
  const cells = [];
  for (let i = 1; i < bytes.length; i += 4) {
    cells.push([...bytes.subarray(i, i + 4)]);
  }
  return designFromJson({ cells, gridSize: bytes[0] });
}

export const isDesignCode = (code) => decodeDesign(code) !== null;
