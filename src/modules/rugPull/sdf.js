// 2D signed distances (Inigo Quilez's forms) for drawing motifs on the knot
// grid. Negative is inside.

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function circle(x, y, r) {
  return Math.hypot(x, y) - r;
}

export function box(x, y, bx, by) {
  const dx = Math.abs(x) - bx;
  const dy = Math.abs(y) - by;
  return (
    Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0)
  );
}

export function rhombus(x, y, bx, by) {
  const px = Math.abs(x);
  const py = Math.abs(y);
  const h = clamp(
    ((bx - 2 * px) * bx - (by - 2 * py) * by) / (bx * bx + by * by),
    -1,
    1
  );
  const d = Math.hypot(px - 0.5 * bx * (1 - h), py - 0.5 * by * (1 + h));
  return d * Math.sign(px * by + py * bx - bx * by);
}

export function ellipse(x, y, a, b) {
  const k = Math.hypot(x / a, y / b);
  return (k - 1) * Math.min(a, b);
}

export function octagon(x, y, r) {
  const kx = -0.9238795325;
  const ky = 0.3826834323;
  const kz = 0.4142135623;
  let px = Math.abs(x);
  let py = Math.abs(y);
  let m = 2 * Math.min(kx * px + ky * py, 0);
  px -= m * kx;
  py -= m * ky;
  m = 2 * Math.min(-kx * px + ky * py, 0);
  px -= m * -kx;
  py -= m * ky;
  px -= clamp(px, -kz * r, kz * r);
  py -= r;
  return Math.hypot(px, py) * Math.sign(py);
}

export function hexagon(x, y, r) {
  const kx = -0.866025404;
  const ky = 0.5;
  const kz = 0.577350269;
  let px = Math.abs(x);
  let py = Math.abs(y);
  const m = 2 * Math.min(kx * px + ky * py, 0);
  px -= m * kx;
  py -= m * ky;
  px -= clamp(px, -kz * r, kz * r);
  py -= r;
  return Math.hypot(px, py) * Math.sign(py);
}

// n-pointed star; m in [2, n] sets how deep the points cut.
export function star(x, y, r, n, m) {
  const an = Math.PI / n;
  const en = Math.PI / m;
  const acx = Math.cos(an);
  const acy = Math.sin(an);
  const ecx = Math.cos(en);
  const ecy = Math.sin(en);
  const a = Math.atan2(x, -y);
  const bn = (((a % (2 * an)) + 2 * an) % (2 * an)) - an;
  const l = Math.hypot(x, y);
  let px = l * Math.cos(bn) - r * acx;
  let py = l * Math.abs(Math.sin(bn)) - r * acy;
  const t = clamp(-(px * ecx + py * ecy), 0, (r * acy) / ecy);
  px += ecx * t;
  py += ecy * t;
  return Math.hypot(px, py) * Math.sign(px);
}

// A lens pointed at top and bottom: half-height sqrt(r² - d²).
export function vesica(x, y, r, d) {
  const px = Math.abs(x);
  const py = Math.abs(y);
  const b = Math.sqrt(r * r - d * d);
  return (py - b) * d > px * b
    ? Math.hypot(px, py - b)
    : Math.hypot(px + d, py) - r;
}

// A cone from a circle r1 at the origin to r2 at (0, -h): a teardrop.
export function taper(x, y, r1, r2, h) {
  const px = Math.abs(x);
  const py = -y;
  const b = (r1 - r2) / h;
  const a = Math.sqrt(1 - b * b);
  const k = -b * px + a * py;
  if (k < 0) return Math.hypot(px, py) - r1;
  if (k > a * h) return Math.hypot(px, py - h) - r2;
  return px * a + py * b - r1;
}

export function segment(x, y, ax, ay, bx, by, r = 0) {
  const pax = x - ax;
  const pay = y - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const h = clamp((pax * bax + pay * bay) / (bax * bax + bay * bay), 0, 1);
  return Math.hypot(pax - bax * h, pay - bay * h) - r;
}

export function ring(d, width) {
  return Math.abs(d) - width;
}

export function rotate(x, y, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c * x - s * y, s * x + c * y];
}

// Folds the plane into one wedge of an n-fold mirror rosette; returns
// [radius, angle within the half-wedge, wedge index].
export function polarFold(x, y, n) {
  const r = Math.hypot(x, y);
  const sector = (Math.PI * 2) / n;
  const a = Math.atan2(x, -y) + sector / 2;
  const i = Math.floor(a / sector);
  const local = a - i * sector - sector / 2;
  return [r, Math.abs(local), ((i % n) + n) % n];
}

// Lobed polar edge: 1 at the lobe tips, `1 - depth` between them.
export function lobes(angle, n, depth, sharp = 0.5) {
  const t = Math.abs(Math.cos((angle * n) / 2));
  return 1 - depth + depth * t ** sharp;
}

export const smin = (a, b, k) => {
  const h = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1);
  return b * (1 - h) + a * h - k * h * (1 - h);
};
