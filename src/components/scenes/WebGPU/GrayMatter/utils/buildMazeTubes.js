import { createMinHeap, createSpatialHash } from '@modules/gpuTubes';

import traceMaze from './traceMaze';

function resample(raw, P) {
  const lengths = [0];
  for (let i = 1; i < raw.length; i += 1) {
    const a = raw[i - 1];
    const b = raw[i];
    lengths.push(
      lengths[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
    );
  }
  const total = lengths[lengths.length - 1];
  const out = [];
  let j = 1;
  for (let i = 0; i < P; i += 1) {
    const target = (i / (P - 1)) * total;
    while (j < raw.length - 1 && lengths[j] < target) j += 1;
    const span = lengths[j] - lengths[j - 1] || 1;
    const t = Math.min(Math.max((target - lengths[j - 1]) / span, 0), 1);
    const from = raw[j - 1];
    out.push(raw[j].map((c, k) => from[k] + (c - from[k]) * t));
  }
  return out;
}

function smooth(raw) {
  return raw.map((p, i) => {
    if (i === 0 || i === raw.length - 1) return p;
    return p.map((c, k) => (raw[i - 1][k] + c * 2 + raw[i + 1][k]) / 4);
  });
}

// When the colony reaches each point: shortest distance from the origin along
// the tubes themselves, hopping between worms only where they come within
// `jump` of each other. A tube therefore only ever starts where an existing one
// touches it, and grows both ways from there.
function arrivalTimes(points, count, P, origin, jump) {
  const n = count * P;
  const xyz = new Float32Array(n * 3);
  for (let i = 0; i < n; i += 1)
    xyz.set(points.subarray(i * 4, i * 4 + 3), i * 3);
  const hash = createSpatialHash(xyz, jump);
  const arrival = new Float64Array(n).fill(Infinity);
  const heap = createMinHeap(n);
  const top = [0, 0];
  const relax = (d, j) => {
    if (d < arrival[j]) {
      arrival[j] = d;
      heap.push(d, j);
    }
  };
  const gap = (i, j) =>
    Math.hypot(
      xyz[i * 3] - xyz[j * 3],
      xyz[i * 3 + 1] - xyz[j * 3 + 1],
      xyz[i * 3 + 2] - xyz[j * 3 + 2]
    );

  relax(0, origin);
  while (heap.size) {
    const [d, i] = heap.pop(top);
    if (d <= arrival[i]) {
      const worm = Math.floor(i / P);
      const k = i % P;
      if (k > 0) relax(d + gap(i, i - 1), i - 1);
      if (k < P - 1) relax(d + gap(i, i + 1), i + 1);
      // Points sit far closer than `jump`, so querying every fourth still
      // finds every contact.
      if (k % 4 === 0)
        hash.forEachNear(
          xyz[i * 3],
          xyz[i * 3 + 1],
          xyz[i * 3 + 2],
          jump,
          (j, g) => {
            if (Math.floor(j / P) !== worm) relax(d + g, j);
          }
        );
    }
  }
  return arrival;
}

// Traced worms → fixed-stride tube buffers: `points` xyz + arrival distance,
// `normals` the surface normal (the tube frame's up axis).
export default function buildMazeTubes({
  claimRadius,
  floor,
  jump,
  lift,
  pointsPerStrand: P,
  strength,
  surface,
}) {
  const { graph, reach } = surface;
  const { normals, positions } = graph;
  const worms = traceMaze({ claimRadius, floor, graph, strength });
  const count = worms.length;
  const points = new Float32Array(count * P * 4);
  const pointNormals = new Float32Array(count * P * 4);
  let origin = 0;
  let lowest = Infinity;

  worms.forEach((path, w) => {
    const raw = path.map((v) => [
      positions[v * 3] + normals[v * 3] * lift,
      positions[v * 3 + 1] + normals[v * 3 + 1] * lift,
      positions[v * 3 + 2] + normals[v * 3 + 2] * lift,
      normals[v * 3],
      normals[v * 3 + 1],
      normals[v * 3 + 2],
    ]);
    resample(smooth(raw), P).forEach((p, i) => {
      points.set([p[0], p[1], p[2], 0], (w * P + i) * 4);
      const nl = Math.hypot(p[3], p[4], p[5]) || 1;
      pointNormals.set([p[3] / nl, p[4] / nl, p[5] / nl, 0], (w * P + i) * 4);
    });
    const r = reach[path[0]];
    if (Number.isFinite(r) && r < lowest) {
      lowest = r;
      origin = w * P;
    }
  });

  const arrival = count ? arrivalTimes(points, count, P, origin, jump) : [];
  let maxArrival = 0;
  arrival.forEach((d) => {
    if (Number.isFinite(d)) maxArrival = Math.max(maxArrival, d);
  });
  arrival.forEach((d, i) => {
    points[i * 4 + 3] = Number.isFinite(d) ? d : 1e9;
  });

  return { count, maxArrival, normals: pointNormals, points };
}
