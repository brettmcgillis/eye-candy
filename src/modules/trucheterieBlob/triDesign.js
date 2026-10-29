/* eslint-disable no-bitwise */
import { growthDelays } from './field';
import mulberry32 from './mulberry32';
import { hashSeed } from './rng';
import triangleFans from './triFans';
import {
  normalizeTriangleSides,
  setTriangleSide,
  triangleSides,
} from './triSides';
import {
  BEND,
  FAN,
  H,
  POCKET,
  RINGS,
  TRIANGLE,
  TRI_STUB,
  TRI_TURN,
  bendEdge,
  cellBox,
  cellCenter,
  cellCorners,
  cellFromCorners,
  centroid,
  cornerPoints,
  decodeIrregular,
  fanEdge,
  inradius,
  microAt,
  microKey,
  microTriangles,
  pocketEdge,
  ringsEdge,
} from './triangle';

// A triangle design's cells are { column, row, size, mask } on the lattice in
// ./triangle.js. Mask bits 0-2 are its corners (a corner that is on draws a
// fan over the half of each side next to it), 8 says the cell points up, and
// 64 pins its draw order: bits 16-32 name the corner on top, 128 swaps the
// other two. Only a cell with all three corners on has an order to choose.
export const UP = 8;
export const PINNED_ORDER = 64;
export const SWAPPED_REST = 128;
const TOP_SHIFT = 4;
const TOP_BITS = 48;
const CORNER_BITS = 7;
const MAX_CELL = 255;
const COORD_LIMIT = 32767;
const FRAME_MARGIN = 1;
const EMPTY_FRAME = 20;
// How far past a side a probe steps to find the neighbour across it.
const PROBE = 1e-3;
const ON_LINE = 1e-6;

const CORNERS = [0, 1, 2];
const hasCorner = (mask, corner) => (mask & (1 << corner)) !== 0;
const withCorner = (mask, corner, on) =>
  on ? mask | (1 << corner) : mask & ~(1 << corner);
export const cornersOn = (mask) =>
  CORNERS.filter((corner) => hasCorner(mask, corner));

export const isTriangleDesign = (design) => design?.shape === TRIANGLE;

export const emptyTriDesign = ({ irregular = false, layout } = {}) => ({
  cells: [],
  ...(irregular && layout !== 'subdivide' ? { irregular: true } : {}),
  ...(layout === 'subdivide' ? { layout } : {}),
  shape: TRIANGLE,
});

export const geometryOf = ({ column, mask, row, size }) => ({
  column,
  row,
  shape: TRIANGLE,
  size,
  up: (mask & UP) !== 0,
});

export const inRange = (column, row, size) =>
  Number.isInteger(size) &&
  size >= 1 &&
  size <= MAX_CELL &&
  [column, row].every(
    (value) =>
      Number.isInteger(value) &&
      value >= -COORD_LIMIT &&
      value + size <= COORD_LIMIT
  );

// [top corner, whether the other two swap]; unpinned cells hash their position.
function orderOf({ column, mask, row, size }) {
  if (mask & PINNED_ORDER) {
    return [((mask & TOP_BITS) >> TOP_SHIFT) % 3, (mask & SWAPPED_REST) !== 0];
  }
  const random = mulberry32(
    hashSeed(`tri:${column},${row},${size},${mask & UP}`)
  );
  return [Math.floor(random() * 3) % 3, random() < 0.5];
}

const orderBits = (top, swapped) =>
  PINNED_ORDER | (top << TOP_SHIFT) | (swapped ? SWAPPED_REST : 0);

// Drawn first is on top. A lone corner or a pair reaches half way along its
// sides; with all three on, the top and bottom fans reach three quarters.
export function triConnections(cell, reference = false) {
  const up = (cell.mask & UP) !== 0;
  const edgeOf = (corner, long = false) =>
    fanEdge(corner, up, long && (!reference || cell.size > 1), reference);
  const on = cornersOn(cell.mask);
  if (on.length === 0) return [[RINGS, ringsEdge(up)]];
  if (reference && on.length === 1) return [[TRI_STUB, on[0] + (up ? 3 : 0)]];
  if (reference && on.length === 2) {
    const missing = CORNERS.find((side) => !on.includes(side));
    return [[TRI_TURN, ((missing + 2) % 3) + (up ? 3 : 0)]];
  }
  if (on.length < 3) return on.map((corner) => [FAN, edgeOf(corner)]);
  const [top, swapped] = orderOf(cell);
  const rest = [(top + 1) % 3, (top + 2) % 3];
  if (swapped) rest.reverse();
  return [
    [FAN, edgeOf(top, true)],
    [FAN, edgeOf(rest[0])],
    [FAN, edgeOf(rest[1], true)],
  ];
}

// Bigger cells are written first, so a cell sitting in a bigger one's empty
// corner owns those micro-triangles (picking, and the neighbour probes).
export function triOccupancy(cells) {
  const owner = new Map();
  cells
    .map((cell, index) => [cell, index])
    .sort(([a], [b]) => b.size - a.size)
    .forEach(([cell, index]) => {
      microTriangles(geometryOf(cell)).forEach(([a, b, up]) =>
        owner.set(microKey(a, b, up), index)
      );
    });
  return owner;
}

