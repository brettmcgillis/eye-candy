// A "lane" is the annular gap between two consecutive arcs of one family. The
// lanes of neighbouring cells join into continuous channels that snake across
// the whole pattern, and colouring by a cell-local lane index would break the
// colour at every cell edge. This resolves the joins instead.
//
// The join test is exact rather than geometric: every arc crosses an active
// edge at a multiple of 1/pathDiv from a corner (the same lattice that makes
// the arcs connect at all), so each lane covers a whole number of 1/pathDiv
// intervals along that edge. Two lanes sharing an interval are one channel.
// All coordinates below are in those 1/pathDiv units, absolute to the grid.
// Corner a type-2 family turns about, as [dCol, dRow] in cell-size multiples
// of the cell's own (column, row) origin. Index is the connection's edge, and
// a type-2 family spans sides `edge` and `(edge + 3) % 4`.
import { BOUNDARY_RETURN, boundaryRadii, boundarySize } from './triFans';
import {
  BEND,
  FAN,
  FAN_SPAN,
  POCKET,
  RINGS,
  TRI_STUB,
  TRI_TURN,
  cellBox,
  cellCenter,
  cellCorners,
  centroid,
  cornerPoints,
  decodeEdge,
  decodeIrregular,
  fanBands,
  fanRadius,
  fanStart,
  inradius,
  isTriangleCell,
  latticePoint,
  pocketRadii,
  returnRadii,
  ringPitch,
} from './triangle';

// A pocket's centre on its host's side, in micro-cell units.
function pocketCenter(cell, edge) {
  const { corner, offset2 } = decodeIrregular(edge);
  const points = cornerPoints(cell);
  const [px, py] = points[corner];
  const [qx, qy] = points[(corner + 1) % 3];
  const t = offset2 / 2 / cell.size;
  return [px + (qx - px) * t, py + (qy - py) * t];
}

const CORNER_OFFSET = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1],
];

const isHorizontal = (side) => side === 0 || side === 2;

// The grid line a side lies on, and the span of the cell along it.
function sideGeometry(cell, side) {
  const { column, row, size } = cell;
  if (isHorizontal(side)) {
    return {
      line: side === 0 ? row : row + size,
      start: column,
      vertical: false,
    };
  }
  return {
    line: side === 1 ? column + size : column,
    start: row,
    vertical: true,
  };
}

const intervalKey = (vertical, line, start) =>
  `${vertical ? 'V' : 'H'}:${line}:${start}`;

// A straight family (type 3; edge 0 runs top-bottom, 1 left-right) is
// modelled on the CPU as arcs about a centre so far off that they are
// straight to within ~1e-5 of a cell: lanes, SVG and the 3D strands keep
// their arc maths, and 3D joins ends by lattice point anyway. Its lanes are
// indexed from the left (or top) edge, like a corner's from its pivot.
const STRAIGHT_REACH = 1e5;

export function straightFrame({ column, row, size }, edge) {
  const reach = STRAIGHT_REACH * Math.max(1, size);
  const half = size / 2;
  const alpha = Math.asin(half / (reach + half));
  if (edge === 0) {
    return {
      reach,
      span: alpha * 2,
      start: -alpha,
      x: column - reach,
      y: row + half,
    };
  }
  return {
    reach,
    span: alpha * 2,
    start: Math.PI / 2 - alpha,
    x: column + half,
    y: row - reach,
  };
}

// A cell's centre and footprint in the coordinates its families are placed
// in: grid units for a square cell, the lattice's micro-cell units for a
// triangle one.
export function cellCenterOf(cell) {
  if (isTriangleCell(cell)) return cellCenter(cell);
  return [cell.column + cell.size / 2, cell.row + cell.size / 2];
}

export function cellBoxOf(cell) {
  if (isTriangleCell(cell)) return cellBox(cell);
  const { column, row, size } = cell;
  return { x0: column, x1: column + size, y0: row, y1: row + size };
}

