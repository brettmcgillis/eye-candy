export const EPS = 1e-7;

export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const scale = (a, s) => [a[0] * s, a[1] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
export const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
export const len = (a) => Math.hypot(a[0], a[1]);
export const lerp = (a, b, t) => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];
export const dist = (a, b) => len(sub(a, b));
export const normalize = (a) => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};
export const perp = (a) => [-a[1], a[0]];

export function signedArea(poly) {
  let area = 0;
  for (let i = 0; i < poly.length; i += 1) {
    area += cross(poly[i], poly[(i + 1) % poly.length]);
  }
  return area / 2;
}

export function centroid(poly) {
  const area = signedArea(poly);
  if (Math.abs(area) < EPS) {
    const sum = poly.reduce((acc, p) => add(acc, p), [0, 0]);
    return scale(sum, 1 / poly.length);
  }
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i += 1) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const c = cross(a, b);
    cx += (a[0] + b[0]) * c;
    cy += (a[1] + b[1]) * c;
  }
  return [cx / (6 * area), cy / (6 * area)];
}

export const ccw = (poly) =>
  signedArea(poly) < 0 ? [...poly].reverse() : poly;

// Intersection of the lines p + s·r and q + u·w; null when parallel.
export function lineIntersect(p, r, q, w) {
  const denom = cross(r, w);
  if (Math.abs(denom) < EPS) return null;
  const s = cross(sub(q, p), w) / denom;
  return add(p, scale(r, s));
}

// Proper-or-touching segment intersection parameters along both segments.
export function segmentHit(a, b, c, d) {
  const r = sub(b, a);
  const w = sub(d, c);
  const denom = cross(r, w);
  if (Math.abs(denom) < EPS) return null;
  const qp = sub(c, a);
  const t = cross(qp, w) / denom;
  const u = cross(qp, r) / denom;
  const tol = 1e-9;
  if (t < -tol || t > 1 + tol || u < -tol || u > 1 + tol) return null;
  return { t: Math.min(1, Math.max(0, t)), u: Math.min(1, Math.max(0, u)) };
}

export function pointInPolygon(point, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }
  return inside;
}

// Sutherland–Hodgman against a convex CCW window.
export function clipPolygon(poly, window) {
  let output = poly;
  for (let i = 0; i < window.length && output.length > 0; i += 1) {
    const a = window[i];
    const edge = sub(window[(i + 1) % window.length], a);
    const inside = (p) => cross(edge, sub(p, a)) >= -EPS;
    const input = output;
    output = [];
    for (let j = 0; j < input.length; j += 1) {
      const cur = input[j];
      const prev = input[(j + input.length - 1) % input.length];
      const curIn = inside(cur);
      const prevIn = inside(prev);
      if (curIn !== prevIn) {
        output.push(lineIntersect(prev, sub(cur, prev), a, edge));
      }
      if (curIn) output.push(cur);
    }
  }
  return output.filter(Boolean);
}

// Liang–Barsky against an axis-aligned rect; null when fully outside.
export function clipSegment(a, b, [x0, y0, x1, y1]) {
  const d = sub(b, a);
  let t0 = 0;
  let t1 = 1;
  const checks = [
    [-d[0], a[0] - x0],
    [d[0], x1 - a[0]],
    [-d[1], a[1] - y0],
    [d[1], y1 - a[1]],
  ];
  for (let i = 0; i < checks.length; i += 1) {
    const [p, q] = checks[i];
    if (Math.abs(p) < EPS) {
      if (q < 0) return null;
    } else {
      const r = q / p;
      if (p < 0) t0 = Math.max(t0, r);
      else t1 = Math.min(t1, r);
    }
  }
  if (t0 > t1 - EPS) return null;
  return [lerp(a, b, t0), lerp(a, b, t1)];
}

export const rectPolygon = ([x0, y0, x1, y1]) => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];

export const insetRect = ([x0, y0, x1, y1], by) => [
  x0 + by,
  y0 + by,
  x1 - by,
  y1 - by,
];

export function regularPolygon(center, radius, sides, rotation = 0) {
  return Array.from({ length: sides }, (_, i) => {
    const angle = rotation + (i * 2 * Math.PI) / sides;
    return [
      center[0] + radius * Math.cos(angle),
      center[1] + radius * Math.sin(angle),
    ];
  });
}

export function bbox(poly) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

// A convex CCW polygon with each side pushed in by its own distance.
export function insetPolygon(poly, by) {
  const lines = poly.map((a, i) => {
    const d = normalize(sub(poly[(i + 1) % poly.length], a));
    return { d, p: add(a, scale(perp(d), by[i])) };
  });
  return lines.map((line, i) => {
    const prev = lines[(i + lines.length - 1) % lines.length];
    return lineIntersect(prev.p, prev.d, line.p, line.d) ?? line.p;
  });
}