export function triIndexAt(design, x, y) {
  const [a, b, up] = microAt(x, y);
  return triOccupancy(design.cells).get(microKey(a, b, up)) ?? -1;
}

// Where (x, y) sits on this cell's boundary: the side, and the corner whose
// half of it holds the point. Null off the boundary.
function boundaryAt(cell, x, y) {
  const points = cornerPoints(cell);
  for (let i = 0; i < 3; i += 1) {
    const j = (i + 1) % 3;
    const [px, py] = points[i];
    const dx = points[j][0] - px;
    const dy = points[j][1] - py;
    const cross = dx * (y - py) - dy * (x - px);
    const along = (dx * (x - px) + dy * (y - py)) / cell.size;
    if (
      Math.abs(cross) < ON_LINE * cell.size &&
      along > 0 &&
      along < cell.size
    ) {
      return { half: along < cell.size / 2 ? i : j, side: i };
    }
  }
  return null;
}

const sideOf = (corner, step) => (step === 1 ? corner : (corner + 2) % 3);

// Points along a corner's two half-sides, each with probes just outside and
// just inside the cell, and the side it lies on (side i runs corner i to i + 1).
function halfProbes(cell, corner) {
  const points = cornerPoints(cell);
  const [px, py] = points[corner];
  const [cx, cy] = centroid(cell);
  const n = cell.size;
  return [1, 2].flatMap((step) => {
    const [qx, qy] = points[(corner + step) % 3];
    const ux = (qx - px) / n;
    const uy = (qy - py) / n;
    const outward = ((px + qx) / 2 - cx) * -uy + ((py + qy) / 2 - cy) * ux > 0;
    const nx = outward ? -uy : uy;
    const ny = outward ? ux : -ux;
    return Array.from({ length: n }, (_, t) => {
      const d = (t + 0.5) / 2;
      const x = px + ux * d;
      const y = py + uy * d;
      return {
        inside: [x - nx * PROBE, y - ny * PROBE],
        probe: [x + nx * PROBE, y + ny * PROBE],
        side: sideOf(corner, step),
        x,
        y,
      };
    });
  });
}

// For each cell and corner, the halves facing its own along both half-sides
// as { other, half, otherSide, side }, or null if any stretch of them borders
// empty grid, a cell that does not share the line, or a smaller cell sitting
// on top of this one.
function facings(cells, owner = triOccupancy(cells)) {
  const geometries = cells.map(geometryOf);
  const at = (point) => owner.get(microKey(...microAt(...point)));
  return geometries.map((cell, index) =>
    CORNERS.map((corner) => {
      const found = new Map();
      const probes = halfProbes(cell, corner);
      for (let i = 0; i < probes.length; i += 1) {
        const { inside, probe, side, x, y } = probes[i];
        const other = at(probe);
        if (other === undefined || at(inside) !== index) return null;
        const place = boundaryAt(geometries[other], x, y);
        if (!place) return null;
        found.set(`${other}:${place.half}:${side}`, {
          half: place.half,
          other,
          otherSide: place.side,
          side,
        });
      }
      return [...found.values()];
    })
  );
}

// A small cell's side lying wholly along one bigger cell's side: where on it
// (distances from the bigger cell's corner `hostSide`), static per layout.
function irregularCandidates(cells, faces) {
  const geometries = cells.map(geometryOf);
  const candidates = [];
  geometries.forEach((cell, index) => {
    [0, 1, 2].forEach((side) => {
      const ends = [side, (side + 1) % 3];
      const links = [
        ...(faces[index][ends[0]] ?? []).filter((l) => l.side === side),
        ...(faces[index][ends[1]] ?? []).filter((l) => l.side === side),
      ];
      if (faces[index][ends[0]] === null || faces[index][ends[1]] === null) {
        return;
      }
      const hosts = new Set(links.map((l) => l.other));
      if (hosts.size !== 1) return;
      const [host] = hosts;
      const hostCell = geometries[host];
      if (hostCell.size <= cell.size) return;
      const hostSide = links[0].otherSide;
      if (links.some((l) => l.otherSide !== hostSide)) return;
      const [hx, hy] = cornerPoints(hostCell)[hostSide];
      const distances = ends
        .map((corner) => cornerPoints(cell)[corner])
        .map(([x, y]) => Math.round(Math.hypot(x - hx, y - hy)));
      candidates.push({
        end: Math.max(...distances),
        host,
        hostSide,
        index,
        side,
        start: Math.min(...distances),
      });
    });
  });
  return candidates;
}

const POCKET_CLEARANCE = 0.25;

