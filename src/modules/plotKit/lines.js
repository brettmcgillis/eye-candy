// Polyline helpers the plot layers share.

// Joins segments that share an end into polylines, so a pen lifts once per
// edge rather than once per cell.
export function chain(segments) {
  const key = ([u, v]) => `${Math.round(u * 1e6)},${Math.round(v * 1e6)}`;
  const ends = new Map();
  segments.forEach((segment, index) => {
    segment.forEach((p) => {
      const k = key(p);
      if (!ends.has(k)) ends.set(k, []);
      ends.get(k).push(index);
    });
  });
  const used = new Uint8Array(segments.length);
  const next = (p) => (ends.get(key(p)) ?? []).find((index) => !used[index]);
  const lines = [];
  segments.forEach((segment, start) => {
    if (used[start]) return;
    used[start] = 1;
    const line = [...segment];
    for (let grow = 0; grow < 2; grow += 1) {
      for (;;) {
        const tail = line[line.length - 1];
        const index = next(tail);
        if (index === undefined) break;
        used[index] = 1;
        const [a, b] = segments[index];
        line.push(key(a) === key(tail) ? b : a);
      }
      line.reverse();
    }
    lines.push(line);
  });
  return lines;
}

// Ramer–Douglas–Peucker: the pixel staircase becomes a few true strokes.
export function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const [ax, ay] = points[0];
  const [bx, by] = points[points.length - 1];
  const length = Math.hypot(bx - ax, by - ay) || 1;
  let worst = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i += 1) {
    const [px, py] = points[i];
    const d = Math.abs((bx - ax) * (ay - py) - (ax - px) * (by - ay)) / length;
    if (d > worst) {
      worst = d;
      index = i;
    }
  }
  if (worst <= tolerance) return [points[0], points[points.length - 1]];
  return [
    ...simplify(points.slice(0, index + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(index), tolerance),
  ];
}

// A closed loop's ends coincide, which leaves RDP no chord to measure from;
// it is split at the point farthest from its start instead.
export function simplifyLoop(points, tolerance) {
  const [x0, y0] = points[0];
  const [ex, ey] = points[points.length - 1];
  if (points.length < 4 || x0 !== ex || y0 !== ey) {
    return simplify(points, tolerance);
  }
  let far = 1;
  let best = -1;
  points.forEach(([x, y], i) => {
    const d = Math.hypot(x - x0, y - y0);
    if (d > best) {
      best = d;
      far = i;
    }
  });
  return [
    ...simplify(points.slice(0, far + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(far), tolerance),
  ];
}

// One round of Chaikin corner cutting, keeping a closed loop closed.
export function smooth(points) {
  if (points.length < 3) return points;
  const closed =
    points[0][0] === points[points.length - 1][0] &&
    points[0][1] === points[points.length - 1][1];
  const out = closed ? [] : [points[0]];
  for (let i = 0; i < points.length - 1; i += 1) {
    const [ax, ay] = points[i];
    const [bx, by] = points[i + 1];
    out.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25]);
    out.push([ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
  }
  if (closed) out.push(out[0]);
  else out.push(points[points.length - 1]);
  return out;
}
