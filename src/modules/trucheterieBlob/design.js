/* eslint-disable no-bitwise */
import { assembleField } from './field';
import { resolveConnections } from './grid';
import { familySector } from './laneChannels';
import mulberry32 from './mulberry32';
import { hashSeed } from './rng';

// Mask bits 0-3 are the field's connectorMask sides (top, right, bottom, left);
// 64 pins the cell's choices: 16 pairs a four-way cell's other diagonal, 32 swaps its draw order.
export const ALT_PAIRING = 16;
export const SWAPPED_ORDER = 32;
export const PINNED_CHOICES = 64;
const MASK_BITS = 127;
const MAX_CELL = 255;
const COORD_LIMIT = 32767;
const FRAME_MARGIN = 1;
const EMPTY_FRAME = 20;
// Clearance past a family's outermost arc that a cell sitting inside it must keep: covers the pen and the 3D tubes.
const INK_MARGIN = 0.5;
const CODE_PREFIX = 'tb2.';
const LEGACY_PREFIX = 'tb1.';

const opposite = (side) => (side + 2) % 4;
const hasSide = (mask, side) => (mask & (1 << side)) !== 0;
const withSide = (mask, side, on) =>
  on ? mask | (1 << side) : mask & ~(1 << side);

export function emptyDesign() {
  return { cells: [] };
}

export function designBounds({ cells }) {
  if (cells.length === 0) return null;
  let column = Infinity;
  let row = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  cells.forEach((cell) => {
    column = Math.min(column, cell.column);
    row = Math.min(row, cell.row);
    right = Math.max(right, cell.column + cell.size);
    bottom = Math.max(bottom, cell.row + cell.size);
  });
  return { column, height: bottom - row, row, width: right - column };
}

// The square the field is drawn in: the design's extent plus a margin, centred.
export function designFrame(design) {
  const bounds = designBounds(design);
  if (!bounds) {
    return {
      column: -EMPTY_FRAME / 2,
      row: -EMPTY_FRAME / 2,
      size: EMPTY_FRAME,
    };
  }
  const size = Math.max(bounds.width, bounds.height) + FRAME_MARGIN * 2;
  return {
    column: bounds.column - Math.floor((size - bounds.width) / 2),
    row: bounds.row - Math.floor((size - bounds.height) / 2),
    size,
  };
}

// A cell inside a bigger cell's empty corner owns those micro-cells, so bigger cells are written first.
export function occupancy(design) {
  const bounds = designBounds(design);
  if (!bounds) return () => -1;
  const { column: left, height, row: top, width } = bounds;
  const owner = new Int32Array(width * height).fill(-1);
  design.cells
    .map((cell, index) => [cell, index])
    .sort(([a], [b]) => b.size - a.size)
    .forEach(([{ column, row, size }, index]) => {
      for (let c = column; c < column + size; c += 1) {
        for (let r = row; r < row + size; r += 1) {
          owner[(r - top) * width + (c - left)] = index;
        }
      }
    });
  return (column, row) => {
    const c = column - left;
    const r = row - top;
    if (c < 0 || r < 0 || c >= width || r >= height) return -1;
    return owner[r * width + c];
  };
}

