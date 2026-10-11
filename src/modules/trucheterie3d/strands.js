import { familySector, isWeaveCell, laneRadii } from '@modules/trucheterieBlob';

// Every lane and stroke of the blob field as a circular arc in grid units
// (one micro-cell = 1, y down): the 2D drawing's own geometry, so tubes laid
// on these centrelines inherit its planarity. A family's wedge starts at
// edge·π/2 and spans 2π, π or π/2 for types 0, 1, 2.
const SPAN = [Math.PI * 2, Math.PI, Math.PI / 2];
const TAU = Math.PI * 2;

const mod = (a, n) => ((a % n) + n) % n;

function hiddenArcs(center, radius, occluder) {
  if (!occluder) return [];
  const dx = occluder.x - center[0];
  const dy = occluder.y - center[1];
  const d = Math.hypot(dx, dy);
  if (d < 1e-9) return radius < occluder.rMax ? [[0, TAU]] : [];
  const k = (radius * radius + d * d - occluder.rMax ** 2) / (2 * radius * d);
  if (k >= 1) return [];
  if (k <= -1) return [[0, TAU]];
  const alpha = Math.acos(k);
  const phi = Math.atan2(dy, dx);
  return [[phi - alpha, phi + alpha]];
}

// The wedge [lo, hi] minus the occluder's disc, as 0, 1 or 2 intervals —
// the same `d > rMax0` the 2D shader keeps.
function visibleIntervals(lo, hi, hidden) {
  let parts = [[lo, hi]];
  hidden.forEach(([h0, h1]) => {
    if (h1 - h0 >= TAU) {
      parts = [];
      return;
    }
    const center = lo + mod((h0 + h1) / 2 - lo, TAU);
    const half = (h1 - h0) / 2;
    [center, center - TAU].forEach((c) => {
      parts = parts.flatMap(([a, b]) => {
        const c0 = c - half;
        const c1 = c + half;
        if (c1 <= a || c0 >= b) return [[a, b]];
        const out = [];
        if (c0 > a) out.push([a, c0]);
        if (c1 < b) out.push([c1, b]);
        return out;
      });
    });
  });
  return parts.filter(([a, b]) => b - a > 1e-9);
}

function strokeRadii(type, size, pathDiv) {
  const bands = Math.round(size * pathDiv);
  if (type === 2) {
    return Array.from({ length: bands }, (_, i) => (i + 1) / pathDiv);
  }
  const odd = bands % 2 === 1 ? 0.5 : 0;
  return Array.from(
    { length: Math.floor(bands / 2) + 1 },
    (_, k) => (k + odd) / pathDiv
  ).filter((r) => r > 1e-9);
}

const pointAt = (center, radius, angle) => [
  center[0] + radius * Math.cos(angle),
  center[1] + radius * Math.sin(angle),
];

function familyArcs({ cell, cellIndex, edge, occluder, pathDiv, slot, type }) {
  const sector = familySector(cell, type, edge);
  const center = [sector.x, sector.y];
  const start = edge * (Math.PI / 2);
  const span = SPAN[type];
  const base = { cell: cellIndex, center, edge, slot, span, start, type };
  const pieces = [];
  const dots = [];

  const add = (kind, index, radius, extra = {}) => {
    const full = type === 0 && !occluder;
    visibleIntervals(
      start,
      start + span,
      hiddenArcs(center, radius, occluder)
    ).forEach(([a0, a1]) => {
      pieces.push({
        ...base,
        ...extra,
        a0,
        a1,
        index,
        kind,
        loop: full,
        radius,
        trimmed: [a0 > start + 1e-9, a1 < start + span - 1e-9],
      });
    });
  };

  laneRadii(type, cell.size, pathDiv).forEach(([r0, r1], j) => {
    if (r0 < 1e-9 && r1 - r0 < 0.75 / pathDiv && type !== 2) {
      const at = center;
      const hidden =
        occluder &&
        Math.hypot(at[0] - occluder.x, at[1] - occluder.y) <= occluder.rMax;
      if (!hidden) dots.push({ ...base, at, index: j, onEdge: type === 1 });
      return;
    }
    add('lane', j, (r0 + r1) / 2, { width: r1 - r0 });
  });
  strokeRadii(type, cell.size, pathDiv).forEach((radius, k) =>
    add('wire', k, radius)
  );
  return { dots, pieces };
}

// Pieces (arcs clipped to what the 2D drawing shows) and dots (the odd
// half-pitch discs at a stub's side midpoint or an isolated cell's centre).
// `weave` lets a four-way cell's second family keep its hidden span.
export default function buildStrands(field, { junction, pathDiv }) {
  const pieces = [];
  const dots = [];
  field.cells.forEach(({ cell, connections }, cellIndex) => {
    const weaves = junction === 'weave' && isWeaveCell(connections);
    const first = connections[0];
    connections.forEach(([type, edge], slot) => {
      const occluder =
        slot === 1 && !weaves ? familySector(cell, first[0], first[1]) : null;
      const out = familyArcs({
        cell,
        cellIndex,
        edge,
        occluder,
        pathDiv,
        slot,
        type,
      });
      pieces.push(...out.pieces);
      dots.push(...out.dots);
    });
  });
  return { dots, pieces };
}

export { hiddenArcs, pointAt, SPAN, visibleIntervals };
