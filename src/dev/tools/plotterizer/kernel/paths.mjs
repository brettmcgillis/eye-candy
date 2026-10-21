const pointKey = ([x, y]) => `${Math.round(x * 1000)},${Math.round(y * 1000)}`;

export function runLength({ closed, points }) {
  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    length += Math.hypot(
      points[i][0] - points[i - 1][0],
      points[i][1] - points[i - 1][1]
    );
  }
  if (closed && points.length > 2) {
    length += Math.hypot(
      points[0][0] - points.at(-1)[0],
      points[0][1] - points.at(-1)[1]
    );
  }
  return length;
}

export const transformRuns = (runs, scale, [dx, dy]) =>
  runs.map((run) => ({
    ...run,
    points: run.points.map(([x, y]) => [x * scale + dx, y * scale + dy]),
  }));

// Open runs that end where another starts become one run, so the pen lifts
// once per stroke rather than once per SVG element.
export function joinRuns(runs) {
  const open = new Set(runs.filter((run) => !run.closed));
  const starts = new Map();
  open.forEach((run) => {
    const key = pointKey(run.points[0]);
    if (!starts.has(key)) starts.set(key, []);
    starts.get(key).push(run);
  });
  const next = new Map();
  const followed = new Set();
  open.forEach((run) => {
    const after = starts
      .get(pointKey(run.points.at(-1)))
      ?.find((other) => other !== run && !followed.has(other));
    if (after) {
      next.set(run, after);
      followed.add(after);
    }
  });
  const used = new Set();
  const follow = (head) => {
    const points = [...head.points];
    used.add(head);
    let run = next.get(head);
    while (run && !used.has(run)) {
      used.add(run);
      points.push(...run.points.slice(1));
      run = next.get(run);
    }
    if (run !== head) return { closed: false, points };
    points.pop();
    return { closed: true, points };
  };
  const joined = [];
  runs.forEach((run) => {
    if (!open.has(run)) joined.push(run);
    else if (!followed.has(run)) joined.push(follow(run));
  });
  open.forEach((run) => {
    if (!used.has(run)) joined.push(follow(run));
  });
  return joined;
}