// Which candidates draw, under the current masks: both of the small side's
// corners open, the bigger cell's halves along it closed, and room for a
// pocket, or a matching stretch round the corner it reaches for a bend.
function irregularSides(cells, masks, candidates) {
  const live = candidates.filter((c) => {
    const n = cells[c.host].size;
    const ends = [c.side, (c.side + 1) % 3];
    if (!ends.every((corner) => hasCorner(masks[c.index], corner))) {
      return false;
    }
    const halves = [
      c.start < n / 2 ? c.hostSide : null,
      c.end > n / 2 ? (c.hostSide + 1) % 3 : null,
    ].filter((corner) => corner !== null);
    return halves.every((corner) => !hasCorner(masks[c.host], corner));
  });
  const sides = [];
  live.forEach((c) => {
    const n = cells[c.host].size;
    const m = c.end - c.start;
    const middle = (c.start + c.end) / 2;
    const room = Math.min(middle, n - middle) * H;
    if (room >= m / 2 + POCKET_CLEARANCE) {
      sides.push({ ...c, kind: 'pocket' });
      return;
    }
    const atStart = c.start === 0;
    const atEnd = c.end === n;
    if (!atStart && !atEnd) return;
    const pivot = atStart ? c.hostSide : (c.hostSide + 1) % 3;
    const otherSide = atStart ? (c.hostSide + 2) % 3 : (c.hostSide + 1) % 3;
    const partner = live.find(
      (o) =>
        o.host === c.host &&
        o.hostSide === otherSide &&
        o.end - o.start === m &&
        (atStart ? o.end === n : o.start === 0)
    );
    if (!partner || m + POCKET_CLEARANCE > n * H) {
      return;
    }
    sides.push({ ...c, kind: 'bend', pivot });
  });
  return sides;
}

const sideKey = (index, side) => index * 3 + side;

// Corners joined through facing halves rise and fall together: one that is
// closed closes every half it meets, all the way round its vertex and on
// along any bigger cell's side. A side drawing irregularly into a bigger
// cell is no join. Each group, with whether it may open at all.
function cornerGroups(cells, faces, irregular = new Set()) {
  const parent = Array.from({ length: cells.length * 3 }, (_, i) => i);
  const find = (i) => {
    let root = i;
    while (parent[root] !== root) root = parent[root];
    return root;
  };
  faces.forEach((corners, index) =>
    corners.forEach((links, corner) =>
      (links ?? []).forEach(({ half, other, otherSide, side }) => {
        if (
          irregular.has(sideKey(index, side)) ||
          irregular.has(sideKey(other, otherSide))
        ) {
          return;
        }
        const a = find(index * 3 + corner);
        const b = find(other * 3 + half);
        if (a !== b) parent[Math.max(a, b)] = Math.min(a, b);
      })
    )
  );
  const groups = new Map();
  for (let node = 0; node < parent.length; node += 1) {
    const root = find(node);
    if (!groups.has(root)) groups.set(root, { members: [], openable: true });
    const group = groups.get(root);
    group.members.push(node);
    if (faces[Math.floor(node / 3)][node % 3] === null) group.openable = false;
  }
  return {
    groupOf: (index, corner) => groups.get(find(index * 3 + corner)),
    groups,
  };
}

// The layout's facings and, with irregular connections on, the small sides
// that might draw into a bigger cell.
function analyse(design, cells) {
  const faces = facings(cells);
  const candidates = design.irregular ? irregularCandidates(cells, faces) : [];
  const soft = new Set(candidates.map((c) => sideKey(c.index, c.side)));
  return { candidates, faces, soft };
}

/* eslint-disable no-param-reassign */
const closeFailing = (groups, masks) => {
  let changed = false;
  groups.forEach(({ members, openable }) => {
    const open =
      openable &&
      members.every((node) => hasCorner(masks[Math.floor(node / 3)], node % 3));
    if (open) return;
    members.forEach((node) => {
      const cell = Math.floor(node / 3);
      if (hasCorner(masks[cell], node % 3)) changed = true;
      masks[cell] = withCorner(masks[cell], node % 3, false);
    });
  });
  return changed;
};
/* eslint-enable no-param-reassign */

// The sides drawing irregularly under `masks`: each group is first judged on
// its own, with every join a small side might draw across left out, so a
// bigger cell's half that closes for its own reasons leaves the small side
// free to draw a pocket or bend instead of closing with it.
function drawnSides(cells, faces, candidates, soft, masks) {
  if (candidates.length === 0) return [];
  const own = [...masks];
  closeFailing(cornerGroups(cells, faces, soft).groups, own);
  return irregularSides(cells, own, candidates);
}

// Closing only ever invalidates more, so this settles. Every join is hard
// except across a side that draws irregularly.
function closeLoose(design, cells) {
  if (design.layout === 'subdivide')
    return normalizeTriangleSides(design, cells);
  const { candidates, faces, soft } = analyse(design, cells);
  const masks = cells.map(({ mask }) => mask);
  for (let pass = 0; pass < cells.length * 3 + 2; pass += 1) {
    const drawn = new Set(
      drawnSides(cells, faces, candidates, soft, masks).map((c) =>
        sideKey(c.index, c.side)
      )
    );
    if (!closeFailing(cornerGroups(cells, faces, drawn).groups, masks)) break;
  }
  return {
    ...design,
    cells: cells.map((cell, index) => ({ ...cell, mask: masks[index] })),
  };
}

function hardGroups(design) {
  const { candidates, faces, soft } = analyse(design, design.cells);
  const masks = design.cells.map(({ mask }) => mask);
  const drawn = new Set(
    drawnSides(design.cells, faces, candidates, soft, masks).map((c) =>
      sideKey(c.index, c.side)
    )
  );
  return {
    candidates,
    faces,
    soft,
    ...cornerGroups(design.cells, faces, drawn),
  };
}

export const triCornerGroups = (design) => {
  if (design.layout !== 'subdivide') return hardGroups(design);
  const { groups, groupOf } = triangleSides(design.cells);
  return {
    groups: new Map(groups.map((group, index) => [index, group])),
    groupOf: (index, side) => groupOf[index * 3 + side],
  };
};