export function cellIndexAt(design, column, row) {
  return occupancy(design)(column, row);
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

function sideLine({ column, row, size }, side) {
  if (side === 0) return row;
  if (side === 1) return column + size;
  if (side === 2) return row + size;
  return column;
}

// A neighbour only counts if its facing side lies on the same grid line: one overlapping from inside a bigger cell may not.
function neighboursAlong(design, owner, index, side) {
  const cell = design.cells[index];
  const line = sideLine(cell, side);
  const found = new Set();
  const probes = sideProbes(cell, side);
  for (let i = 0; i < probes.length; i += 1) {
    const other = owner(probes[i][0], probes[i][1]);
    if (other < 0) return null;
    if (sideLine(design.cells[other], opposite(side)) !== line) return null;
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

function overlapOf(a, b) {
  const c0 = Math.max(a.column, b.column);
  const r0 = Math.max(a.row, b.row);
  const c1 = Math.min(a.column + a.size, b.column + b.size);
  const r1 = Math.min(a.row + a.size, b.row + b.size);
  return c0 < c1 && r0 < r1 ? [c0, r0, c1, r1] : null;
}

function inksAny(cell, [c0, r0, c1, r1]) {
  return connectionsFor(cell).some(([type, edge]) => {
    const { rMax, x, y } = familySector(cell, type, edge);
    const reach = rMax + INK_MARGIN;
    for (let c = c0; c < c1; c += 1) {
      for (let r = r0; r < r1; r += 1) {
        const dx = Math.max(c - x, 0, x - (c + 1));
        const dy = Math.max(r - y, 0, y - (r + 1));
        if (dx * dx + dy * dy < reach * reach) return true;
      }
    }
    return false;
  });
}

// Cells may overlap only where the bigger one's arcs never reach (both, for equal sizes).
export function inkClashes({ cells }) {
  let clashes = 0;
  for (let i = 0; i < cells.length; i += 1) {
    for (let j = i + 1; j < cells.length; j += 1) {
      const overlap = overlapOf(cells[i], cells[j]);
      if (overlap) {
        const a = cells[i];
        const b = cells[j];
        const hosts = a.size === b.size ? [a, b] : [a.size > b.size ? a : b];
        if (hosts.some((host) => inksAny(host, overlap))) clashes += 1;
      }
    }
  }
  return clashes;
}

const keepIfClear = (before, after) =>
  after !== before && inkClashes(after) === 0 ? after : before;

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

function changeSide(design, index, side, open) {
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

export function setSide(design, index, side, open) {
  return keepIfClear(design, changeSide(design, index, side, open));
}

export function toggleSide(design, index, side) {
  return setSide(design, index, side, !hasSide(design.cells[index].mask, side));
}

export function isSideOpen(design, index, side) {
  return hasSide(design.cells[index].mask, side);
}

const inRange = (column, row, size) =>
  Number.isInteger(size) &&
  size >= 1 &&
  size <= MAX_CELL &&
  [column, row].every(
    (value) =>
      Number.isInteger(value) &&
      value >= -COORD_LIMIT &&
      value + size <= COORD_LIMIT
  );

// Sides open one at a time, each kept only if it adds no clash, so a big cell can be placed around a small one.
export function placeCell(design, column, row, size, { connect = true } = {}) {
  if (!inRange(column, row, size)) return design;
  let next = normalizeDesign({
    ...design,
    cells: [...design.cells, { column, mask: 0, row, size }],
  });
  let clashes = inkClashes(next);
  if (connect) {
    const index = next.cells.length - 1;
    [0, 1, 2, 3].forEach((side) => {
      const opened = changeSide(next, index, side, true);
      if (opened === next) return;
      const after = inkClashes(opened);
      if (after <= clashes) {
        next = opened;
        clashes = after;
      }
    });
  }
  return clashes === 0 ? next : design;
}

export function canPlace(design, column, row, size, options) {
  return placeCell(design, column, row, size, options) !== design;
}

export function eraseCell(design, index) {
  if (index < 0 || index >= design.cells.length) return design;
  return keepIfClear(
    design,
    normalizeCells(
      design,
      design.cells.filter((_, i) => i !== index)
    )
  );
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
  return keepIfClear(design, { ...design, cells });
}

export function flipDiagonal(design, index) {
  if (index < 0 || !canFlipDiagonal(design, index)) return design;
  return toggleChoice(design, index, ALT_PAIRING);
}

export function swapOrder(design, index) {
  if (index < 0 || !canSwapOrder(design, index)) return design;
  return toggleChoice(design, index, SWAPPED_ORDER);
}

// The cells reachable from one through open sides: what the Move tool drags.
export function connectedGroup(design, index) {
  if (index < 0 || index >= design.cells.length) return [];
  const owner = occupancy(design);
  const seen = new Set([index]);
  const queue = [index];
  while (queue.length > 0) {
    const cell = queue.shift();
    [0, 1, 2, 3].forEach((side) => {
      if (!hasSide(design.cells[cell].mask, side)) return;
      (neighboursAlong(design, owner, cell, side) ?? []).forEach((other) => {
        if (!seen.has(other)) {
          seen.add(other);
          queue.push(other);
        }
      });
    });
  }
  return [...seen].sort((a, b) => a - b);
}

// Moved cells are pinned, since unpinned choices hash their position; a move that would change any side is refused.
export function moveCells(design, indices, dx, dy) {
  if (dx === 0 && dy === 0) return design;
  const moving = new Set(indices);
  const cells = design.cells.map((cell, index) =>
    moving.has(index)
      ? { ...pinCell(cell), column: cell.column + dx, row: cell.row + dy }
      : cell
  );
  if (!cells.every(({ column, row, size }) => inRange(column, row, size))) {
    return design;
  }
  const next = normalizeDesign({ ...design, cells });
  if (next.cells.some((cell, index) => cell.mask !== cells[index].mask)) {
    return design;
  }
  return inkClashes(next) === 0 ? next : design;
}

export const SYMMETRY_AXES = [
  'none',
  'vertical',
  'horizontal',
  'diagonal',
  'antidiagonal',
];

// Square on, the axes run down the grid's centre; turned onto its diagonal, corner to corner.
export function symmetryAxis(rotation, flip) {
  const turn = (((rotation ?? 0) % 90) + 90) % 90;
  const diagonal = Math.abs(turn - 45) < 22.5;
  if (diagonal) return flip ? 'antidiagonal' : 'diagonal';
  return flip ? 'horizontal' : 'vertical';
}

// Keeps an axis's parity but moves it to the family the rotation calls for.
export function alignSymmetry(axis, rotation) {
  if (!axis || axis === 'none') return 'none';
  return symmetryAxis(
    rotation,
    axis === 'horizontal' || axis === 'antidiagonal'
  );
}

const SIDE_MAPS = {
  antidiagonal: [1, 0, 3, 2],
  diagonal: [3, 2, 1, 0],
  horizontal: [2, 1, 0, 3],
  vertical: [0, 3, 2, 1],
};

const MIRRORS = {
  antidiagonal: {
    half: ({ column, row, size }, n) => column + row + size * 2 <= n,
    onAxis: ({ column, row, size }, n) => column + row + size === n,
    place: ({ column, row, size }, n) => [n - row - size, n - column - size],
  },
  diagonal: {
    half: ({ column, row, size }) => row >= column + size,
    onAxis: ({ column, row }) => column === row,
    place: ({ column, row }) => [row, column],
  },
  horizontal: {
    half: ({ row, size }, n) => (row + size) * 2 <= n,
    onAxis: ({ row, size }, n) => row * 2 + size === n,
    place: ({ column, row, size }, n) => [column, n - row - size],
  },
  vertical: {
    half: ({ column, size }, n) => (column + size) * 2 <= n,
    onAxis: ({ column, size }, n) => column * 2 + size === n,
    place: ({ column, row, size }, n) => [n - column - size, row],
  },
};

const mapSides = (mask, map) =>
  [0, 1, 2, 3].reduce(
    (acc, side) => withSide(acc, map[side], hasSide(mask, side)),
    0
  );

function mapConnection([type, edge], map) {
  if (type === 0) return [0, 0];
  if (type === 1) return [1, map[edge]];
  const a = map[edge];
  const b = map[(edge + 3) % 4];
  return [2, (b + 1) % 4 === a ? a : b];
}

function mirrorCell(cell, axis, n) {
  const map = SIDE_MAPS[axis];
  const [column, row] = MIRRORS[axis].place(cell, n);
  const sides = mapSides(cell.mask & 15, map);
  const connections = connectionsFor(cell).map((c) => mapConnection(c, map));
  return {
    column,
    mask: sides | choiceBits(connectorsOf(sides), connections),
    row,
    size: cell.size,
  };
}

// A cell on the axis must draw symmetrically: its sides are mirrored open, and only family sets that are their own mirror survive.
function balanceOnAxis(cell, axis) {
  const map = SIDE_MAPS[axis];
  let sides = (cell.mask & 15) | mapSides(cell.mask & 15, map);
  const count = connectorsOf(sides).filter(Boolean).length;
  if (count >= 3 && (axis === 'vertical' || axis === 'horizontal')) {
    const along = axis === 'vertical' ? [0, 2] : [1, 3];
    along.forEach((side) => {
      sides = withSide(sides, side, false);
    });
  }
  const alt = axis === 'antidiagonal' ? ALT_PAIRING : 0;
  return { ...cell, mask: sides | PINNED_CHOICES | alt };
}

// One half of a seeded field mirrored onto the other; cells straddling the axis are dropped unless centred on it.
export function symmetricDesign(design, gridSize, axis, { hideLoose } = {}) {
  const mirror = MIRRORS[axis];
  if (!mirror) return design;
  let half = pinChoices(design).cells.filter((cell) =>
    mirror.half(cell, gridSize)
  );
  let axisCells = design.cells
    .filter((cell) => mirror.onAxis(cell, gridSize))
    .map((cell) => balanceOnAxis(cell, axis));
  let result = design;
  for (let pass = 0; pass < 8; pass += 1) {
    const cells = [
      ...half,
      ...axisCells,
      ...half.map((cell) => mirrorCell(cell, axis, gridSize)),
    ];
    result = normalizeDesign({ cells });
    if (result.cells.every((cell, i) => cell.mask === cells[i].mask)) break;
    half = result.cells.slice(0, half.length);
    axisCells = result.cells
      .slice(half.length, half.length + axisCells.length)
      .map((cell) => balanceOnAxis(cell, axis));
  }
  if (!hideLoose) return result;
  return { cells: result.cells.filter((cell) => (cell.mask & 15) !== 0) };
}

export function fieldFromDesign(
  design,
  canvasSize,
  frame = designFrame(design)
) {
  const drawn = [...design.cells]
    .sort((a, b) => (a.row !== b.row ? a.row - b.row : a.column - b.column))
    .map((cell) => ({
      cell: {
        column: cell.column - frame.column,
        connectors: connectorsOf(cell.mask),
        row: cell.row - frame.row,
        size: cell.size,
      },
      connections: connectionsFor(cell),
    }));
  return assembleField(drawn, frame.size, canvasSize);
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
  };
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
  };
}

// Older files and codes carry a gridSize; the grid is unbounded now, so it is ignored.
export function designFromJson(json) {
  if (!json || !Array.isArray(json.cells)) return null;
  const cells = [];
  for (let i = 0; i < json.cells.length; i += 1) {
    if (!Array.isArray(json.cells[i])) return null;
    const [column, row, size, mask] = json.cells[i].map(Number);
    if (!inRange(column, row, size) || !Number.isInteger(mask)) return null;
    cells.push({ column, mask: mask & MASK_BITS, row, size });
  }
  const design = normalizeDesign({ cells });
  return inkClashes(design) === 0 ? design : null;
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

// tb2: per cell int16 column, int16 row, uint8 size, uint8 mask (little-endian).
export function encodeDesign(design) {
  const bytes = new Uint8Array(design.cells.length * 6);
  const view = new DataView(bytes.buffer);
  design.cells.forEach(({ column, mask, row, size }, i) => {
    view.setInt16(i * 6, column, true);
    view.setInt16(i * 6 + 2, row, true);
    view.setUint8(i * 6 + 4, size);
    view.setUint8(i * 6 + 5, mask);
  });
  return `${CODE_PREFIX}${toBase64Url(bytes)}`;
}

function cellsFromCode(code) {
  const legacy = code.startsWith(LEGACY_PREFIX);
  if (!legacy && !code.startsWith(CODE_PREFIX)) return null;
  const bytes = fromBase64Url(code.slice(CODE_PREFIX.length));
  if (legacy) {
    if (bytes.length < 1 || (bytes.length - 1) % 4 !== 0) return null;
    const cells = [];
    for (let i = 1; i < bytes.length; i += 4) {
      cells.push([...bytes.subarray(i, i + 4)]);
    }
    return cells;
  }
  if (bytes.length % 6 !== 0) return null;
  const view = new DataView(bytes.buffer);
  return Array.from({ length: bytes.length / 6 }, (_, i) => [
    view.getInt16(i * 6, true),
    view.getInt16(i * 6 + 2, true),
    view.getUint8(i * 6 + 4),
    view.getUint8(i * 6 + 5),
  ]);
}

export function decodeDesign(code) {
  if (typeof code !== 'string') return null;
  let cells;
  try {
    cells = cellsFromCode(code);
  } catch {
    return null;
  }
  return cells ? designFromJson({ cells }) : null;
}

export const isDesignCode = (code) => decodeDesign(code) !== null;
