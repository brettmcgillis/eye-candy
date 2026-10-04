/* eslint-disable no-loop-func, no-param-reassign */
import { FUSE, WELD } from './retract';

// The printability invariants, checked on buildTubes' output alone: no two
// tubes overlapping — an elliptical test, plan half-widths across and
// half-heights up, since tapered ends are narrower than they are tall (a
// tube may bend near itself, so samples within π·R along one chain in plan
// are exempt); every non-loop chain long enough to carry its caps; and how
// steeply any strand climbs (rise over run in plan). Strokes welded to
// strokes, and lanes fused into the outline stroke they stop against, are
// joints where 2D has them touch, not collisions. Grid units throughout.
export default function verifyTubes(
  tubes,
  { tolerance = tubes.pitch * 1e-3 } = {}
) {
  const points = [];
  let slope = 0;
  tubes.chains.forEach((chain, c) => {
    const n = chain.points.length / 3;
    let along = 0;
    for (let k = 0; k < n; k += 1) {
      const p = chain.points.subarray(k * 3, k * 3 + 3);
      if (k > 0) {
        const q = chain.points.subarray(k * 3 - 3, k * 3);
        const run = Math.hypot(p[0] - q[0], p[1] - q[1]);
        along += run;
        if (run > 1e-9) slope = Math.max(slope, Math.abs(p[2] - q[2]) / run);
      }
      points.push({
        along,
        c,
        h: chain.radius,
        w: chain.radii?.[k] ?? chain.radius,
        wire: chain.kind === 'wire',
        x: p[0],
        y: p[1],
        z: p[2],
        zone: chain.zone?.[k] ?? 0,
      });
    }
    const close = chain.loop && n > 1 ? chain.points : null;
    // eslint-disable-next-line no-param-reassign
    chain.length = close
      ? along +
        Math.hypot(
          close[0] - close[(n - 1) * 3],
          close[1] - close[(n - 1) * 3 + 1]
        )
      : along;
  });

  const reach = Math.max(tubes.radii.lane, tubes.radii.wire) * 2;
  // Plan neighbours only: a pair further apart in plan than both widths
  // cannot overlap at any height.
  const size = Math.max(reach, 1e-3);
  const buckets = new Map();
  const keyOf = (x, y) => `${Math.floor(x / size)}:${Math.floor(y / size)}`;
  points.forEach((p, i) => {
    const key = keyOf(p.x, p.y);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(i);
  });

  let violations = 0;
  let worst = 0;
  let example = null;
  points.forEach((p, i) => {
    const cx = Math.floor(p.x / size);
    const cy = Math.floor(p.y / size);
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        (buckets.get(`${cx + dx}:${cy + dy}`) ?? []).forEach((j) => {
          if (j <= i) return;
          const q = points[j];
          if ((p.wire && p.zone === WELD) || (q.wire && q.zone === WELD)) {
            return;
          }
          if (p.wire !== q.wire && (p.wire ? q : p).zone === FUSE) return;
          if (p.c === q.c) {
            const chain = tubes.chains[p.c];
            let d = Math.abs(p.along - q.along);
            if (chain.loop) d = Math.min(d, chain.length - d);
            if (d < Math.PI * p.h * 1.001) return;
          }
          const across = p.w + q.w;
          const up = p.h + q.h;
          const reachOf = Math.sqrt(
            (Math.hypot(p.x - q.x, p.y - q.y) / across) ** 2 +
              ((p.z - q.z) / up) ** 2
          );
          const gap = (reachOf - 1) * across;
          if (gap < -tolerance) {
            violations += 1;
            if (-gap > worst) {
              worst = -gap;
              example = [p, q];
            }
          }
        });
      }
    }
  });

  const unterminated = tubes.chains.filter(
    (chain) => chain.kind !== 'bead' && chain.points.length < 6
  ).length;

  return {
    example,
    maxSlope: slope,
    unterminated,
    violations,
    worst: worst / tubes.pitch,
  };
}
