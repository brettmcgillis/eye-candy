export function length(x, y, z) {
  return Math.sqrt(x * x + y * y + z * z);
}

export function normalize(v) {
  const l = length(v[0], v[1], v[2]) || 1;

  return [v[0] / l, v[1] / l, v[2] / l];
}

export function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

export function randomUnit(rng) {
  const z = rng.signed();
  const t = rng() * Math.PI * 2;
  const r = Math.sqrt(1 - z * z);

  return [r * Math.cos(t), r * Math.sin(t), z];
}

export function perpendicular(dir) {
  const helper = Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];

  return normalize(cross(dir, helper));
}

export function coneDirection(dir, angle, rng) {
  const u = perpendicular(dir);
  const v = cross(dir, u);
  const spin = rng() * Math.PI * 2;
  const s = Math.sin(angle);
  const c = Math.cos(angle);
  const cu = Math.cos(spin) * s;
  const cv = Math.sin(spin) * s;

  return normalize([
    dir[0] * c + u[0] * cu + v[0] * cv,
    dir[1] * c + u[1] * cu + v[1] * cv,
    dir[2] * c + u[2] * cu + v[2] * cv,
  ]);
}

export function blend(a, b, t) {
  return normalize([
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]);
}
