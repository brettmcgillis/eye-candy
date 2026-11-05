// A part is one instance of a unit primitive the rig draws: centre `p`,
// orientation quaternion `q`, half extents `s` (cylinders run along z), and a
// look (`c` linear albedo, `r` roughness, `m` metalness, `e` linear emission
// or null). The panel faces +z and its plates' faces sit at z = 0.
export const GEOMETRIES = [
  'box',
  'rbox',
  'cyl',
  'knurl',
  'cap',
  'sphere',
  'torus',
  'dish',
  'bullet',
  'face',
  'lens',
  'glow',
];

// The cap is a frustum whose top radius is this share of its base (a skirted
// knob, a toggle bat). A torus's half extents are [radius, radius, tube].
export const CAP_TOP = 0.78;

// A rounded box's corners curve by this much in the panel's own units, so a
// large base stays a rectangle rather than turning into an oval; a small
// part rounds by at most this share of its shorter side.
export const RBOX_RADIUS = 0.06;
export const RBOX_SHARE = 0.35;
// A part's look may set its own bevel `b` (a module plate's tight edge).
export const rboxRadius = (s, bevel = 0) =>
  bevel > 0 ? bevel : Math.min(RBOX_RADIUS, RBOX_SHARE * Math.min(s[0], s[1]));

// A dish is an open speaker cone: full radius at its top rim, this share
// of it where it meets the dust cap at its base.
export const DISH_INNER = 0.24;

// Two see-through primitives: a lens is a shallow glass dome (over a
// gauge), a glow a soft disc of light laid on a surface; neither casts a
// shadow or plots.
export const SEE_THROUGH = new Set(['lens', 'glow']);

// A tube face: a cushion dome over a squircle (|x|^n + |y|^n = 1, n =
// FACE_ROUND), so it fills a rounded-rectangle screen at any aspect. Its
// height at squircle radius ρ runs from 0 at the rim to 1 at the centre.
export const FACE_ROUND = 6;
export const faceRadius = (x, y) =>
  (Math.abs(x) ** FACE_ROUND + Math.abs(y) ** FACE_ROUND) ** (1 / FACE_ROUND);
export const faceHeight = (rho) => Math.sqrt(Math.max(0, 1 - rho ** 4));
export function faceRim(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const k =
    (Math.abs(c) ** FACE_ROUND + Math.abs(s) ** FACE_ROUND) **
    (-1 / FACE_ROUND);
  return [c * k, s * k];
}

export const BULLET_PROFILE = [
  [1, -1],
  [1, -0.25],
  [0.85, 0.3],
  [0.45, 0.8],
  [0, 1],
];

export const IDENTITY = [0, 0, 0, 1];
export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

export const quatZ = (a) => [0, 0, Math.sin(a / 2), Math.cos(a / 2)];
export const quatX = (a) => [Math.sin(a / 2), 0, 0, Math.cos(a / 2)];
export const quatY = (a) => [0, Math.sin(a / 2), 0, Math.cos(a / 2)];

export function quatMul(a, b) {
  return [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
}

// The turn taking +z onto unit direction `d` (a cylinder laid along it).
export function quatTo(d) {
  if (d[2] < -0.9999) return [1, 0, 0, 0];
  const q = [-d[1], d[0], 0, 1 + d[2]];
  const length = Math.hypot(...q);
  return q.map((v) => v / length);
}

export function rotate(q, v) {
  const [x, y, z, w] = q;
  const tx = 2 * (y * v[2] - z * v[1]);
  const ty = 2 * (z * v[0] - x * v[2]);
  const tz = 2 * (x * v[1] - y * v[0]);
  return [
    v[0] + w * tx + (y * tz - z * ty),
    v[1] + w * ty + (z * tx - x * tz),
    v[2] + w * tz + (x * ty - y * tx),
  ];
}

export const rot2 = (x, y, a) => [
  x * Math.cos(a) - y * Math.sin(a),
  x * Math.sin(a) + y * Math.cos(a),
];

export function part(g, p, s, look, q = IDENTITY) {
  return {
    c: look.c,
    e: look.e ?? null,
    g,
    m: look.m,
    p,
    q,
    r: look.r,
    s,
    b: look.b ?? 0,
    w: look.w ?? 0,
  };
}

// A part moved by a transform: scale about the origin, rotate, then offset.
export function placePart(item, { offset = [0, 0, 0], q = null, scale = 1 }) {
  const local = scale === 1 ? item.p : item.p.map((v) => v * scale);
  const p = q ? rotate(q, local) : local;
  return {
    ...item,
    p: [p[0] + offset[0], p[1] + offset[1], p[2] + offset[2]],
    q: q ? quatMul(q, item.q) : item.q,
    s: scale === 1 ? item.s : item.s.map((v) => v * scale),
  };
}

export const placeAll = (items, transform) =>
  items.map((item) => placePart(item, transform));

// A rigid move of parts already in place: turned by `q` about `pivot`, then
// carried by `offset`.
export function moveAll(items, { offset = [0, 0, 0], pivot = null, q = null }) {
  if (!q) {
    return items.map((item) => ({
      ...item,
      p: [item.p[0] + offset[0], item.p[1] + offset[1], item.p[2] + offset[2]],
    }));
  }
  const [px, py, pz] = pivot ?? [0, 0, 0];
  return items.map((item) => {
    const p = rotate(q, [item.p[0] - px, item.p[1] - py, item.p[2] - pz]);
    return {
      ...item,
      p: [p[0] + px + offset[0], p[1] + py + offset[1], p[2] + pz + offset[2]],
      q: quatMul(q, item.q),
    };
  });
}

export function placeBounds(box, { offset, q, scale }) {
  const points = [];
  [box.min[0], box.max[0]].forEach((x) =>
    [box.min[1], box.max[1]].forEach((y) =>
      [box.min[2], box.max[2]].forEach((z) => {
        const local = [x * scale, y * scale, z * scale];
        const point = q ? rotate(q, local) : local;
        points.push(point.map((v, axis) => v + offset[axis]));
      })
    )
  );
  return {
    min: [0, 1, 2].map((axis) => Math.min(...points.map((p) => p[axis]))),
    max: [0, 1, 2].map((axis) => Math.max(...points.map((p) => p[axis]))),
  };
}

export function partBounds(item) {
  const basis = item.s.map((size, axis) =>
    rotate(
      item.q,
      [0, 1, 2].map((i) => (i === axis ? size : 0))
    )
  );
  const extent = [0, 1, 2].map((axis) =>
    basis.reduce((sum, vector) => sum + Math.abs(vector[axis]), 0)
  );
  return {
    min: item.p.map((v, axis) => v - extent[axis]),
    max: item.p.map((v, axis) => v + extent[axis]),
  };
}
