/* eslint-disable no-bitwise */
import { assembleField } from './field';
import { resolveConnections } from './grid';
import { familySector } from './laneChannels';
import mulberry32 from './mulberry32';
import { hashSeed } from './rng';
import {
  canStraightenTri,
  designFromTriField,
  duplicateTriCells,
  emptyTriDesign,
  eraseTriCell,
  fieldFromTriDesign,
  inRange as inTriRange,
  isTriangleDesign,
  moveTriCells,
  normalizeTriDesign,
  pinTriChoices,
  placeTriCell,
  symmetricTriDesign,
  toggleTriStraight,
  triCellConnections,
  triConnectedGroup,
  triDesignBounds,
  triDesignFrame,
  triInkClashes,
} from './triDesign';
import { TRIANGLE } from './triangle';

// Mask bits 0-3 are the field's connectorMask sides (top, right, bottom, left);
// 64 pins the cell's choices: 16 pairs a four-way cell's other diagonal, 32 swaps its draw order.
export const ALT_PAIRING = 16;
export const SWAPPED_ORDER = 32;
export const PINNED_CHOICES = 64;
// 128 draws a cell with one pair of opposite sides open as straight lanes (plus a stub on a third open side).
export const STRAIGHT = 128;
const MASK_BITS = 255;
const MAX_CELL = 255;
const COORD_LIMIT = 32767;
const FRAME_MARGIN = 1;
const EMPTY_FRAME = 20;
// Clearance past a family's outermost arc that a cell sitting inside it must keep: covers the pen and the 3D tubes.
const INK_MARGIN = 0.5;
const CODE_PREFIX = 'tb2.';
const IRREGULAR_PREFIX = 'tb3.';
const LEGACY_PREFIX = 'tb1.';
const TRIANGLE_PREFIX = 'tb4.';
const TRIANGLE_IRREGULAR_PREFIX = 'tb5.';
const TRIANGLE_SUBDIVISION_PREFIX = 'tb6.';
const TRIANGLE_EDGE_PREFIX = 'tb7.';
const TRIANGLE_EDGE_IRREGULAR_PREFIX = 'tb8.';
const IRREGULAR_CHANCE = 0.6;

const opposite = (side) => (side + 2) % 4;
const hasSide = (mask, side) => (mask & (1 << side)) !== 0;
const withSide = (mask, side, on) =>
  on ? mask | (1 << side) : mask & ~(1 << side);

export function emptyDesign({ irregular = false, layout, shape } = {}) {
  if (shape === TRIANGLE) return emptyTriDesign({ irregular, layout });
  return irregular ? { cells: [], irregular: true } : { cells: [] };
}