export function laneCount(type, size, pathDiv, edge = 0) {
  if (type === BOUNDARY_RETURN)
    return Math.max(1, boundaryRadii(boundarySize(edge), pathDiv).length);
  if (type === TRI_STUB || type === TRI_TURN)
    return Math.max(1, returnRadii(type, size, pathDiv).length);
  if (type === FAN) {
    const { long, reference } = decodeEdge(edge);
    return fanBands(size, pathDiv, long, reference);
  }
  if (type === BEND) return decodeIrregular(edge).reach * pathDiv;
  if (type === POCKET) {
    return pocketRadii(decodeIrregular(edge).m, pathDiv).length;
  }
  if (type === RINGS) return ringPitch(size, pathDiv).bands;
  const span = size * pathDiv;
  if (type === 2 || type === 3) return span;
  return Math.floor(span / 2) + (span % 2 === 1 ? 1 : 0);
}

// A family's centre and reach, in micro-cell units — the same sector the
// shader occludes with. A triangle family's reach depends on the lane
// pitch; without `pathDiv` it is the most it can be, for bounds.
export function familySector(cell, type, edge, pathDiv = null) {
  const { column, row, size } = cell;
  if (type === BOUNDARY_RETURN) {
    const [x, y] = cellCenterOf(cell);
    const radii = pathDiv ? boundaryRadii(boundarySize(edge), pathDiv) : [];
    return { x, y, rMax: pathDiv ? (radii.at(-1) ?? 0) : size / 2 };
  }
  if (type === TRI_TURN) {
    const [x, y] = cornerPoints(cell)[edge % 3];
    return { rMax: size, x, y };
  }
  if (type === TRI_STUB) {
    const points = cornerPoints(cell);
    const a = points[edge % 3];
    const b = points[((edge % 3) + 1) % 3];
    return { rMax: size, x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 };
  }
  if (type === FAN) {
    const { corner, long, reference } = decodeEdge(edge);
    const [x, y] = cornerPoints(cell)[corner];
    const rMax = pathDiv
      ? fanRadius(fanBands(size, pathDiv, long, reference) - 1, pathDiv)
      : size * (long ? 0.75 : 0.5);
    return {
      rMax,
      x,
      y,
    };
  }
  if (type === BEND) {
    const { corner, reach } = decodeIrregular(edge);
    const [x, y] = cornerPoints(cell)[corner];
    const rMax = pathDiv ? fanRadius(reach * pathDiv - 1, pathDiv) : reach;
    return { rMax, x, y };
  }
  if (type === POCKET) {
    const { m } = decodeIrregular(edge);
    const [x, y] = pocketCenter(cell, edge);
    if (!pathDiv) return { rMax: m / 2, x, y };
    const radii = pocketRadii(m, pathDiv);
    return { rMax: radii.length > 0 ? radii[radii.length - 1] : 0, x, y };
  }
  if (type === RINGS) {
    const [x, y] = centroid(cell);
    if (!pathDiv) return { rMax: inradius(size), x, y };
    const { bands, pitch } = ringPitch(size, pathDiv);
    return { rMax: bands * pitch, x, y };
  }
  if (type === 0) {
    return { rMax: size / 2, x: column + size / 2, y: row + size / 2 };
  }
  if (type === 2) {
    const [dc, dr] = CORNER_OFFSET[edge];
    return { rMax: size, x: column + dc * size, y: row + dr * size };
  }
  if (type === 3) {
    const { reach, x, y } = straightFrame(cell, edge);
    return { rMax: reach + size, x, y };
  }
  const half = size / 2;
  const mid = [
    [half, 0],
    [size, half],
    [half, size],
    [0, half],
  ][edge];
  return { rMax: half, x: column + mid[0], y: row + mid[1] };
}

