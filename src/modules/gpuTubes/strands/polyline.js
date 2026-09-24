// Graph walks step edge to edge and zig-zag at the mesh's own resolution.
// Smoothing, then resampling by arc length to a fixed count, turns a walk
// into control points a spline can carry, at the uniform stride a GPU buffer
// needs.

export function smoothPolyline(points, passes = 3) {
  if (points.length < 3) return points;
  const dims = points[0].length;
  let current = points;
  for (let pass = 0; pass < passes; pass += 1) {
    const next = current.map((p) => [...p]);
    for (let i = 1; i < current.length - 1; i += 1) {
      for (let k = 0; k < dims; k += 1) {
        next[i][k] =
          current[i - 1][k] * 0.25 +
          current[i][k] * 0.5 +
          current[i + 1][k] * 0.25;
      }
    }
    current = next;
  }
  return current;
}

// Each point is [x, y, z, ...channels]; channels interpolate linearly.
export function resamplePolyline(points, count) {
  const lengths = [0];
  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    lengths.push(
      lengths[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
    );
  }
  const total = lengths[lengths.length - 1];
  const out = [];
  let j = 1;

  for (let i = 0; i < count; i += 1) {
    const target = (i / (count - 1)) * total;
    while (j < points.length - 1 && lengths[j] < target) j += 1;
    const span = lengths[j] - lengths[j - 1] || 1;
    const t = Math.min(Math.max((target - lengths[j - 1]) / span, 0), 1);
    const from = points[j - 1];
    out.push(points[j].map((b, k) => from[k] + (b - from[k]) * t));
  }
  return { length: total, points: out };
}
