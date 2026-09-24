import { fieldMaxima } from './geodesic';

const vec = (array, v) => [array[v * 3], array[v * 3 + 1], array[v * 3 + 2]];
const pos = (graph, v) => vec(graph.positions, v);
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const unit = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

function step(graph, v, heading, visited, score) {
  let best = -1;
  let bestScore = -Infinity;
  let bestDir = heading;
  const here = pos(graph, v);

  for (let k = graph.offsets[v]; k < graph.offsets[v + 1]; k += 1) {
    const n = graph.neighbors[k];
    if (!visited.has(n)) {
      const delta = sub(pos(graph, n), here);
      const length = Math.hypot(delta[0], delta[1], delta[2]);
      if (length > 1e-9) {
        const dir = [delta[0] / length, delta[1] / length, delta[2] / length];
        const s = score(n, dir, length);
        if (s > bestScore) {
          bestScore = s;
          best = n;
          bestDir = dir;
        }
      }
    }
  }
  return { dir: bestDir, next: best };
}

function hop(graph, v, hops, random) {
  let at = v;
  for (let i = 0; i < hops; i += 1) {
    const span = graph.offsets[at + 1] - graph.offsets[at];
    if (span > 0) {
      at = graph.neighbors[graph.offsets[at] + Math.floor(random() * span)];
    }
  }
  return at;
}

// Flow strands descend the geodesic field from its extremities. Descent keeps
// them tendon-like, momentum keeps them from zig-zagging along edges, and a
// per-strand sideways bias makes neighbours curl apart instead of sharing one
// ridge. `reachedBase` marks the ones that can continue into a tail.
export function walkFlowStrands(
  graph,
  field,
  {
    count,
    endDistance,
    jitter = 0.15,
    maxSteps = 800,
    minPeak = 0.3,
    momentum = 1.2,
    random,
    sideBias = 0.35,
    startSpread = 12,
  }
) {
  let peak = 0;
  field.forEach((d) => {
    if (Number.isFinite(d)) peak = Math.max(peak, d);
  });
  const starts = fieldMaxima(graph, field).filter(
    (v) => field[v] >= peak * minPeak
  );
  const strands = [];

  for (let s = 0; s < count && starts.length; s += 1) {
    let v = hop(
      graph,
      starts[Math.floor(random() * starts.length)],
      startSpread,
      random
    );
    const side = (random() * 2 - 1) * sideBias;
    const visited = new Set([v]);
    const path = [v];
    let heading = [0, -1, 0];

    for (let i = 0; i < maxSteps && field[v] > endDistance; i += 1) {
      const ahead = heading;
      const across = unit(cross(vec(graph.normals, v), ahead));
      const from = field[v];
      const { dir, next } = step(
        graph,
        v,
        ahead,
        visited,
        (n, d, length) =>
          (from - field[n]) / length +
          momentum * dot(d, ahead) +
          side * dot(d, across) +
          jitter * (random() - 0.5)
      );
      if (next < 0) break;
      heading = i === 0 ? dir : unit(dir.map((c, k) => c + ahead[k]));
      v = next;
      visited.add(v);
      path.push(v);
    }

    strands.push({ path, reachedBase: field[v] <= endDistance });
  }
  return strands;
}

// Wander strands fill what flow misses. Descending walks all want the same
// ridges, so these carry a coverage term: a coarse occupancy grid penalises
// ground earlier walks already claimed, and each walk starts on the emptiest
// of a few candidates. They end up wrapping the form like thread round a
// mould.
export function walkWanderStrands(
  graph,
  {
    candidates = 8,
    cellSize,
    count,
    coverage = 1.5,
    jitter = 0.25,
    momentum = 1.4,
    random,
    steps = 600,
  }
) {
  const occupancy = new Map();
  const cellOf = (v) => {
    const p = pos(graph, v);
    return `${Math.floor(p[0] / cellSize)},${Math.floor(
      p[1] / cellSize
    )},${Math.floor(p[2] / cellSize)}`;
  };
  const occ = (v) => occupancy.get(cellOf(v)) || 0;
  const strands = [];

  for (let s = 0; s < count; s += 1) {
    let v = Math.floor(random() * graph.count);
    for (let c = 1; c < candidates; c += 1) {
      const option = Math.floor(random() * graph.count);
      if (occ(option) < occ(v)) v = option;
    }
    const visited = new Set([v]);
    const path = [v];
    const normal0 = vec(graph.normals, v);
    let heading = unit(cross(normal0, [random() - 0.5, random() - 0.5, 1]));

    for (let i = 0; i < steps; i += 1) {
      const ahead = heading;
      const { dir, next } = step(
        graph,
        v,
        ahead,
        visited,
        (n, d) =>
          momentum * dot(d, ahead) -
          coverage * Math.min(occ(n) / 8, 2) +
          jitter * (random() - 0.5)
      );
      if (next < 0) break;
      heading = unit(dir.map((c, k) => c + ahead[k]));
      v = next;
      visited.add(v);
      path.push(v);
    }

    path.forEach((p) => {
      const key = cellOf(p);
      occupancy.set(key, (occupancy.get(key) || 0) + 1);
    });
    strands.push({ path });
  }

  let peak = 1;
  occupancy.forEach((c) => {
    peak = Math.max(peak, c);
  });
  return { crowding: (v) => occ(v) / peak, strands };
}