// A lane's inner and outer radius, in micro-cell units — the annulus between
// two of the family's arcs, matching blobArcs.js's lane indexing.
export function laneRadii(type, size, pathDiv, edge = 0) {
  if (type === BOUNDARY_RETURN) {
    const radii = boundaryRadii(boundarySize(edge), pathDiv);
    return radii.map((r, i) => [i ? radii[i - 1] : 0, r]);
  }
  if (type === TRI_STUB || type === TRI_TURN) {
    const radii = returnRadii(type, size, pathDiv);
    if (radii.length === 0) return [[0, size * 0.2]];
    return radii.map((r, j) => [j > 0 ? radii[j - 1] : 0, r]);
  }
  if (type === POCKET) {
    const bounds = [0, ...pocketRadii(decodeIrregular(edge).m, pathDiv)];
    return bounds.slice(1).map((r, j) => [bounds[j], r]);
  }
  if (type === FAN || type === BEND) {
    return Array.from(
      { length: laneCount(type, size, pathDiv, edge) },
      (_, j) => [Math.max(0, fanRadius(j - 1, pathDiv)), fanRadius(j, pathDiv)]
    );
  }
  if (type === RINGS) {
    const { bands, pitch } = ringPitch(size, pathDiv);
    return Array.from({ length: bands }, (_, j) => [
      j * pitch,
      (j + 1) * pitch,
    ]);
  }
  const bands = Math.round(size * pathDiv);
  const base = type === 3 ? straightFrame({ size }, 0).reach : 0;
  if (type === 2 || type === 3) {
    return Array.from({ length: bands }, (_, j) => [
      base + j / pathDiv,
      base + (j + 1) / pathDiv,
    ]);
  }
  const odd = bands % 2 === 1 ? 0.5 : 0;
  const laneBase = odd > 0 ? 1 : 0;
  return Array.from({ length: laneCount(type, size, pathDiv) }, (_, j) => [
    Math.max(0, j + odd - laneBase) / pathDiv,
    Math.min(bands / 2, j + 1 + odd - laneBase) / pathDiv,
  ]);
}

const WEDGE_ANGLE = [Math.PI * 2, Math.PI, Math.PI / 2];

export function familySpan(cell, type, edge) {
  if (type === BOUNDARY_RETURN) return Math.PI;
  if (type === TRI_STUB) return Math.PI;
  if (type === TRI_TURN) return FAN_SPAN;
  if (type === FAN || type === BEND) return FAN_SPAN;
  if (type === POCKET) return Math.PI;
  if (type === RINGS) return Math.PI * 2;
  return type === 3 ? straightFrame(cell, edge).span : WEDGE_ANGLE[type];
}

// Where a fan's wedge starts (towards the next corner clockwise), y down.
// A pocket opens from its side's direction round through the cell's inside.
export const fanFrame = (cell, edge, type = FAN) => {
  const { corner, up } = decodeEdge(edge);
  if (type === BOUNDARY_RETURN)
    return { span: Math.PI, start: fanStart(corner, up) + Math.PI };
  return {
    span: type === POCKET || type === TRI_STUB ? Math.PI : FAN_SPAN,
    start: fanStart(corner, cell.up),
  };
};

// Two corner families on opposite corners: each owns two sides outright, so
// the second can pass under the first instead of stopping against it.
export function isWeaveCell(connections) {
  return (
    connections.length === 2 &&
    connections[0][0] === 2 &&
    connections[1][0] === 2 &&
    Math.abs(connections[0][1] - connections[1][1]) === 2
  );
}

