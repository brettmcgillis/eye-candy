// Hair lies back along his body and a little down: the rabbit faces +X.
const FLOW = [-0.88, -0.48, 0];
const JITTER = 0.4;
const CURL = 0.35;
const LIFT = 0.0006;
const BALD = 0.2;

/* eslint-disable no-bitwise */
function rngFor(seed) {
  let s = (Math.imul(seed + 1, 2654435761) ^ 0x9e3779b9) >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* eslint-enable no-bitwise */

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const along = (p, d, s) => [p[0] + d[0] * s, p[1] + d[1] * s, p[2] + d[2] * s];
const unit = (v) => {
  const l = Math.hypot(...v) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};
const pointOf = (world, i) => [
  world[i * 3],
  world[i * 3 + 1],
  world[i * 3 + 2],
];

// Seeded hair strokes on the faces of a welded mesh that look toward the
// eye: `density` per square centimetre, each `length` metres long, combed
// along FLOW over the surface with a slight curl. `keep(point)` may thin
// them (by the render's tone); a face's strokes depend on its index only,
// so a stroke stays put while its neighbours come and go. A mesh's `bald`
// (per vertex, 0..1) keeps strokes off the eyes and teeth.
export default function furStrokes(
  mesh,
  { density, facing, keep = null, length }
) {
  const { bald, tris, world } = mesh;
  const strokes = [];
  for (let t = 0; t < tris.length; t += 3) {
    if (facing[t / 3] > 0) {
      const a = pointOf(world, tris[t]);
      const b = pointOf(world, tris[t + 1]);
      const c = pointOf(world, tris[t + 2]);
      const n2 = cross(sub(b, a), sub(c, a));
      const area = Math.hypot(...n2) / 2;
      const rng = rngFor(t / 3);
      const expected = area * 1e4 * density;
      let count = Math.floor(expected);
      if (rng() < expected - count) count += 1;
      if (count > 0) {
        const n = unit(n2);
        const flat = sub(FLOW, along([0, 0, 0], n, dot(FLOW, n)));
        const comb =
          Math.hypot(...flat) > 0.2 ? unit(flat) : unit(cross(n, [0, 1, 0]));
        for (let k = 0; k < count; k += 1) {
          let u = rng();
          let v = rng();
          if (u + v > 1) {
            u = 1 - u;
            v = 1 - v;
          }
          const onBald = bald
            ? bald[tris[t]] * (1 - u - v) +
              bald[tris[t + 1]] * u +
              bald[tris[t + 2]] * v
            : 0;
          const root = along(
            [
              a[0] + (b[0] - a[0]) * u + (c[0] - a[0]) * v,
              a[1] + (b[1] - a[1]) * u + (c[1] - a[1]) * v,
              a[2] + (b[2] - a[2]) * u + (c[2] - a[2]) * v,
            ],
            n,
            LIFT
          );
          const turn = (rng() * 2 - 1) * JITTER;
          const side = cross(n, comb);
          const d = unit(
            [0, 1, 2].map(
              (i) => comb[i] * Math.cos(turn) + side[i] * Math.sin(turn)
            )
          );
          const bendDir = unit(along(d, side, (rng() * 2 - 1) * CURL));
          const size = length * (0.7 + rng() * 0.6);
          const mid = along(root, d, size * 0.5);
          const tip = along(along(mid, bendDir, size * 0.5), n, size * 0.08);
          if (onBald < BALD && (!keep || keep(root, rng())))
            strokes.push([root, mid, tip]);
        }
      }
    }
  }
  return strokes;
}
