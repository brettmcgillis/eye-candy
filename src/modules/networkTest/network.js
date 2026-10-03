import buildPoints from './composition';
import buildEdges from './wiring';

function createHeap() {
  const items = [];
  const up = (i) => {
    let at = i;
    while (at > 0) {
      const parent = (at - 1) >> 1; // eslint-disable-line no-bitwise
      if (items[parent][0] <= items[at][0]) return;
      [items[parent], items[at]] = [items[at], items[parent]];
      at = parent;
    }
  };
  const down = (i) => {
    let at = i;
    for (;;) {
      const l = at * 2 + 1;
      const r = l + 1;
      let min = at;
      if (l < items.length && items[l][0] < items[min][0]) min = l;
      if (r < items.length && items[r][0] < items[min][0]) min = r;
      if (min === at) return;
      [items[min], items[at]] = [items[at], items[min]];
      at = min;
    }
  };
  return {
    get size() {
      return items.length;
    },
    pop() {
      const top = items[0];
      const last = items.pop();
      if (items.length > 0) {
        items[0] = last;
        down(0);
      }
      return top;
    },
    push(item) {
      items.push(item);
      up(items.length - 1);
    },
  };
}

export function adjacencyOf(count, edges) {
  const adjacency = Array.from({ length: count }, () => []);
  edges.forEach(({ a, b }, index) => {
    adjacency[a].push([b, index]);
    adjacency[b].push([a, index]);
  });
  return adjacency;
}

// When each point is reached growing out along the edges, in [0, 1]: one
// root per connected piece (the point nearest its centroid), arrival by path
// length. Points no edge reaches arrive with their piece's root.
export function arrivalTimes(positions, count, edges, adjacency) {
  const seen = new Int32Array(count).fill(-1);
  const pieces = [];
  for (let i = 0; i < count; i += 1) {
    if (seen[i] < 0) {
      const piece = [];
      const stack = [i];
      seen[i] = pieces.length;
      while (stack.length > 0) {
        const at = stack.pop();
        piece.push(at);
        adjacency[at].forEach(([next]) => {
          if (seen[next] < 0) {
            seen[next] = pieces.length;
            stack.push(next);
          }
        });
      }
      pieces.push(piece);
    }
  }

  const time = new Float64Array(count).fill(Infinity);
  const heap = createHeap();
  pieces.forEach((piece) => {
    const c = [0, 1, 2].map(
      (a) =>
        piece.reduce((sum, i) => sum + positions[i * 3 + a], 0) / piece.length
    );
    let root = piece[0];
    let best = Infinity;
    piece.forEach((i) => {
      const d = Math.hypot(
        positions[i * 3] - c[0],
        positions[i * 3 + 1] - c[1],
        positions[i * 3 + 2] - c[2]
      );
      if (d < best) {
        best = d;
        root = i;
      }
    });
    time[root] = 0;
    heap.push([0, root]);
  });
  while (heap.size > 0) {
    const [t, at] = heap.pop();
    if (t <= time[at]) {
      adjacency[at].forEach(([next, edge]) => {
        const arrive = t + edges[edge].length;
        if (arrive < time[next]) {
          time[next] = arrive;
          heap.push([arrive, next]);
        }
      });
    }
  }
  let latest = 0;
  time.forEach((t) => {
    if (Number.isFinite(t)) latest = Math.max(latest, t);
  });
  return time.map((t) => (Number.isFinite(t) && latest > 0 ? t / latest : 0));
}

export function wire(points, config) {
  const { degree, edges, spacing } = buildEdges(points, config);
  const adjacency = adjacencyOf(points.count, edges);
  return { adjacency, degree, edges, spacing };
}

// Points, edges and growth order: everything a frame is built from.
// `image` is RGBA bytes ({ data, width, height, channels }) for imageShare.
export default function buildNetwork(config, { image = null, points } = {}) {
  const scattered = points ?? buildPoints(config, { image });
  const wiring = wire(scattered, config);
  return {
    ...scattered,
    ...wiring,
    arrival: arrivalTimes(
      scattered.positions,
      scattered.count,
      wiring.edges,
      wiring.adjacency
    ),
  };
}