// How far round its family's wedge a grid point sits, 0..1 — the same
// parameter blobArcs.js's `along` gives a pixel: measured in the family's
// canonical frame, from the wedge's first edge towards its second.
export function wedgeParam(cell, type, edge, px, py) {
  if (
    type === BOUNDARY_RETURN ||
    type === FAN ||
    type === BEND ||
    type === POCKET ||
    type === TRI_STUB ||
    type === TRI_TURN
  ) {
    const { x, y } = familySector(cell, type, edge);
    const { span, start } = fanFrame(cell, edge, type);
    let angle = Math.atan2(py - y, px - x) - start;
    angle -= Math.round((angle - span / 2) / (Math.PI * 2)) * Math.PI * 2;
    return Math.min(1, Math.max(0, angle / span));
  }
  if (type === RINGS) {
    const { x, y } = familySector(cell, type, edge);
    return (Math.atan2(py - y, px - x) + Math.PI) / (Math.PI * 2);
  }
  if (type === 3) {
    const { span, start, x, y } = straightFrame(cell, edge);
    const u = (Math.atan2(py - y, px - x) - start) / span;
    return Math.min(1, Math.max(0, u));
  }
  const { x, y } = familySector(cell, type, edge);
  const phi = -edge * (Math.PI / 2);
  const c = Math.cos(phi);
  const s = Math.sin(phi);
  const rx = (px - x) * c - (py - y) * s;
  const ry = (px - x) * s + (py - y) * c;
  if (type === 0) return (Math.atan2(ry, rx) + Math.PI) / (Math.PI * 2);
  if (type === 2) {
    return Math.atan2(Math.max(ry, 0), Math.max(rx, 0)) / (Math.PI / 2);
  }
  return Math.atan2(Math.max(ry, 0), rx) / Math.PI;
}

function intervalPoint(vertical, line, start, pathDiv) {
  const along = (start + 0.5) / pathDiv;
  return vertical ? [line, along] : [along, line];
}

// Where each lane meets the cell's active edges, as absolute interval starts.
// `occluders` are the sectors painted over this family: the first-drawn
// family's when this is the second, plus any pocket or bend on top of the
// cell. Anywhere inside one the family is painted over, so its lanes
// never surface there and must not be joined to the neighbour's. Skipping
// this check fuses nearly every lane in the pattern into one channel — a
// 3-connector cell's second family is hidden along the whole shared side, so
// registering it there bridges two otherwise separate channel systems.
// A triangle side's lattice line: which of the three directions it runs in,
// the coordinate constant along it, and the one that advances.
function latticeLine([pa, pb], [qa, qb]) {
  if (pb === qb)
    return { along: (a) => a, line: pb, name: 'T0', sign: Math.sign(qa - pa) };
  if (pa === qa)
    return {
      along: (a, b) => b,
      line: pa,
      name: 'T1',
      sign: Math.sign(qb - pb),
    };
  return {
    along: (a, b) => b,
    line: pa + pb,
    name: 'T2',
    sign: Math.sign(qb - pb),
  };
}

function fanIntervals(cell, type, edge, pathDiv, visible) {
  const { corner } = decodeEdge(edge);
  const corners = cellCorners(cell);
  const pivot = corners[corner];
  const [px, py] = latticePoint(...pivot);
  const count = laneCount(type, cell.size, pathDiv, edge);
  const out = [];
  [1, 2].forEach((step) => {
    const other = corners[(corner + step) % 3];
    const { along, line, name, sign } = latticeLine(pivot, other);
    const [qx, qy] = latticePoint(...other);
    const ux = (qx - px) / cell.size;
    const uy = (qy - py) / cell.size;
    const from = along(...pivot) * pathDiv;
    // Lane j spans [j - 1/2, j + 1/2] pitches from the pivot; lane 0 is the
    // sliver round the pivot itself, shared by every fan about it.
    for (let j = 0; j < count; j += 1) {
      const d = j / pathDiv;
      const point = [px + ux * d, py + uy * d];
      if (visible(point)) {
        out.push({
          key: `${name}:${line}:${sign > 0 ? from + j - 0.5 : from - j - 0.5}`,
          lane: j,
          point,
        });
      }
    }
  });
  return out;
}

