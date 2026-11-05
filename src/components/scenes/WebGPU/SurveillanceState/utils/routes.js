import { TV_BOX } from './rig';

const lerp = (a, b, t) => a + (b - a) * t;

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return p1.map(
    (_, i) =>
      0.5 *
      (2 * p1[i] +
        (-p0[i] + p2[i]) * t +
        (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 +
        (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3)
  );
}

function smooth(points, steps = 8) {
  if (points.length < 3) return points;
  const out = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(i - 1, 0)];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    for (let s = 0; s < steps; s += 1)
      out.push(catmull(p0, points[i], points[i + 1], p3, s / steps));
  }
  out.push(points[points.length - 1]);
  return out;
}

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

export function resample(points, spacing) {
  const lengths = [0];
  for (let i = 1; i < points.length; i += 1)
    lengths.push(lengths[i - 1] + distance(points[i - 1], points[i]));
  const total = lengths[lengths.length - 1];
  const count = Math.max(4, Math.ceil(total / spacing) + 1);
  const out = new Float64Array(count * 3);
  let seg = 1;
  for (let n = 0; n < count; n += 1) {
    const target = (n / (count - 1)) * total;
    while (seg < points.length - 1 && lengths[seg] < target) seg += 1;
    const span = lengths[seg] - lengths[seg - 1] || 1;
    const t = Math.min(Math.max((target - lengths[seg - 1]) / span, 0), 1);
    for (let a = 0; a < 3; a += 1)
      out[n * 3 + a] = lerp(points[seg - 1][a], points[seg][a], t);
  }
  return { points: out, length: total, count };
}

function coil(rng, centre, y, radius) {
  const turns = 1 + Math.floor(rng() * 2);
  const start = rng() * Math.PI * 2;
  const dir = rng() < 0.5 ? -1 : 1;
  const steps = turns * 10;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const angle = start + (dir * i * Math.PI * 2) / 10;
    return [
      centre[0] + Math.cos(angle) * radius,
      y + (i / steps) * 0.03 * turns,
      centre[2] + Math.sin(angle) * radius,
    ];
  });
}

function wander(rng, from, to, y, { lateral, coilChance }) {
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  const span = Math.hypot(dx, dz) || 1;
  const nx = -dz / span;
  const nz = dx / span;
  const stops = 1 + Math.floor(rng() * Math.min(3, span / 0.4 + 1));
  const out = [];
  for (let i = 1; i <= stops; i += 1) {
    const t = i / (stops + 1);
    const offset = (rng() - 0.5) * 2 * lateral * Math.min(1, span);
    const point = [
      from[0] + dx * t + nx * offset,
      y,
      from[2] + dz * t + nz * offset,
    ];
    if (rng() < coilChance)
      out.push(...coil(rng, point, y, 0.05 + rng() * 0.11));
    else out.push(point);
  }
  return out;
}

const SIDE_CLEARANCE = TV_BOX.max[0] + 0.14;
const BEHIND_Z = -0.15;

function aroundTv(rng, from, to, y) {
  const fromFront = from[2] > BEHIND_Z;
  const toFront = to[2] > BEHIND_Z;
  if (fromFront === toFront) return [];
  const sideHint = (from[0] + to[0]) * 0.5;
  const side = Math.abs(sideHint) > 0.1 ? Math.sign(sideHint) : rng() - 0.5;
  const x = Math.sign(side) * (SIDE_CLEARANCE + rng() * 0.18);
  const front = [x, y, TV_BOX.max[2] + 0.05 + rng() * 0.2];
  const back = [x, y, TV_BOX.min[2] - 0.08 - rng() * 0.2];
  return fromFront ? [front, back] : [back, front];
}

export function routeBetween(rng, head, tail, y, options) {
  const start = head[head.length - 1];
  const end = tail[0];
  const startFloor = [start[0], y, start[2]];
  const endFloor = [end[0], y, end[2]];
  const detour = aroundTv(rng, startFloor, endFloor, y);
  const stops = [startFloor, ...detour, endFloor];
  const path = [...head];
  for (let i = 0; i < stops.length - 1; i += 1) {
    path.push(stops[i], ...wander(rng, stops[i], stops[i + 1], y, options));
  }
  path.push(endFloor, ...tail);
  return smooth(path);
}
