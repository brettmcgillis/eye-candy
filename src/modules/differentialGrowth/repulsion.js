/* eslint-disable no-continue, no-param-reassign */
import createDenseGrid from './denseGrid';

// Ports of applySpatialRepulsion and applyPointSegmentRepulsion from
// 260316_DifferentialLayers, in 3D. Forces and radii are the reference's.
// Every curve is flattened into one index space with prev/next links, and
// neighbours come from a dense grid rebuilt each step, so the hot loop touches
// only typed arrays.
//
// A segment within `radius` of a point has its nearer endpoint within
// `radius + length / 2`, so segments are tested from whichever endpoint of
// theirs is nearer, and each is found once.

export default function applyRepulsion(engine, delta, dt) {
  const { curves, settings } = engine;
  if (settings.repulsion <= 0) return;
  const edge = settings.targetEdgeLength * settings.splitThreshold;
  const pointRadius = edge * 1.35;
  const segmentRadius = edge * 1.25;
  if (pointRadius <= 1e-6) return;
  const reach = Math.max(pointRadius, segmentRadius + edge * 0.5);

  const total = curves.reduce((n, c) => n + c.points.length, 0);
  const xyz = new Float64Array(total * 3);
  const prev = new Int32Array(total);
  const next = new Int32Array(total);
  let base = 0;
  curves.forEach((curve) => {
    const count = curve.points.length;
    curve.points.forEach((p, i) => {
      const k = base + i;
      xyz[k * 3] = p.x;
      xyz[k * 3 + 1] = p.y;
      xyz[k * 3 + 2] = p.z;
      const first = curve.closed ? base + count - 1 : -1;
      const last = curve.closed ? base : -1;
      prev[k] = i > 0 ? k - 1 : first;
      next[k] = i < count - 1 ? k + 1 : last;
    });
    base += count;
  });

  const grid = createDenseGrid(xyz, total, reach / 2);
  const { inv, items, minX, minY, minZ, nx, ny, nz, start } = grid;
  const force = new Float64Array(total * 3);
  const pointStrength = settings.repulsion * dt * 0.03;
  const segmentStrength = settings.repulsion * dt * 0.055;
  const pr2 = pointRadius * pointRadius;
  const sr2 = segmentRadius * segmentRadius;
  const reach2 = reach * reach;

  const segment = (k, a, b, px, py, pz) => {
    if (a === k || b === k) return;
    if (a === prev[k] || a === next[k] || b === prev[k] || b === next[k])
      return;
    const ax = xyz[a * 3];
    const ay = xyz[a * 3 + 1];
    const az = xyz[a * 3 + 2];
    const vx = xyz[b * 3] - ax;
    const vy = xyz[b * 3 + 1] - ay;
    const vz = xyz[b * 3 + 2] - az;
    const lenSq = vx * vx + vy * vy + vz * vz;
    if (lenSq <= 1e-12) return;
    let t = ((px - ax) * vx + (py - ay) * vy + (pz - az) * vz) / lenSq;
    t = Math.min(Math.max(t, 0), 1);
    const dx = px - (ax + vx * t);
    const dy = py - (ay + vy * t);
    const dz = pz - (az + vz * t);
    const distSq = dx * dx + dy * dy + dz * dz;
    if (distSq <= 1e-12 || distSq >= sr2) return;
    const d = Math.sqrt(distSq);
    const f = (segmentStrength * (1 - d / segmentRadius)) / (distSq + 1e-6) / d;
    force[k * 3] += dx * f;
    force[k * 3 + 1] += dy * f;
    force[k * 3 + 2] += dz * f;
    force[a * 3] -= dx * f * (1 - t);
    force[a * 3 + 1] -= dy * f * (1 - t);
    force[a * 3 + 2] -= dz * f * (1 - t);
    force[b * 3] -= dx * f * t;
    force[b * 3 + 1] -= dy * f * t;
    force[b * 3 + 2] -= dz * f * t;
  };

  const gapSq = (i, px, py, pz) => {
    const dx = px - xyz[i * 3];
    const dy = py - xyz[i * 3 + 1];
    const dz = pz - xyz[i * 3 + 2];
    return dx * dx + dy * dy + dz * dz;
  };

  for (let k = 0; k < total; k += 1) {
    const px = xyz[k * 3];
    const py = xyz[k * 3 + 1];
    const pz = xyz[k * 3 + 2];
    const cx = Math.floor((px - minX) * inv);
    const cy = Math.floor((py - minY) * inv);
    const cz = Math.floor((pz - minZ) * inv);
    for (let z = Math.max(cz - 2, 0); z <= Math.min(cz + 2, nz - 1); z += 1) {
      for (let y = Math.max(cy - 2, 0); y <= Math.min(cy + 2, ny - 1); y += 1) {
        for (
          let x = Math.max(cx - 2, 0);
          x <= Math.min(cx + 2, nx - 1);
          x += 1
        ) {
          const cell = x + y * nx + z * nx * ny;
          for (let s = start[cell]; s < start[cell + 1]; s += 1) {
            const j = items[s];
            if (j === k) continue;
            const d2 = gapSq(j, px, py, pz);
            if (d2 > reach2) continue;

            if (
              j > k &&
              d2 < pr2 &&
              d2 > 1e-12 &&
              j !== prev[k] &&
              j !== next[k]
            ) {
              const d = Math.sqrt(d2);
              const f =
                (pointStrength * (1 - d / pointRadius)) / (d2 + 1e-6) / d;
              const fx = (px - xyz[j * 3]) * f;
              const fy = (py - xyz[j * 3 + 1]) * f;
              const fz = (pz - xyz[j * 3 + 2]) * f;
              force[k * 3] += fx;
              force[k * 3 + 1] += fy;
              force[k * 3 + 2] += fz;
              force[j * 3] -= fx;
              force[j * 3 + 1] -= fy;
              force[j * 3 + 2] -= fz;
            }

            const nj = next[j];
            if (nj >= 0 && d2 <= gapSq(nj, px, py, pz))
              segment(k, j, nj, px, py, pz);
            const pj = prev[j];
            if (pj >= 0 && d2 < gapSq(pj, px, py, pz))
              segment(k, pj, j, px, py, pz);
          }
        }
      }
    }
  }

  base = 0;
  curves.forEach((curve, c) => {
    const d = delta[c];
    for (let i = 0; i < curve.points.length * 3; i += 1) {
      d[i] += force[base * 3 + i];
    }
    base += curve.points.length;
  });
}