// A pocket's lanes along its host's side: the inner half-disc spans the
// middle, every other lane meets the side on both sides of it. Interval
// keys are lower ends in pitches along the line, as the fans' are.
function pocketIntervals(cell, edge, pathDiv, visible) {
  const { corner, m, offset2 } = decodeIrregular(edge);
  const corners = cellCorners(cell);
  const from = corners[corner];
  const to = corners[(corner + 1) % 3];
  const { along, line, name, sign } = latticeLine(from, to);
  const [px, py] = latticePoint(...from);
  const [qx, qy] = latticePoint(...to);
  const ux = ((qx - px) / cell.size) * sign;
  const uy = ((qy - py) / cell.size) * sign;
  const middle = along(...from) * pathDiv + (sign * offset2 * pathDiv) / 2;
  const [cx, cy] = pocketCenter(cell, edge);
  const bounds = [0, ...pocketRadii(m, pathDiv)].map((r) => r * pathDiv);
  const out = [];
  const push = (lo, lane) => {
    const offset = (lo + 0.5 - middle) / pathDiv;
    const point = [cx + ux * offset, cy + uy * offset];
    if (visible(point)) out.push({ key: `${name}:${line}:${lo}`, lane, point });
  };
  bounds.slice(1).forEach((outer, lane) => {
    const inner = bounds[lane];
    if (lane === 0) {
      for (let lo = middle - outer; lo < middle + outer - 1e-9; lo += 1) {
        push(lo, 0);
      }
      return;
    }
    push(middle + inner, lane);
    push(middle - outer, lane);
  });
  return out;
}

function laneIntervals(cell, type, edge, pathDiv, occluders) {
  const { column, row, size } = cell;
  const span = size * pathDiv;
  const count = laneCount(type, size, pathDiv);
  const out = [];

  if (type === 0 || type === RINGS) return out;
  const clear = ([x, y]) =>
    occluders.every(
      (occluder) =>
        Math.hypot(x - occluder.x, y - occluder.y) > occluder.rMax + 1e-6
    );
  if (type === FAN || type === BEND || type === TRI_TURN) {
    return fanIntervals(cell, type, edge, pathDiv, clear);
  }
  if (type === TRI_STUB) {
    const points = cellCorners(cell);
    const from = points[edge % 3];
    const to = points[((edge % 3) + 1) % 3];
    const { along, line, name, sign } = latticeLine(from, to);
    const [ax, ay] = latticePoint(...from);
    const [bx, by] = latticePoint(...to);
    const bounds = laneRadii(type, size, pathDiv, edge);
    for (let j = 0; j <= size * pathDiv; j += 1) {
      const t = j / (size * pathDiv);
      const point = [ax + (bx - ax) * t, ay + (by - ay) * t];
      const r = Math.abs(j / pathDiv - size / 2);
      const lane = bounds.findIndex(([, outer]) => r < outer - 1e-8);
      if (lane >= 0 && clear(point))
        out.push({
          key: `${name}:${line}:${along(...from) * pathDiv + sign * j - 0.5}`,
          lane,
          point,
        });
    }
    return out;
  }
  if (type === POCKET) return pocketIntervals(cell, edge, pathDiv, clear);

  const visible = (vertical, line, start) => {
    const along = (start + 0.5) / pathDiv;
    const x = vertical ? line : along;
    const y = vertical ? along : line;
    return occluders.every(
      (occluder) =>
        Math.hypot(x - occluder.x, y - occluder.y) > occluder.rMax + 1e-6
    );
  };

  const push = (vertical, line, start, lane) => {
    if (visible(vertical, line, start)) {
      out.push({
        key: intervalKey(vertical, line, start),
        lane,
        point: intervalPoint(vertical, line, start, pathDiv),
      });
    }
  };

  if (type === 3) {
    const sides = edge === 0 ? [0, 2] : [3, 1];
    const from = (edge === 0 ? column : row) * pathDiv;
    sides.forEach((side) => {
      const { line, vertical } = sideGeometry(cell, side);
      for (let j = 0; j < count; j += 1) push(vertical, line, from + j, j);
    });
    return out;
  }

  if (type === 2) {
    const [dc, dr] = CORNER_OFFSET[edge];
    const cornerCol = (column + dc * size) * pathDiv;
    const cornerRow = (row + dr * size) * pathDiv;
    [edge, (edge + 3) % 4].forEach((side) => {
      const { line, vertical } = sideGeometry(cell, side);
      const from = vertical ? cornerRow : cornerCol;
      const forward = vertical ? dr === 0 : dc === 0;
      for (let j = 0; j < count; j += 1) {
        push(vertical, line, forward ? from + j : from - j - 1, j);
      }
    });
    return out;
  }

  const { line, start, vertical } = sideGeometry(cell, edge);
  const mid = start * pathDiv + span / 2;
  const odd = span % 2 === 1 ? 0.5 : 0;
  for (let j = 0; j < count; j += 1) {
    if (odd > 0 && j === 0) {
      push(vertical, line, mid - 0.5, 0);
    } else {
      const offset = odd > 0 ? j - 0.5 : j;
      push(vertical, line, mid + offset, j);
      push(vertical, line, mid - offset - 1, j);
    }
  }
  return out;
}