export function normalizeTriDesign(design) {
  return closeLoose(design, design.cells);
}

// Each bigger cell's irregular families, in the order drawn (later on top).
export function triIrregularFamilies(design) {
  const byHost = new Map();
  if (!design.irregular) return byHost;
  const { candidates, faces, soft } = analyse(design, design.cells);
  const sides = drawnSides(
    design.cells,
    faces,
    candidates,
    soft,
    design.cells.map(({ mask }) => mask)
  );
  const add = (host, family) => {
    if (!byHost.has(host)) byHost.set(host, []);
    byHost.get(host).push(family);
  };
  const bends = new Set();
  sides.forEach((c) => {
    const up = (design.cells[c.host].mask & UP) !== 0;
    const m = c.end - c.start;
    if (c.kind === 'pocket') {
      add(c.host, {
        connection: [POCKET, pocketEdge(c.hostSide, up, c.start + c.end, m)],
        guests: [c.index],
      });
      return;
    }
    const key = `${c.host}:${c.pivot}`;
    if (bends.has(key)) return;
    bends.add(key);
    add(c.host, {
      connection: [BEND, bendEdge(c.pivot, up, m)],
      guests: sides
        .filter(
          (o) => o.kind === 'bend' && o.host === c.host && o.pivot === c.pivot
        )
        .map((o) => o.index),
    });
  });
  return byHost;
}

// Ink: every family's disc (its reach at the finest pitch), plus the
// clearance a cell sitting inside it must keep.
const INK_MARGIN = 0.5;

function familyDiscs(cell, extras) {
  const geometry = geometryOf(cell);
  const points = cornerPoints(geometry);
  const discs = triConnections(cell).map(([type, edge]) => {
    if (type === RINGS) {
      const [x, y] = centroid(geometry);
      return { r: inradius(cell.size), x, y };
    }
    const [x, y] = points[edge % 3];
    return { r: cell.size * (edge >= 6 ? 0.75 : 0.5), x, y };
  });
  (extras ?? []).forEach(({ connection: [type, edge] }) => {
    const { corner, m, offset2, reach } = decodeIrregular(edge);
    if (type === BEND) {
      const [x, y] = points[corner];
      discs.push({ r: reach, x, y });
      return;
    }
    const [px, py] = points[corner];
    const [qx, qy] = points[(corner + 1) % 3];
    const t = offset2 / 2 / cell.size;
    discs.push({ r: m / 2, x: px + (qx - px) * t, y: py + (qy - py) * t });
  });
  return discs;
}

function distanceToTriangle(px, py, points) {
  const sign = (a, b) =>
    (b[0] - a[0]) * (py - a[1]) - (b[1] - a[1]) * (px - a[0]);
  const s = points.map((point, i) => sign(point, points[(i + 1) % 3]));
  if (s.every((v) => v >= 0) || s.every((v) => v <= 0)) return 0;
  return Math.min(
    ...points.map(([ax, ay], i) => {
      const [bx, by] = points[(i + 1) % 3];
      const dx = bx - ax;
      const dy = by - ay;
      const t = Math.max(
        0,
        Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))
      );
      return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
    })
  );
}

// Cells may overlap only where the bigger one's arcs never reach (both, for equal sizes).
export function triInkClashes(design) {
  const { cells } = design;
  const extras = triIrregularFamilies(design);
  const shared = new Map();
  const seen = new Map();
  cells.forEach((cell, index) => {
    microTriangles(geometryOf(cell)).forEach(([a, b, up]) => {
      const key = microKey(a, b, up);
      (seen.get(key) ?? []).forEach((other) => {
        const pair = `${other},${index}`;
        if (!shared.has(pair)) shared.set(pair, []);
        shared.get(pair).push([a, b, up]);
      });
      seen.set(key, [...(seen.get(key) ?? []), index]);
    });
  });
  let clashes = 0;
  shared.forEach((micros, pair) => {
    const [i, j] = pair.split(',').map(Number);
    const hosts =
      cells[i].size === cells[j].size
        ? [i, j]
        : [cells[i].size > cells[j].size ? i : j];
    const inked = hosts.some((host) =>
      familyDiscs(cells[host], extras.get(host)).some(({ r, x, y }) =>
        micros.some(
          ([a, b, up]) =>
            distanceToTriangle(
              x,
              y,
              cornerPoints({ column: a, row: b, shape: TRIANGLE, size: 1, up })
            ) <
            r + INK_MARGIN
        )
      )
    );
    if (inked || design.layout === 'subdivide') clashes += 1;
  });
  return clashes;
}

const keepIfClear = (before, after) =>
  after !== before && triInkClashes(after) === 0 ? after : before;

