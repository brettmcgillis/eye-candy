export const DEG = Math.PI / 180;

export const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
export const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const cross3 = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const normalize3 = (a) => scale3(a, 1 / (len3(a) || 1));

export const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// GLSL's fract and mod: floor-based, so negatives wrap the way the shaders do.
export const fract = (x) => x - Math.floor(x);
export const mod = (x, y) => x - y * Math.floor(x / y);

// Degrees round +y from +x toward +z, then up toward +y.
export function directionOf(azimuth, elevation) {
  const a = azimuth * DEG;
  const e = elevation * DEG;
  return [Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)];
}

// The object's orientation: tilt about x, then spin about y. Row-major 3x3.
export function objectRotation(tilt, spin) {
  const ct = Math.cos(tilt * DEG);
  const st = Math.sin(tilt * DEG);
  const cs = Math.cos(spin * DEG);
  const ss = Math.sin(spin * DEG);
  return [cs, ss * st, ss * ct, 0, ct, -st, -ss, cs * st, cs * ct];
}

export const applyMat3 = (m, v) => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];

export const applyMat3T = (m, v) => [
  m[0] * v[0] + m[3] * v[1] + m[6] * v[2],
  m[1] * v[0] + m[4] * v[1] + m[7] * v[2],
  m[2] * v[0] + m[5] * v[1] + m[8] * v[2],
];

// An orthonormal frame for a plane with normal n; `spin` turns u and v in
// the plane, so a slice can be framed at any angle.
export function planeBasis(n, spin = 0) {
  const helper = Math.abs(n[1]) > 0.99 ? [0, 0, 1] : [0, 1, 0];
  const u0 = normalize3(cross3(helper, n));
  const v0 = cross3(n, u0);
  const c = Math.cos(spin * DEG);
  const s = Math.sin(spin * DEG);
  return {
    u: add3(scale3(u0, c), scale3(v0, s)),
    v: add3(scale3(u0, -s), scale3(v0, c)),
  };
}