// An entry's occluders are sectors, or (on a triangle cell) the families
// painted over it, whose reach depends on the lane pitch.
export const occluderSector = (entry, pathDiv) =>
  entry.type === undefined
    ? entry
    : familySector(entry.cell, entry.type, entry.edge, pathDiv);

function makeUnionFind(n) {
  const parent = new Int32Array(n);
  for (let i = 0; i < n; i += 1) parent[i] = i;
  const find = (a) => {
    let root = a;
    while (parent[root] !== root) root = parent[root];
    let walk = a;
    while (parent[walk] !== walk) {
      const next = parent[walk];
      parent[walk] = root;
      walk = next;
    }
    return root;
  };
  return {
    find,
    union: (a, b) => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb);
    },
  };
}

// Arc length along every channel. Each lane piece has two ends and each end
// joins at most one other piece, so a channel is a chain or a loop: walk it
// from a loose end (or anywhere, for a loop), laying pieces end to end. Per
// slot the result is [offset, signed length, 1 / channel length, the
// channel's representative lane, which sets where its spectrum starts] — the
// distance along the channel at the piece's wedge parameter u is
// offset + signed length * u, whichever way round the walk entered it.
function alongChannels({ channelOf, channels, lengthOf, links }) {
  const total = channelOf.length;
  const along = new Float32Array(total * 4);
  const visited = new Uint8Array(total);
  const members = channels.map(() => []);
  for (let id = 0; id < total; id += 1) {
    if (channelOf[id] >= 0) members[channelOf[id]].push(id);
  }

  members.forEach((ids, channel) => {
    let reach = 0;
    const walk = (startId, startEnd) => {
      let id = startId;
      let entry = startEnd;
      while (id >= 0 && !visited[id]) {
        visited[id] = 1;
        const length = lengthOf[id];
        along[id * 4] = entry === 0 ? reach : reach + length;
        along[id * 4 + 1] = entry === 0 ? length : -length;
        reach += length;
        const next = links[id * 2 + (1 - entry)];
        id = next >= 0 ? Math.floor(next / 2) : -1;
        entry = next >= 0 ? next % 2 : 0;
      }
    };
    ids
      .filter((id) => links[id * 2] < 0 || links[id * 2 + 1] < 0)
      .forEach((id) => walk(id, links[id * 2] < 0 ? 0 : 1));
    ids.forEach((id) => walk(id, 0));
    const inverse = reach > 0 ? 1 / reach : 0;
    ids.forEach((id) => {
      along[id * 4 + 2] = inverse;
      along[id * 4 + 3] = channels[channel].lane;
    });
  });

  return along;
}