// What opening a corner opens with it: its group, joined through every hard
// join. With irregular connections on, a group that cannot open that way may
// still open on its own and draw into a bigger cell (`soft`); small sides
// along one closed side share vertex fans, so the whole run opens together.
export function cornerCascade(design, index, corner, { soft = false } = {}) {
  if (design.layout === 'subdivide') {
    const group = triangleSides(design.cells).groupOf[index * 3 + corner];
    return group?.openable
      ? group.members.map((id) => [Math.floor(id / 3), id % 3])
      : null;
  }
  if (!soft) {
    const group = hardGroups(design).groupOf(index, corner);
    if (!group.openable) return null;
    return group.members.map((node) => [Math.floor(node / 3), node % 3]);
  }
  const { candidates, faces, soft: softSides } = analyse(design, design.cells);
  const { groupOf } = cornerGroups(design.cells, faces, softSides);
  const sidesOf = new Map();
  candidates.forEach((c) =>
    [c.side, (c.side + 1) % 3].forEach((e) => {
      const key = c.index * 3 + e;
      if (!sidesOf.has(key)) sidesOf.set(key, []);
      sidesOf.get(key).push(c);
    })
  );
  const seen = new Set();
  const nodes = [];
  const queue = [groupOf(index, corner)];
  while (queue.length > 0) {
    const group = queue.shift();
    if (!seen.has(group)) {
      seen.add(group);
      if (!group.openable) return null;
      group.members.forEach((node) => {
        nodes.push(node);
        (sidesOf.get(node) ?? []).forEach((c) =>
          [c.side, (c.side + 1) % 3].forEach((e) =>
            queue.push(groupOf(c.index, e))
          )
        );
      });
    }
  }
  return nodes.map((node) => [Math.floor(node / 3), node % 3]);
}

export const isCornerOpen = (design, index, corner) =>
  hasCorner(design.cells[index].mask, corner);

function changeCorner(design, index, corner, open) {
  if (design.layout === 'subdivide')
    return setTriangleSide(design, index, corner, open);
  const cells = design.cells.map((cell) => ({ ...cell }));
  if (!open) {
    cells[index].mask = withCorner(cells[index].mask, corner, false);
    return closeLoose(design, cells);
  }
  const openAll = (cascade) => {
    const next = cells.map((cell) => ({ ...cell }));
    cascade.forEach(([cell, c]) => {
      next[cell].mask = withCorner(next[cell].mask, c, true);
    });
    return closeLoose(design, next);
  };
  const cascade = cornerCascade(design, index, corner);
  const opened = cascade ? openAll(cascade) : design;
  if (hasCorner(opened.cells[index]?.mask ?? 0, corner) || !design.irregular) {
    return opened;
  }
  const loose = cornerCascade(design, index, corner, { soft: true });
  if (!loose) return opened;
  const drawn = openAll(loose);
  return hasCorner(drawn.cells[index].mask, corner) ? drawn : opened;
}

export const setCorner = (design, index, corner, open) =>
  keepIfClear(design, changeCorner(design, index, corner, open));

export const toggleCorner = (design, index, corner) =>
  setCorner(design, index, corner, !isCornerOpen(design, index, corner));

function connectedFrom(design, faces, index) {
  const seen = new Set([index]);
  const queue = [index];
  while (queue.length > 0) {
    const cell = queue.shift();
    cornersOn(design.cells[cell].mask).forEach((corner) =>
      (faces[cell][corner] ?? []).forEach(({ other }) => {
        if (!seen.has(other)) {
          seen.add(other);
          queue.push(other);
        }
      })
    );
  }
  return [...seen].sort((a, b) => a - b);
}

export function triConnectedGroup(design, index) {
  if (index < 0 || index >= design.cells.length) return [];
  if (design.layout === 'subdivide') {
    const { groupOf } = triangleSides(design.cells);
    const seen = new Set([index]);
    const queue = [index];
    for (let k = 0; k < queue.length; k += 1) {
      const at = queue[k];
      cornersOn(design.cells[at].mask).forEach((side) =>
        groupOf[at * 3 + side].members.forEach((id) => {
          const other = Math.floor(id / 3);
          if (!seen.has(other)) {
            seen.add(other);
            queue.push(other);
          }
        })
      );
    }
    return [...seen].sort((a, b) => a - b);
  }
  return connectedFrom(design, facings(design.cells), index);
}

export const triCellConnections = (design, index) => {
  const cell = design.cells[index];
  if (design.layout !== 'subdivide') return triConnections(cell);
  if (triConnectedGroup(design, index).length <= 2)
    return [[RINGS, ringsEdge((cell.mask & UP) !== 0)]];
  return triConnections({ ...cell, mask: cell.mask | 7 }, true);
};

function pinTriCell(cell) {
  if (cell.mask & PINNED_ORDER) return cell;
  return {
    ...cell,
    mask: (cell.mask & (CORNER_BITS | UP)) | orderBits(...orderOf(cell)),
  };
}

export const pinTriChoices = (design) => ({
  ...design,
  cells: design.cells.map(pinTriCell),
});

export const canReorder = (design, index) =>
  design.layout === 'subdivide'
    ? triConnectedGroup(design, index).length > 2
    : cornersOn(design.cells[index].mask).length === 3;

// Puts a corner on top; asked again for the corner already on top, swaps the other two.
export function raiseCorner(design, index, corner) {
  if (index < 0 || !canReorder(design, index)) return design;
  const cells = [...design.cells];
  const pinned = pinTriCell(cells[index]);
  const [top, swapped] = orderOf(pinned);
  const next =
    corner === top ? orderBits(top, !swapped) : orderBits(corner, false);
  cells[index] = { ...pinned, mask: (pinned.mask & (CORNER_BITS | UP)) | next };
  return keepIfClear(design, { ...design, cells });
}

