/* eslint-disable no-bitwise */
import { fs } from './hash';

const f = Math.fround;
const CUT_WEIGHTS = [
  [1.26, 2.72],
  [1.78, 0.47],
  [0.78, 2.25],
];

const leafOf = (id) => ({
  hole: false,
  id,
  rolls: [fs(id), fs(id + 1), fs(id + 2), fs(id + 3)],
});

// Shadertoy 7sKGRy's per-point split loop, walked as the tree it implies:
// every point of a box agrees on the cut, so the eight sides are its children.
// A cut clamped past a thin box's far wall is pulled back inside it, where the
// shader would have let the box grow past its parent.
export default function buildRectSubdiv(config, half) {
  const {
    rectBreakChance: breakChance,
    rectMaxIters: iters,
    rectMinIters: minIters,
    rectMinSize: minSize,
    rectSeed: seed,
  } = config;
  let leaves = 0;

  function walk(lo, hi, id, i) {
    const cut = CUT_WEIGHTS.map(([a, b], axis) => {
      const hash = fs(f(f(f(i + id) * f(a)) + f(f(seed) * f(b))));
      const raw = hash * (hi[axis] - lo[axis]) + lo[axis];
      const kept = Math.min(
        Math.max(raw, lo[axis] + minSize),
        hi[axis] - minSize
      );
      return Math.min(Math.max(kept, lo[axis]), hi[axis]);
    });
    const thinnest = Math.min(
      ...cut.map((c, a) => Math.min(Math.abs(lo[a] - c), Math.abs(hi[a] - c)))
    );
    const late = i - 1 > minIters;
    if (
      (late && fs(id) < breakChance) ||
      (late && thinnest <= minSize) ||
      i >= iters - 1
    ) {
      leaves += 1;
      return { leaf: leafOf(id) };
    }

    const children = Array.from({ length: 8 }, (_, octant) => {
      const childLo = [];
      const childHi = [];
      const offset = [];
      for (let a = 0; a < 3; a += 1) {
        const upper = (octant >> a) & 1;
        childLo[a] = upper ? cut[a] : lo[a];
        childHi[a] = upper ? hi[a] : cut[a];
        offset[a] = f((upper ? -cut[a] : cut[a]) + 10);
      }
      return walk(childLo, childHi, f(Math.hypot(...offset)), i + 1);
    });

    return {
      children,
      u: cut.map((c, a) => (hi[a] > lo[a] ? (c - lo[a]) / (hi[a] - lo[a]) : 0)),
    };
  }

  const root = walk(
    half.map((h) => -h),
    half,
    0,
    0
  );
  return { leaves, root };
}
