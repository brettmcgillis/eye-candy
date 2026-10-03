export const DEG = Math.PI / 180;
export const TAU = Math.PI * 2;
export const PHI = (1 + Math.sqrt(5)) / 2;

export const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
export const lerp = (a, b, t) => a + (b - a) * t;
export const fract = (x) => x - Math.floor(x);
export const mod = (x, y) => x - y * Math.floor(x / y);
export const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale3 = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
export const cross3 = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const normalize3 = (a) => scale3(a, 1 / (len3(a) || 1));

// Turns (a, b) by `angle` in their plane.
export const rot2 = (a, b, angle) => {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return [c * a - s * b, s * a + c * b];
};

// Unit vector at `azimuth` round from +x toward +z and `elevation` up, both
// in degrees.
export function directionOf(azimuth, elevation) {
  const a = azimuth * DEG;
  const e = elevation * DEG;
  return [Math.cos(e) * Math.cos(a), Math.sin(e), Math.cos(e) * Math.sin(a)];
}

// Row-major 3×3: spin about y, then tilt about x.
export function objectRotation(tilt, spin) {
  const [ct, st] = [Math.cos(tilt * DEG), Math.sin(tilt * DEG)];
  const [cs, ss] = [Math.cos(spin * DEG), Math.sin(spin * DEG)];
  return [cs, 0, ss, st * ss, ct, -st * cs, -ct * ss, st, ct * cs];
}

export const applyMat3 = (m, v) => [
  m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
  m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
  m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
];
