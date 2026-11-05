/* eslint-disable no-bitwise */
const GOLDEN = Math.PI * (3 - Math.sqrt(5));

export function resample(points, spacing) {
  const out = [points[0], points[1], points[2]];
  let carry = 0;
  for (let i = 3; i < points.length; i += 3) {
    const ax = points[i - 3];
    const ay = points[i - 2];
    const az = points[i - 1];
    const dx = points[i] - ax;
    const dy = points[i + 1] - ay;
    const dz = points[i + 2] - az;
    const length = Math.hypot(dx, dy, dz);
    let at = spacing - carry;
    while (at <= length) {
      const t = at / length;
      out.push(ax + dx * t, ay + dy * t, az + dz * t);
      at += spacing;
    }
    carry = length - (at - spacing);
  }
  const n = points.length;
  if (carry > spacing * 0.25)
    out.push(points[n - 3], points[n - 2], points[n - 1]);
  return out;
}

export function pathLength(points) {
  let length = 0;
  for (let i = 3; i < points.length; i += 3)
    length += Math.hypot(
      points[i] - points[i - 3],
      points[i + 1] - points[i - 2],
      points[i + 2] - points[i - 1]
    );
  return length;
}

// Where cable i of n comes up through the hole: a sunflower over the disc,
// turned so each cable rises on the side it leaves toward.
function emergence(i, n, radius, leave) {
  const rho = radius * Math.sqrt((((i * 0.618034) % 1) + 0.5 / n) * 0.92);
  const angle = leave + i * GOLDEN * 0.15;
  return [Math.cos(angle) * rho, Math.sin(angle) * rho];
}

// A strand in turtle units → a cable route in metres that rises out of the
// hole, then follows the strand from the hole's rim outward.
function holeRoute(strand, index, count, { hole, holeDepth, unit, spacing }) {
  const scaled = strand.map((v) => v * unit);
  let first = 0;
  while (
    first * 3 + 3 < scaled.length &&
    Math.hypot(scaled[first * 3], scaled[first * 3 + 2]) < hole * 1.15
  )
    first += 1;
  const rest = scaled.slice(first * 3);
  const leave = Math.atan2(rest[2], rest[0]);
  const [ex, ez] = emergence(index, count, hole, leave);
  const rise = [
    ex,
    -holeDepth,
    ez,
    ex,
    -holeDepth * 0.5,
    ez,
    ex,
    Math.max(rest[1], 0),
    ez,
  ];
  return { anchored: 2, points: resample([...rise, ...rest], spacing) };
}

// Cables are laid in `order`. Where a cable meets earlier ones it slides
// sideways toward the lower ground, at most `drift` of a step each step, so
// a bundle of streamlines becomes a wide run instead of a tower; `pull`
// (height per metre off the route) holds it to its line. It then sits on
// what is under it and drapes so no pile is climbed steeper than `grade`.
const STEER = 0.15;

function stack(routes, order, { drift, grade, pull, radius, spacing }) {
  const cell = radius * 2;
  const heights = new Map();
  const keyOf = (x, z) =>
    Math.floor(x / cell) * 73856093 + Math.floor(z / cell);
  const at = (x, z) => {
    let top = 0;
    for (let dx = -1; dx <= 1; dx += 1)
      for (let dz = -1; dz <= 1; dz += 1)
        top = Math.max(
          top,
          heights.get(keyOf(x + dx * cell, z + dz * cell)) ?? 0
        );
    return top;
  };
  order.forEach((id) => {
    const { anchored, points } = routes[id];
    const n = points.length / 3;
    let start = anchored;
    while (start < n && points[start * 3 + 1] < -1e-9) start += 1;
    const lift = new Float64Array(n);
    let offset = 0;
    let velocity = 0;
    const step = spacing * drift;
    const offsets = new Float64Array(n);
    const normals = new Float64Array(n * 2);
    for (let i = start; i < n; i += 1) {
      const a = Math.max(i - 1, start) * 3;
      const b = Math.min(i + 1, n - 1) * 3;
      const tx = points[b] - points[a];
      const tz = points[b + 2] - points[a + 2];
      const tl = Math.hypot(tx, tz) || 1;
      const nx = -tz / tl;
      const nz = tx / tl;
      const x = points[i * 3];
      const z = points[i * 3 + 2];
      const reach = cell * 3;
      const costAt = (o) => at(x + nx * o, z + nz * o) + pull * Math.abs(o);
      const center = costAt(offset);
      const left = costAt(offset - reach);
      const right = costAt(offset + reach);
      let desired = 0;
      if (left < center - 1e-9 && left <= right) desired = -1;
      else if (right < center - 1e-9) desired = 1;
      velocity += (desired - velocity) * STEER;
      offset += velocity * step;
      offsets[i] = offset;
      normals[i * 2] = nx;
      normals[i * 2 + 1] = nz;
    }
    for (let i = start; i < n; i += 1) {
      points[i * 3] += normals[i * 2] * offsets[i];
      points[i * 3 + 2] += normals[i * 2 + 1] * offsets[i];
    }
    for (let i = start; i < n; i += 1)
      lift[i] = at(points[i * 3], points[i * 3 + 2]) + radius;
    const drop = grade * spacing;
    for (let i = n - 2; i >= start; i -= 1)
      lift[i] = Math.max(lift[i], lift[i + 1] - drop);
    for (let i = start + 1; i < n; i += 1)
      lift[i] = Math.max(lift[i], lift[i - 1] - drop);
    for (let i = start; i < n; i += 1) {
      points[i * 3 + 1] = lift[i];
      const key = keyOf(points[i * 3], points[i * 3 + 2]);
      heights.set(key, Math.max(heights.get(key) ?? 0, lift[i] + radius));
    }
  });
}

