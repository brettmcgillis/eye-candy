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

export function laneCount(type, size, pathDiv) {
  const span = size * pathDiv;
  if (type === 2) return span;
  return Math.floor(span / 2) + (span % 2 === 1 ? 1 : 0);
}

// A family's centre and reach, in micro-cell units — the same sector the
// shader occludes with.
export function familySector(cell, type, edge) {
  const { column, row, size } = cell;
  if (type === 0) {
    return { rMax: size / 2, x: column + size / 2, y: row + size / 2 };
  }
  if (type === 2) {
    const [dc, dr] = CORNER_OFFSET[edge];
    return { rMax: size, x: column + dc * size, y: row + dr * size };
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

// Where each lane meets the cell's active edges, as absolute interval starts.
// `occluder` is the first-drawn family's sector when this is the second
// family: anywhere inside it the second family is painted over, so its lanes
// never surface there and must not be joined to the neighbour's. Skipping
// this check fuses nearly every lane in the pattern into one channel — a
// 3-connector cell's second family is hidden along the whole shared side, so
// registering it there bridges two otherwise separate channel systems.
function laneIntervals(cell, type, edge, pathDiv, occluder) {
  const { column, row, size } = cell;
  const span = size * pathDiv;
  const count = laneCount(type, size, pathDiv);
  const out = [];

  if (type === 0) return out;

  const visible = (vertical, line, start) => {
    if (!occluder) return true;
    const along = (start + 0.5) / pathDiv;
    const x = vertical ? line : along;
    const y = vertical ? along : line;
    return Math.hypot(x - occluder.x, y - occluder.y) > occluder.rMax + 1e-6;
  };

  const push = (vertical, line, start, lane) => {
    if (visible(vertical, line, start)) {
      out.push({ key: intervalKey(vertical, line, start), lane });
    }
  };

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

// Resolves every (cell, family slot, lane) triple to a channel id, plus the
// per-channel facts the colour modes need. `slots` is a flat lookup sized
// count * 2 * maxLanes so the shader can index it as a texture row per cell.
export default function buildLaneChannels(drawn, pathDiv) {
  const maxLanes = drawn.reduce(
    (acc, { cell, connections }) =>
      connections.reduce(
        (inner, [type]) => Math.max(inner, laneCount(type, cell.size, pathDiv)),
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

  drawn.forEach(({ cell, connections }, cellIndex) => {
    const occluder =
      connections.length > 1
        ? familySector(cell, connections[0][0], connections[0][1])
        : null;
    connections.forEach(([type, edge], slot) => {
      const count = laneCount(type, cell.size, pathDiv);
      for (let j = 0; j < count; j += 1) {
        const id = cellIndex * slotStride + slot * maxLanes + j;
        used[id] = 1;
        laneOf[id] = j;
        depthOf[id] = count > 1 ? j / (count - 1) : 0;
      }
      const joins = laneIntervals(
        cell,
        type,
        edge,
        pathDiv,
        slot === 1 ? occluder : null
      );
      joins.forEach(({ key, lane }) => {
        const id = cellIndex * slotStride + slot * maxLanes + lane;
        const bucket = buckets.get(key);
        if (bucket) bucket.push(id);
        else buckets.set(key, [id]);
      });
    });
  });

  buckets.forEach((ids) => {
    for (let i = 1; i < ids.length; i += 1) uf.union(ids[0], ids[i]);
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

  return { channelOf, channels, maxLanes, slotStride };
}