// The corner of the cell under (x, y) nearest the pointer.
export function pickCorner(design, x, y, { connector = false } = {}) {
  const index = triIndexAt(design, x, y);
  if (index < 0) return null;
  const points = cornerPoints(geometryOf(design.cells[index]));
  const distances = points.map(([px, py], side) => {
    if (!connector || design.layout !== 'subdivide')
      return Math.hypot(px - x, py - y);
    const [qx, qy] = points[(side + 1) % 3];
    return Math.hypot((px + qx) / 2 - x, (py + qy) / 2 - y);
  });
  return { corner: distances.indexOf(Math.min(...distances)), index };
}

// Corners open one at a time, each kept only if it adds no clash, so a big
// cell can be placed round a small one.
export function placeTriCell(
  design,
  { column, row, size, up },
  { connect = true } = {}
) {
  if (!inRange(column, row, size)) return design;
  const cell = { column, mask: up ? UP : 0, row, size };
  let next = closeLoose(design, [...design.cells, cell]);
  let clashes = triInkClashes(next);
  if (connect) {
    const index = next.cells.length - 1;
    CORNERS.forEach((corner) => {
      const opened = changeCorner(next, index, corner, true);
      if (opened === next) return;
      const after = triInkClashes(opened);
      if (after <= clashes) {
        next = opened;
        clashes = after;
      }
    });
  }
  return clashes === 0 ? next : design;
}

export const canPlaceTri = (design, cell, options) =>
  placeTriCell(design, cell, options) !== design;

export function eraseTriCell(design, index) {
  if (index < 0 || index >= design.cells.length) return design;
  return keepIfClear(
    design,
    closeLoose(
      design,
      design.cells.filter((_, i) => i !== index)
    )
  );
}

// Every group of cells joined through open corners, from one facings pass.
export function triNetworks(design) {
  if (design.layout === 'subdivide') {
    const seen = new Set();
    const groups = [];
    design.cells.forEach((_, index) => {
      if (seen.has(index)) return;
      const group = triConnectedGroup(design, index);
      group.forEach((id) => seen.add(id));
      groups.push(group);
    });
    return groups;
  }
  const faces = facings(design.cells);
  const seen = new Set();
  const networks = [];
  design.cells.forEach((_, index) => {
    if (seen.has(index)) return;
    const group = connectedFrom(design, faces, index);
    group.forEach((member) => seen.add(member));
    networks.push(group);
  });
  return networks;
}

function landIntact(design, cells) {
  if (!cells.every(({ column, row, size }) => inRange(column, row, size))) {
    return design;
  }
  const next = closeLoose(design, cells);
  if (next.cells.some((cell, index) => cell.mask !== cells[index].mask)) {
    return design;
  }
  return triInkClashes(next) === 0 ? next : design;
}

// A drag in micro-cell units, snapped to the nearest lattice translation.
export function latticeOffset(dx, dy) {
  const db = Math.round(dy / (Math.sqrt(3) / 2));
  return [Math.round(dx - db / 2), db];
}

export function moveTriCells(design, indices, da, db) {
  if (da === 0 && db === 0) return design;
  const moving = new Set(indices);
  return landIntact(
    design,
    design.cells.map((cell, index) =>
      moving.has(index)
        ? { ...pinTriCell(cell), column: cell.column + da, row: cell.row + db }
        : cell
    )
  );
}

export function duplicateTriCells(design, indices, da, db) {
  if (da === 0 && db === 0) return design;
  const copies = indices.map((index) => {
    const cell = pinTriCell(design.cells[index]);
    return { ...cell, column: cell.column + da, row: cell.row + db };
  });
  return landIntact(design, [...design.cells, ...copies]);
}

export function triDesignBounds({ cells }) {
  if (cells.length === 0) return null;
  const box = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  cells.forEach((cell) => {
    const { x0, x1, y0, y1 } = cellBox(geometryOf(cell));
    box.x0 = Math.min(box.x0, x0);
    box.y0 = Math.min(box.y0, y0);
    box.x1 = Math.max(box.x1, x1);
    box.y1 = Math.max(box.y1, y1);
  });
  return box;
}

// The square the field is drawn in, in micro-cell units: the design's extent plus a margin, centred.
export function triDesignFrame(design) {
  const box = triDesignBounds(design);
  if (box && design.layout === 'subdivide') {
    triNetworks(design)
      .filter((group) => group.length > 2)
      .flat()
      .forEach((index) => {
        const source = design.cells[index];
        const points = cornerPoints(geometryOf(source));
        CORNERS.forEach((side) => {
          if (hasCorner(source.mask, side)) return;
          const a = points[side];
          const b = points[(side + 1) % 3];
          const x = (a[0] + b[0]) / 2;
          const y = (a[1] + b[1]) / 2;
          const r = source.size / 2;
          box.x0 = Math.min(box.x0, x - r);
          box.x1 = Math.max(box.x1, x + r);
          box.y0 = Math.min(box.y0, y - r);
          box.y1 = Math.max(box.y1, y + r);
        });
      });
  }
  if (!box) {
    return {
      column: -EMPTY_FRAME / 2,
      row: -EMPTY_FRAME / 2,
      size: EMPTY_FRAME,
    };
  }
  const width = box.x1 - box.x0;
  const height = box.y1 - box.y0;
  const size = Math.ceil(Math.max(width, height)) + FRAME_MARGIN * 2;
  return {
    column: box.x0 - (size - width) / 2,
    row: box.y0 - (size - height) / 2,
    size,
  };
}