// The tangle's analogue of the drop: cables are threaded in `order`, each
// point pushed off any earlier cable it would pass through, the push
// smoothed along the cable so it bends round rather than kinks.
function pack(routes, order, { drift, hole, radius, spacing }) {
  const cell = radius * 2;
  const reach = cell * 1.05;
  const buckets = new Map();
  const keyOf = (x, y, z) =>
    (Math.floor(x / cell) * 73856093) ^
    (Math.floor(y / cell) * 19349663) ^
    (Math.floor(z / cell) * 83492791);
  const step = spacing * drift;
  order.forEach((id) => {
    const { anchored, points } = routes[id];
    const n = points.length / 3;
    const offset = [0, 0, 0];
    const velocity = [0, 0, 0];
    for (let i = anchored; i < n; i += 1) {
      const o = i * 3;
      const a = Math.max(i - 1, 0) * 3;
      const b = Math.min(i + 1, n - 1) * 3;
      const t = [0, 1, 2].map((k) => points[b + k] - points[a + k]);
      const tl = Math.hypot(...t) || 1;
      const p = [0, 1, 2].map((k) => points[o + k] + offset[k]);
      const push = [0, 0, 0];
      for (let dx = -1; dx <= 1; dx += 1)
        for (let dy = -1; dy <= 1; dy += 1)
          for (let dz = -1; dz <= 1; dz += 1) {
            const list = buckets.get(
              keyOf(p[0] + dx * cell, p[1] + dy * cell, p[2] + dz * cell)
            );
            for (let j = 0; j < (list?.length ?? 0); j += 3) {
              const d = [
                p[0] - list[j],
                p[1] - list[j + 1],
                p[2] - list[j + 2],
              ];
              const length = Math.hypot(...d);
              if (length < reach && length > 1e-9)
                for (let k = 0; k < 3; k += 1)
                  push[k] += (d[k] / length) * (reach - length);
            }
          }
      const along = (push[0] * t[0] + push[1] * t[1] + push[2] * t[2]) / tl;
      const sideways = push.map((v, k) => v - (along * t[k]) / tl);
      const size = Math.hypot(...sideways);
      const scale = size > step ? step / size : 1;
      for (let k = 0; k < 3; k += 1) {
        velocity[k] += (sideways[k] * scale - velocity[k]) * STEER * 2;
        offset[k] += velocity[k];
      }
      for (let k = 0; k < 3; k += 1) points[o + k] += offset[k];
      if (Math.hypot(points[o], points[o + 2]) > hole)
        points[o + 1] = Math.max(points[o + 1], radius);
    }
    for (let i = 0; i < n; i += 1) {
      const key = keyOf(points[i * 3], points[i * 3 + 1], points[i * 3 + 2]);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets
        .get(key)
        .push(points[i * 3], points[i * 3 + 1], points[i * 3 + 2]);
    }
  });
}

export default function routeStrands(strands, options, rng) {
  const count = strands.length;
  const routes = strands.map((strand, index) =>
    holeRoute(strand, index, count, options)
  );
  const order = routes.map((_, i) => i);
  for (let i = count - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (options.layout === 'flat') stack(routes, order, options);
  else pack(routes, order, options);
  return routes;
}