// Ramer–Douglas–Peucker, iterative so a long joined stroke can't overflow.
function simplifyPoints(points, tolerance) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const spans = [[0, points.length - 1]];
  while (spans.length) {
    const [a, b] = spans.pop();
    const [ax, ay] = points[a];
    const dx = points[b][0] - ax;
    const dy = points[b][1] - ay;
    const lengthSq = dx * dx + dy * dy;
    let worst = tolerance;
    let index = -1;
    for (let i = a + 1; i < b; i += 1) {
      const [px, py] = points[i];
      const t = lengthSq
        ? Math.min(1, Math.max(0, ((px - ax) * dx + (py - ay) * dy) / lengthSq))
        : 0;
      const d = Math.hypot(px - ax - t * dx, py - ay - t * dy);
      if (d > worst) {
        worst = d;
        index = i;
      }
    }
    if (index >= 0) {
      keep[index] = 1;
      spans.push([a, index], [index, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

export function simplifyRun(run, tolerance) {
  if (!run.closed) {
    return { ...run, points: simplifyPoints(run.points, tolerance) };
  }
  const ring = simplifyPoints([...run.points, run.points[0]], tolerance).slice(
    0,
    -1
  );
  return ring.length >= 3 ? { ...run, points: ring } : run;
}

const entries = (run) => {
  if (run.closed) return run.points.map(([x, y], i) => [x, y, i]);
  const last = run.points.length - 1;
  return [
    [...run.points[0], 0],
    [...run.points[last], last],
  ];
};

function entered(run, vertex) {
  if (run.closed) {
    return {
      ...run,
      points: [...run.points.slice(vertex), ...run.points.slice(0, vertex)],
    };
  }
  return {
    ...run,
    points: vertex ? [...run.points].reverse() : [...run.points],
  };
}

const exitOf = (run) => (run.closed ? run.points[0] : run.points.at(-1));

// Greedy nearest-neighbour tour from the page's top-left (the cutter's
// home): open runs may be drawn backwards, closed ones entered at their
// nearest vertex, and an open run starting within `bridgeMm` of the last
// one's end is drawn on without lifting the pen.
export function orderRuns(runs, [w, h], { bridgeMm = 0 } = {}) {
  if (runs.length < 2) return runs.map((run) => entered(run, 0));
  const candidates = runs.map(entries);
  const total = candidates.reduce((sum, list) => sum + list.length, 0);
  const cell = Math.max(0.5, Math.sqrt((2 * w * h) / total));
  const cols = Math.max(1, Math.ceil(w / cell) + 1);
  const rows = Math.max(1, Math.ceil(h / cell) + 1);
  const grid = Array.from({ length: cols * rows }, () => []);
  const cellOf = (x, y) => [
    Math.min(cols - 1, Math.max(0, Math.floor(x / cell))),
    Math.min(rows - 1, Math.max(0, Math.floor(y / cell))),
  ];
  candidates.forEach((list, index) =>
    list.forEach(([x, y, vertex]) => {
      const [gx, gy] = cellOf(x, y);
      grid[gy * cols + gx].push([x, y, index, vertex]);
    })
  );
  const used = new Uint8Array(runs.length);
  let left = runs.length;
  let pointsLeft = total;
  const nearest = ([px, py]) => {
    let best = null;
    let bestD = Infinity;
    const consider = ([x, y, index, vertex]) => {
      if (used[index]) return;
      const d = Math.hypot(x - px, y - py);
      if (d < bestD) {
        bestD = d;
        best = [index, vertex];
      }
    };
    const [cx, cy] = cellOf(px, py);
    const maxRing = Math.max(cols, rows);
    let scanned = 0;
    for (let ring = 0; ring <= maxRing; ring += 1) {
      for (let gy = cy - ring; gy <= cy + ring; gy += 1) {
        if (gy >= 0 && gy < rows) {
          const edge = gy === cy - ring || gy === cy + ring;
          const step = edge ? 1 : 2 * ring || 1;
          for (let gx = cx - ring; gx <= cx + ring; gx += step) {
            if (gx >= 0 && gx < cols) {
              grid[gy * cols + gx].forEach(consider);
              scanned += 1;
            }
          }
        }
      }
      if (best && bestD <= ring * cell) break;
      if (scanned > pointsLeft) {
        candidates.forEach((list, index) => {
          if (!used[index]) {
            list.forEach(([x, y, vertex]) => consider([x, y, index, vertex]));
          }
        });
        break;
      }
    }
    return { best, distance: bestD };
  };
  const ordered = [];
  let at = [0, 0];
  while (left) {
    const { best, distance } = nearest(at);
    const [index, vertex] = best;
    used[index] = 1;
    left -= 1;
    pointsLeft -= candidates[index].length;
    const next = entered(runs[index], vertex);
    const current = ordered.at(-1);
    if (current && !current.closed && !next.closed && distance <= bridgeMm) {
      current.points.push(...next.points.slice(distance < 1e-9 ? 1 : 0));
    } else {
      ordered.push(next);
    }
    at = exitOf(ordered.at(-1));
  }
  return ordered;
}

// One pen's runs, ready to plot: joined, simplified, specks dropped,
// ordered for travel.
export function optimiseRuns(
  runs,
  page,
  { bridgeMm = 0.25, minLengthMm = 0, simplifyMm = 0.1 } = {}
) {
  const kept = joinRuns(runs)
    .map((run) => (run.arcs ? run : simplifyRun(run, simplifyMm)))
    .filter((run) => run.points.length >= 2 && runLength(run) >= minLengthMm);
  return orderRuns(kept, page, { bridgeMm });
}