// Axes through the lattice origin. Diagonal and antidiagonal are the lines
// that turn onto vertical and horizontal once the field is rotated 30°.
const TRI_MIRRORS = {
  antidiagonal: {
    map: ([a, b]) => [b, a],
    side: (x, y) => -x / 2 + (Math.sqrt(3) / 2) * y,
  },
  diagonal: {
    map: ([a, b]) => [-b, -a],
    side: (x, y) => (Math.sqrt(3) / 2) * x + y / 2,
  },
  horizontal: { map: ([a, b]) => [a + b, -b], side: (x, y) => y },
  vertical: { map: ([a, b]) => [-a - b, b], side: (x) => x },
};

function mirrorOf(cell, axis) {
  const corners = cellCorners(geometryOf(cell)).map(TRI_MIRRORS[axis].map);
  return cellFromCorners(corners, cell.size);
}

function mirrorTriCell(cell, axis, edgeConnectors = false) {
  const { cell: placed, order } = mirrorOf(cell, axis);
  const corners = cornersOn(cell.mask).reduce(
    (acc, corner) =>
      withCorner(acc, order[edgeConnectors ? (corner + 1) % 3 : corner], true),
    0
  );
  const [top, swapped] = orderOf(cell);
  const rest = [(top + 1) % 3, (top + 2) % 3];
  if (swapped) rest.reverse();
  const mappedTop = order[top];
  const mappedRest = [(mappedTop + 1) % 3, (mappedTop + 2) % 3];
  return {
    column: placed.column,
    mask:
      corners |
      (placed.up ? UP : 0) |
      orderBits(mappedTop, mappedRest[0] !== order[rest[0]]),
    row: placed.row,
    size: cell.size,
  };
}

function onTriAxis(cell, axis) {
  const { cell: placed } = mirrorOf(cell, axis);
  return (
    placed.column === cell.column &&
    placed.row === cell.row &&
    placed.up === ((cell.mask & UP) !== 0)
  );
}

const inTriHalf = (cell, axis) =>
  cornerPoints(geometryOf(cell)).every(
    ([x, y]) => TRI_MIRRORS[axis].side(x, y) <= ON_LINE
  );

// A cell on the axis keeps a mirrored corner set; with all three on, the corner on the axis closes.
function balanceOnTriAxis(cell, axis, edgeConnectors = false) {
  const { order } = mirrorOf(cell, axis);
  let corners = cornersOn(cell.mask).reduce(
    (acc, corner) =>
      withCorner(
        withCorner(acc, corner, true),
        order[edgeConnectors ? (corner + 1) % 3 : corner],
        true
      ),
    0
  );
  if (cornersOn(corners).length === 3) {
    corners = withCorner(
      corners,
      order.findIndex((to, from) => to === from),
      false
    );
  }
  return { ...cell, mask: corners | (cell.mask & UP) | PINNED_ORDER };
}

export function symmetricTriDesign(design, axis, { hideLoose } = {}) {
  if (!TRI_MIRRORS[axis]) return design;
  let half = pinTriChoices(design).cells.filter(
    (cell) => inTriHalf(cell, axis) && !onTriAxis(cell, axis)
  );
  let axisCells = design.cells
    .filter((cell) => onTriAxis(cell, axis))
    .map((cell) => balanceOnTriAxis(cell, axis, design.layout === 'subdivide'));
  let result = design;
  for (let pass = 0; pass < 8; pass += 1) {
    const cells = [
      ...half,
      ...axisCells,
      ...half.map((cell) =>
        mirrorTriCell(cell, axis, design.layout === 'subdivide')
      ),
    ];
    result = normalizeTriDesign({ ...design, cells });
    if (result.cells.every((cell, i) => cell.mask === cells[i].mask)) break;
    half = result.cells.slice(0, half.length);
    axisCells = result.cells
      .slice(half.length, half.length + axisCells.length)
      .map((cell) =>
        balanceOnTriAxis(cell, axis, design.layout === 'subdivide')
      );
  }
  if (!hideLoose) return result;
  return normalizeTriDesign({
    ...result,
    cells: result.cells.filter((cell) => (cell.mask & CORNER_BITS) !== 0),
  });
}

const EMPTY_FIELD = {
  cellSize: 1,
  cells: [],
  centers: new Float32Array(0),
  conn0: new Float32Array(0),
  conn1: new Float32Array(0),
  connectorMask: new Float32Array(0),
  count: 0,
  delays: new Float32Array(0),
  positions: new Float32Array(0),
  shape: TRIANGLE,
  sizes: new Float32Array(0),
};