export function designBounds(design) {
  const { cells } = design;
  if (cells.length === 0) return null;
  if (isTriangleDesign(design)) {
    const { x0, x1, y0, y1 } = triDesignBounds(design);
    return { column: x0, height: y1 - y0, row: y0, width: x1 - x0 };
  }
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
  if (isTriangleDesign(design)) return triDesignFrame(design);
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
  // An irregular side meets one bigger cell whose facing side is closed: that cell draws a pocket or bend for it.
  const irregular = (index, side) => {
    const others = along[index][side];
    if (!next.irregular || others.length !== 1) return false;
    const [host] = others;
    return (
      next.cells[host].size > next.cells[index].size &&
      !hasSide(masks[host], opposite(side))
    );
  };
  let changed = true;
  while (changed) {
    changed = false;
    for (let index = 0; index < masks.length; index += 1) {
      for (let side = 0; side < 4; side += 1) {
        if (
          hasSide(masks[index], side) &&
          blocked(index, side) &&
          !irregular(index, side)
        ) {
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
  if (isTriangleDesign(design)) return normalizeTriDesign(design);
  return normalizeCells(design, design.cells);
}

// Turning irregular connections off closes every side that relied on them.
export function setIrregular(design, on) {
  const rest = { ...design };
  delete rest.irregular;
  return normalizeDesign(on ? { ...rest, irregular: true } : rest);
}

const connectorsOf = (mask) => [0, 1, 2, 3].map((side) => hasSide(mask, side));

function canonicalConnections(connectors, mask) {
  return resolveConnections(connectors, () => (mask & ALT_PAIRING ? 1 : 0));
}

// The axis of a cell's straight lanes (0 top-bottom, 1 left-right), or null: one opposite pair open, and at most one more side.
function straightAxis(mask) {
  const connectors = connectorsOf(mask);
  const open = connectors.filter(Boolean).length;
  if (open < 2 || open > 3) return null;
  if (connectors[0] && connectors[2]) return 0;
  if (connectors[1] && connectors[3]) return 1;
  return null;
}

// A T-junction's stub is drawn first, so the straight lanes stop against it.
function straightConnections(mask) {
  const axis = straightAxis(mask);
  if (axis === null || !(mask & STRAIGHT)) return null;
  const branch = [0, 1, 2, 3].find(
    (side) => hasSide(mask, side) && side % 2 !== axis
  );
  return branch === undefined
    ? [[3, axis]]
    : [
        [1, branch],
        [3, axis],
      ];
}

// Unpinned cells are seeded by position so editing one never reshuffles another.
function connectionsFor({ column, mask, row, size }) {
  const straight = straightConnections(mask);
  if (straight) return straight;
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

// Where each irregular side lands on its bigger cell: a pocket on the side, or a bend when it reaches a corner whose other side is open.
const CORNERS = {
  0: [
    [0, 3],
    [1, 1],
  ],
  1: [
    [1, 0],
    [2, 2],
  ],
  2: [
    [3, 3],
    [2, 1],
  ],
  3: [
    [0, 0],
    [3, 2],
  ],
};

function irregularFamily(host, side, start, length) {
  const { column, row, size } = host;
  const far = size - length;
  const place = [
    [start, row],
    [column + far, start],
    [start, row + far],
    [column, start],
  ][side];
  const cell = { column: place[0], row: place[1], size: length };
  const origin = side === 0 || side === 2 ? column : row;
  const [atStart, atEnd] = CORNERS[side];
  const corner =
    (start === origin && atStart) ||
    (start + length === origin + size && atEnd) ||
    null;
  if (corner && hasSide(host.mask, corner[1])) {
    return { cell, connection: [2, corner[0]] };
  }
  return { cell, connection: [1, side] };
}

// Each bigger cell's extra families, in the order drawn (later on top), keyed by its index.
export function irregularFamilies(design) {
  const byHost = new Map();
  if (!design.irregular) return byHost;
  const owner = occupancy(design);
  design.cells.forEach((cell, index) => {
    [0, 1, 2, 3].forEach((side) => {
      if (!hasSide(cell.mask, side)) return;
      const others = neighboursAlong(design, owner, index, side);
      if (!others || others.length !== 1) return;
      const hostIndex = others[0];
      const host = design.cells[hostIndex];
      const hostSide = opposite(side);
      if (host.size <= cell.size || hasSide(host.mask, hostSide)) return;
      const start = side === 0 || side === 2 ? cell.column : cell.row;
      const family = irregularFamily(host, hostSide, start, cell.size);
      if (!byHost.has(hostIndex)) byHost.set(hostIndex, []);
      byHost.get(hostIndex).push({ ...family, guest: index });
    });
  });
  return byHost;
}

function inksAny(cell, [c0, r0, c1, r1], extras = []) {
  const families = [
    ...connectionsFor(cell).map((connection) => [cell, connection]),
    ...extras.map((extra) => [extra.cell, extra.connection]),
  ];
  return families.some(([owner, [type, edge]]) => {
    const { rMax, x, y } = familySector(owner, type, edge);
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
export function inkClashes(design) {
  if (isTriangleDesign(design)) return triInkClashes(design);
  const { cells } = design;
  const extras = irregularFamilies(design);
  let clashes = 0;
  for (let i = 0; i < cells.length; i += 1) {
    for (let j = i + 1; j < cells.length; j += 1) {
      const overlap = overlapOf(cells[i], cells[j]);
      if (overlap) {
        const a = cells[i];
        const b = cells[j];
        const hosts = a.size === b.size ? [i, j] : [a.size > b.size ? i : j];
        if (
          hosts.some((host) =>
            inksAny(cells[host], overlap, extras.get(host) ?? [])
          )
        ) {
          clashes += 1;
        }
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
  if (!cascade) {
    if (!design.irregular) return design;
    cells[index].mask = withSide(cells[index].mask, side, true);
    const next = normalizeCells(design, cells);
    return hasSide(next.cells[index].mask, side) ? next : design;
  }
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
export function placeCell(
  design,
  column,
  row,
  size,
  { connect = true, up = false } = {}
) {
  if (isTriangleDesign(design)) {
    return placeTriCell(design, { column, row, size, up }, { connect });
  }
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
  if (isTriangleDesign(design)) return eraseTriCell(design, index);
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
  if (connections.some(([type]) => type === 3)) {
    return PINNED_CHOICES | STRAIGHT;
  }
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
  if (isTriangleDesign(design)) return pinTriChoices(design);
  return { ...design, cells: design.cells.map(pinCell) };
}

export function cellConnections(design, index) {
  if (isTriangleDesign(design)) return triCellConnections(design, index);
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

export const canStraighten = (design, index) =>
  isTriangleDesign(design)
    ? canStraightenTri(design, index)
    : straightAxis(design.cells[index].mask) !== null;

export function toggleStraight(design, index) {
  if (isTriangleDesign(design)) return toggleTriStraight(design, index);
  if (index < 0 || !canStraighten(design, index)) return design;
  const cells = [...design.cells];
  cells[index] = { ...cells[index], mask: cells[index].mask ^ STRAIGHT };
  return keepIfClear(design, { ...design, cells });
}

export function swapOrder(design, index) {
  if (index < 0 || !canSwapOrder(design, index)) return design;
  return toggleChoice(design, index, SWAPPED_ORDER);
}

// The cells reachable from one through open sides: what the Move tool drags.
export function connectedGroup(design, index) {
  if (isTriangleDesign(design)) return triConnectedGroup(design, index);
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

function landIntact(design, cells) {
  if (!cells.every(({ column, row, size }) => inRange(column, row, size))) {
    return design;
  }
  const next = normalizeDesign({ ...design, cells });
  if (next.cells.some((cell, index) => cell.mask !== cells[index].mask)) {
    return design;
  }
  return inkClashes(next) === 0 ? next : design;
}

// Copies are pinned, since unpinned choices hash their position; the copies are appended, so existing indices hold.
// On a triangle design (dx, dy) is a lattice translation.
export function duplicateCells(design, indices, dx, dy) {
  if (isTriangleDesign(design)) {
    return duplicateTriCells(design, indices, dx, dy);
  }
  if (dx === 0 && dy === 0) return design;
  const copies = indices.map((index) => {
    const cell = pinCell(design.cells[index]);
    return { ...cell, column: cell.column + dx, row: cell.row + dy };
  });
  return landIntact(design, [...design.cells, ...copies]);
}

// Moved cells are pinned, since unpinned choices hash their position; a move that would change any side is refused.
export function moveCells(design, indices, dx, dy) {
  if (isTriangleDesign(design)) return moveTriCells(design, indices, dx, dy);
  if (dx === 0 && dy === 0) return design;
  const moving = new Set(indices);
  const cells = design.cells.map((cell, index) =>
    moving.has(index)
      ? { ...pinCell(cell), column: cell.column + dx, row: cell.row + dy }
      : cell
  );
  return landIntact(design, cells);
}

export const SYMMETRY_AXES = [
  'none',
  'vertical',
  'horizontal',
  'diagonal',
  'antidiagonal',
];

// Square on, the axes run down the grid's centre; turned onto its diagonal, corner to corner.
// A triangle field repeats every 60°, and turned 30° its diagonals stand upright.
export function symmetryAxis(rotation, flip, shape) {
  const period = shape === TRIANGLE ? 60 : 90;
  const turn = (((rotation ?? 0) % period) + period) % period;
  const diagonal = Math.abs(turn - period / 2) < period / 4;
  if (diagonal) return flip ? 'antidiagonal' : 'diagonal';
  return flip ? 'horizontal' : 'vertical';
}

// Keeps an axis's parity but moves it to the family the rotation calls for.
export function alignSymmetry(axis, rotation, shape) {
  if (!axis || axis === 'none') return 'none';
  return symmetryAxis(
    rotation,
    axis === 'horizontal' || axis === 'antidiagonal',
    shape
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
  if (type === 3) return [3, map[edge] % 2];
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
  return {
    ...cell,
    mask: sides | PINNED_CHOICES | alt | (cell.mask & STRAIGHT),
  };
}

// One half of a seeded field mirrored onto the other; cells straddling the axis are dropped unless centred on it.
export function symmetricDesign(design, gridSize, axis, { hideLoose } = {}) {
  if (isTriangleDesign(design)) {
    return symmetricTriDesign(design, axis, { hideLoose });
  }
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
    result = normalizeDesign({ cells, irregular: design.irregular });
    if (result.cells.every((cell, i) => cell.mask === cells[i].mask)) break;
    half = result.cells.slice(0, half.length);
    axisCells = result.cells
      .slice(half.length, half.length + axisCells.length)
      .map((cell) => balanceOnAxis(cell, axis));
  }
  if (!hideLoose) return result;
  return normalizeDesign({
    ...result,
    cells: result.cells.filter((cell) => (cell.mask & 15) !== 0),
  });
}

// A seeded field's irregular connections: each small cell's closed side against one bigger, closed side opens on a position-seeded chance.
export function openIrregular(design, seed) {
  const next = { ...design, irregular: true };
  const owner = occupancy(next);
  const cells = next.cells.map((cell, index) => {
    let { mask } = cell;
    [0, 1, 2, 3].forEach((side) => {
      if (hasSide(mask, side)) return;
      const others = neighboursAlong(next, owner, index, side);
      if (!others || others.length !== 1) return;
      const host = next.cells[others[0]];
      if (host.size <= cell.size || hasSide(host.mask, opposite(side))) return;
      const roll = mulberry32(
        hashSeed(`${seed}:${cell.column},${cell.row},${side}`)
      )();
      if (roll < IRREGULAR_CHANCE) mask = withSide(mask, side, true);
    });
    return { ...cell, mask };
  });
  return normalizeCells(next, cells);
}

// A seeded field's straight cells: each cell that can take them does on a position-seeded chance.
export function openStraights(design, chance, seed) {
  if (!(chance > 0)) return design;
  return {
    ...design,
    cells: design.cells.map((cell) => {
      if (straightAxis(cell.mask) === null) return cell;
      const roll = mulberry32(
        hashSeed(`${seed}:straight:${cell.column},${cell.row}`)
      )();
      return roll < chance ? { ...cell, mask: cell.mask | STRAIGHT } : cell;
    }),
  };
}

export function fieldFromDesign(
  design,
  canvasSize,
  frame = designFrame(design),
  pathDiv = 4
) {
  if (isTriangleDesign(design)) {
    return fieldFromTriDesign(design, canvasSize, frame, pathDiv);
  }
  const local = ({ column, row, size }) => ({
    column: column - frame.column,
    row: row - frame.row,
    size,
  });
  const order = design.cells
    .map((cell, index) => index)
    .sort((a, b) => {
      const ca = design.cells[a];
      const cb = design.cells[b];
      return ca.row !== cb.row ? ca.row - cb.row : ca.column - cb.column;
    });
  const drawn = order.map((index) => {
    const cell = design.cells[index];
    return {
      cell: { ...local(cell), connectors: connectorsOf(cell.mask) },
      connections: connectionsFor(cell),
      occluders: [],
    };
  });
  // Pockets and bends are drawn after every cell, so they sit on top; each covers its host and the extras before it.
  const extras = irregularFamilies(design);
  order.forEach((index, at) => {
    const host = drawn[at];
    (extras.get(index) ?? []).forEach(({ cell, connection }) => {
      const virtual = local(cell);
      const sector = familySector(virtual, connection[0], connection[1]);
      host.occluders.push(sector);
      drawn
        .filter((entry) => entry.host === at)
        .forEach((entry) => entry.occluders.push(sector));
      drawn.push({
        cell: {
          ...virtual,
          connectors: [0, 1, 2, 3].map(
            (side) =>
              side === connection[1] ||
              (connection[0] === 2 && side === (connection[1] + 3) % 4)
          ),
        },
        connections: [connection],
        host: at,
        occluders: [],
        virtual: true,
      });
    });
  });
  return assembleField(drawn, frame.size, canvasSize);
}

// Pins every cell's choices, so the design draws exactly as the field did.
export function designFromField(field) {
  if (field.shape === TRIANGLE) return designFromTriField(field);
  const real = field.cells.filter((entry) => !entry.virtual);
  return {
    irregular: real.length < field.cells.length,
    cells: real.map(({ cell, connections }) => ({
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
    ...(isTriangleDesign(design) ? { shape: TRIANGLE } : {}),
    ...(design.layout === 'subdivide'
      ? { connectors: 'edges', layout: 'subdivide' }
      : {}),
    ...(design.irregular ? { irregular: true } : {}),
    cells: design.cells.map(({ column, mask, row, size }) => [
      column,
      row,
      size,
      mask,
    ]),
  };
}

function triDesignFromRows(rows, irregular, layout, connectors) {
  const cells = [];
  for (let i = 0; i < rows.length; i += 1) {
    if (!Array.isArray(rows[i])) return null;
    const [column, row, size, mask] = rows[i].map(Number);
    if (!inTriRange(column, row, size) || !Number.isInteger(mask)) return null;
    let flags = mask & MASK_BITS;
    if (layout === 'subdivide' && connectors !== 'edges') {
      const sides = [0, 1, 2].reduce(
        (bits, side) =>
          bits |
          (mask & (1 << side) || mask & (1 << ((side + 1) % 3))
            ? 1 << side
            : 0),
        0
      );
      flags = (flags & ~7) | sides;
    }
    cells.push({ column, mask: flags, row, size });
  }
  const design = normalizeTriDesign({
    cells,
    ...(layout === 'subdivide' ? { layout } : {}),
    ...(irregular ? { irregular: true } : {}),
    shape: TRIANGLE,
  });
  return triInkClashes(design) === 0 ? design : null;
}

// Older files and codes carry a gridSize; the grid is unbounded now, so it is ignored.
export function designFromJson(json) {
  if (!json || !Array.isArray(json.cells)) return null;
  if (json.shape === TRIANGLE) {
    return triDesignFromRows(
      json.cells,
      Boolean(json.irregular),
      json.layout,
      json.connectors
    );
  }
  const cells = [];
  for (let i = 0; i < json.cells.length; i += 1) {
    if (!Array.isArray(json.cells[i])) return null;
    const [column, row, size, mask] = json.cells[i].map(Number);
    if (!inRange(column, row, size) || !Number.isInteger(mask)) return null;
    cells.push({ column, mask: mask & MASK_BITS, row, size });
  }
  const design = normalizeDesign({
    cells,
    ...(json.irregular ? { irregular: true } : {}),
  });
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

// tb2: per cell int16 column, int16 row, uint8 size, uint8 mask (little-endian); tb3 is the same with irregular connections on.
export function encodeDesign(design) {
  const bytes = new Uint8Array(design.cells.length * 6);
  const view = new DataView(bytes.buffer);
  design.cells.forEach(({ column, mask, row, size }, i) => {
    view.setInt16(i * 6, column, true);
    view.setInt16(i * 6 + 2, row, true);
    view.setUint8(i * 6 + 4, size);
    view.setUint8(i * 6 + 5, mask);
  });
  const triangle = isTriangleDesign(design);
  const prefix = design.irregular
    ? (triangle && TRIANGLE_IRREGULAR_PREFIX) || IRREGULAR_PREFIX
    : (triangle && TRIANGLE_PREFIX) || CODE_PREFIX;
  const subdivisionPrefix = design.irregular
    ? TRIANGLE_EDGE_IRREGULAR_PREFIX
    : TRIANGLE_EDGE_PREFIX;
  const encodedPrefix =
    triangle && design.layout === 'subdivide' ? subdivisionPrefix : prefix;
  return `${encodedPrefix}${toBase64Url(bytes)}`;
}

function cellsFromCode(code) {
  const legacy = code.startsWith(LEGACY_PREFIX);
  const known = [
    CODE_PREFIX,
    IRREGULAR_PREFIX,
    LEGACY_PREFIX,
    TRIANGLE_PREFIX,
    TRIANGLE_IRREGULAR_PREFIX,
    TRIANGLE_SUBDIVISION_PREFIX,
    TRIANGLE_EDGE_PREFIX,
    TRIANGLE_EDGE_IRREGULAR_PREFIX,
  ];
  if (!known.some((prefix) => code.startsWith(prefix))) return null;
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
  if (!cells) return null;
  if (
    code.startsWith(TRIANGLE_EDGE_PREFIX) ||
    code.startsWith(TRIANGLE_EDGE_IRREGULAR_PREFIX)
  ) {
    return designFromJson({
      cells,
      connectors: 'edges',
      ...(code.startsWith(TRIANGLE_EDGE_IRREGULAR_PREFIX)
        ? { irregular: true }
        : {}),
      layout: 'subdivide',
      shape: TRIANGLE,
    });
  }
  if (code.startsWith(TRIANGLE_SUBDIVISION_PREFIX)) {
    return designFromJson({ cells, layout: 'subdivide', shape: TRIANGLE });
  }
  if (code.startsWith(TRIANGLE_PREFIX)) {
    return designFromJson({ cells, shape: TRIANGLE });
  }
  if (code.startsWith(TRIANGLE_IRREGULAR_PREFIX)) {
    return designFromJson({ cells, irregular: true, shape: TRIANGLE });
  }
  return designFromJson({
    cells,
    irregular: code.startsWith(IRREGULAR_PREFIX),
  });
}

export const isDesignCode = (code) => decodeDesign(code) !== null;

// The grid a config draws on: a design's own shape, else blobGridShape.
export function gridShapeOf(config) {
  if (config.blobDesign) {
    return isTriangleDesign(decodeDesign(config.blobDesign))
      ? TRIANGLE
      : 'square';
  }
  return config.blobGridShape === TRIANGLE ? TRIANGLE : 'square';
}