// Resolves every (cell, family slot, lane) triple to a channel id, plus the
// per-channel facts the colour modes need. `slots` is a flat lookup sized
// count * 2 * maxLanes so the shader can index it as a texture row per cell.
export default function buildLaneChannels(
  drawn,
  pathDiv,
  { weave = false } = {}
) {
  const maxLanes = drawn.reduce(
    (acc, entry) =>
      entry.connections.reduce(
        (inner, [type, edge]) =>
          Math.max(inner, laneCount(type, entry.cell.size, pathDiv, edge)),
        acc
      ),
    1
  );

  const slotStride = maxLanes * 2;
  const total = drawn.length * slotStride;
  const uf = makeUnionFind(total);
  const used = new Uint8Array(total);
  const laneOf = new Int32Array(total).fill(-1);
  const depthOf = new Float32Array(total);
  const buckets = new Map();

  const lengthOf = new Float32Array(total);
  const links = new Int32Array(total * 2).fill(-1);

  drawn.forEach((entry, cellIndex) => {
    const { cell, connections, occluders: listed = [] } = entry;
    const occluders = listed.map((cover) => occluderSector(cover, pathDiv));
    const occluder =
      connections.length > 1 && !(weave && isWeaveCell(connections))
        ? familySector(cell, connections[0][0], connections[0][1], pathDiv)
        : null;
    connections.forEach(([type, edge], slot) => {
      const radii = laneRadii(type, cell.size, pathDiv, edge);
      const count = radii.length;
      for (let j = 0; j < count; j += 1) {
        const id = cellIndex * slotStride + slot * maxLanes + j;
        used[id] = 1;
        laneOf[id] = j;
        depthOf[id] = count > 1 ? j / (count - 1) : 0;
        lengthOf[id] =
          ((radii[j][0] + radii[j][1]) / 2) * familySpan(cell, type, edge);
      }
      const joins = entry.cap
        ? laneIntervals(entry.cap.host, TRI_STUB, edge % 6, pathDiv, [])
        : laneIntervals(
            cell,
            type,
            edge,
            pathDiv,
            slot === 1 && occluder ? [occluder, ...occluders] : occluders
          );
      const { x, y } = familySector(cell, type, edge, pathDiv);
      joins.forEach(({ key: rawKey, lane, point }) => {
        const key =
          entry.channelGroup == null
            ? rawKey
            : `${entry.channelGroup}:${rawKey}`;
        const id = cellIndex * slotStride + slot * maxLanes + lane;
        // Which end of the lane this join sits at. An odd stub's innermost
        // lane meets its edge at the family centre itself, where the angle
        // is undefined; it is a dead end either way, so it takes the far end.
        const atCentre = Math.hypot(point[0] - x, point[1] - y) < 1e-6;
        const end =
          atCentre || wedgeParam(cell, type, edge, ...point) > 0.5 ? 1 : 0;
        const bucket = buckets.get(key);
        if (bucket) bucket.push([id, end]);
        else buckets.set(key, [[id, end]]);
      });
    });
  });

  buckets.forEach((members) => {
    for (let i = 1; i < members.length; i += 1) {
      uf.union(members[0][0], members[i][0]);
    }
    if (members.length === 2) {
      const [[a, endA], [b, endB]] = members;
      links[a * 2 + endA] = b * 2 + endB;
      links[b * 2 + endB] = a * 2 + endA;
    }
  });

  const channelOf = new Int32Array(total).fill(-1);
  const channels = [];
  const rootToChannel = new Map();
  for (let id = 0; id < total; id += 1) {
    if (used[id]) {
      const root = uf.find(id);
      let channel = rootToChannel.get(root);
      if (channel === undefined) {
        channel = channels.length;
        rootToChannel.set(root, channel);
        // The root is the lowest member id, so its lane/depth is a stable
        // representative — the colour modes key off it rather than off
        // whichever cell a given pixel happens to sit in.
        channels.push({ depth: depthOf[root], lane: laneOf[root] });
      }
      channelOf[id] = channel;
    }
  }

  const along = alongChannels({ channelOf, channels, lengthOf, links });

  return { along, channelOf, channels, maxLanes, slotStride };
}