function assembleTriField(drawn, frame, canvasSize) {
  if (drawn.length === 0) {
    return { ...EMPTY_FIELD, gridSize: frame.size };
  }
  const cellSize = canvasSize / frame.size;
  const midX = frame.column + frame.size / 2;
  const midY = frame.row + frame.size / 2;
  const count = drawn.length;
  const positions = new Float32Array(count * 3);
  const centers = new Float32Array(count * 2);
  const sizes = new Float32Array(count);
  const conn0 = new Float32Array(count * 2);
  const conn1 = new Float32Array(count * 2);
  const connectorMask = new Float32Array(count);
  drawn.forEach(({ cell, connections }, i) => {
    const [x, y] =
      cell.shape === TRIANGLE
        ? cellCenter(cell)
        : [cell.column + cell.size / 2, cell.row + cell.size / 2];
    centers[i * 2] = (x - midX) * cellSize;
    centers[i * 2 + 1] = (y - midY) * cellSize;
    positions[i * 3] = centers[i * 2];
    positions[i * 3 + 1] = -centers[i * 2 + 1];
    sizes[i] = cell.size;
    const [first, second] = connections;
    [conn0[i * 2], conn0[i * 2 + 1]] = first;
    conn1[i * 2] = second ? second[0] : -1;
    conn1[i * 2 + 1] = second ? second[1] : 0;
    connectorMask[i] = cell.connectors.reduce(
      (acc, on, corner) => acc + (on ? 2 ** corner : 0),
      0
    );
  });
  return {
    cellSize,
    cells: drawn,
    centers,
    conn0,
    conn1,
    connectorMask,
    count,
    delays: growthDelays(
      centers,
      count,
      drawn.map(({ group }) => group)
    ),
    gridSize: frame.size,
    positions,
    shape: TRIANGLE,
    sizes,
  };
}

// A three-way cell is two entries: its bottom fan alone, drawn first so the
// other two paint over it, then the top and middle fans. The bottom entry
// lists those two as `occluders` for the CPU consumers.
export function fieldFromTriDesign(
  design,
  canvasSize,
  frame = triDesignFrame(design),
  pathDiv = 4
) {
  const resolved = normalizeTriDesign(design);
  if (design.layout === 'subdivide') {
    const drawn = triangleFans(
      resolved,
      triNetworks(resolved),
      pathDiv,
      (cell) => triConnections({ ...cell, mask: cell.mask | 7 }, true)
    );
    return {
      ...assembleTriField(drawn, frame, canvasSize),
      layout: 'subdivide',
      pathsPerUnit: pathDiv,
      sourceDesign: resolved,
    };
  }
  const order = resolved.cells
    .map((_, index) => index)
    .sort((a, b) => {
      const ca = resolved.cells[a];
      const cb = resolved.cells[b];
      if (ca.row !== cb.row) return ca.row - cb.row;
      if (ca.column !== cb.column) return ca.column - cb.column;
      return (ca.mask & UP) - (cb.mask & UP);
    });
  const drawn = [];
  order.forEach((index, at) => {
    const source = resolved.cells[index];
    const cell = {
      ...geometryOf(source),
      connectors: CORNERS.map((corner) => hasCorner(source.mask, corner)),
    };
    const connections = triConnections(source, design.layout === 'subdivide');
    if (connections.length === 3) {
      const [top, middle, bottom] = connections;
      drawn.push({
        cell,
        connections: [bottom],
        group: at,
        occluders: [top, middle].map(([type, edge]) => ({ cell, edge, type })),
        under: true,
      });
      drawn.push({
        cell,
        connections: [top, middle],
        group: at,
        occluders: [],
      });
    } else {
      drawn.push({ cell, connections, group: at, occluders: [] });
    }
  });
  // Pockets and bends are drawn after every cell, so they sit on top; each
  // covers its host and the extras before it.
  const extras = triIrregularFamilies(resolved);
  const hostEntries = new Map();
  drawn.forEach((entry, i) => {
    if (!hostEntries.has(entry.group)) hostEntries.set(entry.group, []);
    hostEntries.get(entry.group).push(i);
  });
  order.forEach((index, at) => {
    (extras.get(index) ?? []).forEach(({ connection: [type, edge] }) => {
      const { cell } = drawn[hostEntries.get(at)[0]];
      const sector = { cell, edge, type };
      hostEntries.get(at).forEach((i) => drawn[i].occluders.push(sector));
      drawn
        .filter((entry) => entry.virtual && entry.group === at)
        .forEach((entry) => entry.occluders.push(sector));
      drawn.push({
        cell,
        connections: [[type, edge]],
        group: at,
        occluders: [],
        virtual: true,
      });
    });
  });
  return assembleTriField(drawn, frame, canvasSize);
}

export function designFromTriField(field) {
  if (field.sourceDesign) return pinTriChoices(field.sourceDesign);
  return {
    ...(field.layout === 'subdivide' ? { layout: 'subdivide' } : {}),
    ...(field.cells.some((entry) => entry.virtual) ? { irregular: true } : {}),
    cells: field.cells
      .filter((entry) => !entry.under && !entry.virtual && !entry.cap)
      .map(({ cell, connections }) => {
        const corners = cell.connectors.reduce(
          (acc, on, corner) => withCorner(acc, corner, on),
          0
        );
        const base = {
          column: cell.column,
          mask: corners | (cell.up ? UP : 0),
          row: cell.row,
          size: cell.size,
        };
        if (connections.length < 2 || cornersOn(corners).length < 3) {
          return { ...base, mask: base.mask | PINNED_ORDER };
        }
        const top = connections[0][1] % 3;
        const middle = connections[1][1] % 3;
        return {
          ...base,
          mask: base.mask | orderBits(top, middle !== (top + 1) % 3),
        };
      }),
    shape: TRIANGLE,
  };
}
