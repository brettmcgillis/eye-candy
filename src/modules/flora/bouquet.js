/* eslint-disable no-param-reassign */
import { createRng } from './rng';

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const DEG = Math.PI / 180;
const MAX_CAP = 80 * DEG;

const sub = (a, b) => a.map((v, i) => v - b[i]);
const scale = (a, s) => a.map((v) => v * s);
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const length = (a) => Math.hypot(...a);
const unit = (a) => scale(a, 1 / (length(a) || 1));

// Azimuth 0 faces the front camera (+z); polar 0 is straight up.
function direction(polar, azimuth) {
  return [
    Math.sin(polar) * Math.sin(azimuth),
    Math.cos(polar),
    Math.sin(polar) * Math.cos(azimuth),
  ];
}

const polarOf = (u) => Math.acos(Math.max(-1, Math.min(1, u[1])));

// Pushes heads apart until no two crowns are closer than their radii allow.
// `fixed` heads are anchors; everything else is held inside a cone of `cap`.
function relax(heads, { cap, fixed = new Set(), iterations = 240 }) {
  for (let step = 0; step < iterations; step += 1) {
    let moved = false;
    heads.forEach((a, i) => {
      heads.forEach((b, j) => {
        if (j <= i) return;
        const pa = scale(a.u, a.distance);
        const pb = scale(b.u, b.distance);
        const gap = length(sub(pa, pb));
        const need = a.need + b.need;
        if (gap >= need) return;
        moved = true;
        const away = unit(sub(pa, pb));
        const share = fixed.has(i) || fixed.has(j) ? 1 : 0.5;
        const push = (need - gap) * share;
        [
          [a, i, 1],
          [b, j, -1],
        ].forEach(([head, index, sign]) => {
          if (fixed.has(index)) return;
          const tangent = sub(away, scale(head.u, dot(away, head.u)));
          head.u = unit(
            head.u.map((v, k) => v + (tangent[k] * sign * push) / head.distance)
          );
        });
      });
    });
    heads.forEach((head, index) => {
      if (fixed.has(index)) return;
      const polar = polarOf(head.u);
      const azimuth = Math.atan2(head.u[0], head.u[2]);
      // Pull back toward the pole, so heads that cannot all fit spread through
      // the dome instead of piling onto its rim.
      if (polar > cap) head.u = direction(cap, azimuth);
      else if (polar > 0) head.u = direction(polar * 0.985, azimuth);
    });
    if (!moved) break;
  }
}

// Round hand-tied posy. Heads sit in a shallow band rather than on one exact
// sphere — longer stems ride a little higher, which separates crowns in depth
// as well as across the dome, the way a real posy staggers its flowers.
function dome(heads, { gap, rng, spread }) {
  const shortest = Math.min(...heads.map((h) => h.reach));
  const band = shortest * 0.35;
  heads.forEach((head) => {
    head.distance = Math.min(head.reach, shortest + band);
    head.slide = head.reach - head.distance;
  });
  const distance = shortest + band / 2;
  const solid = heads.reduce((sum, h) => {
    const half = Math.asin(Math.min(1, (h.radius * (1 + gap)) / distance));
    return sum + 2 * Math.PI * (1 - Math.cos(half));
  }, 0);
  const needed = Math.acos(Math.max(-1, 1 - solid / 0.82 / (2 * Math.PI)));
  const cap = Math.min(MAX_CAP, Math.max(spread, needed));
  const order = heads
    .map((h, i) => i)
    .sort((a, b) => heads[b].radius - heads[a].radius);

  // Each crown takes a share of the dome proportional to its own area, so a
  // big head sits in the middle and small ones ring it — rather than everyone
  // taking an equal slice and the large ones colliding.
  const total = order.reduce((sum, index) => sum + heads[index].radius ** 2, 0);
  let filled = 0;
  order.forEach((index, k) => {
    const head = heads[index];
    const share = head.radius ** 2 / total;
    const ring = Math.sqrt(filled + share / 2);
    filled += share;
    head.u = direction(
      cap * ring * (1 + rng.signed() * 0.06),
      k * GOLDEN_ANGLE + rng.signed() * 0.2
    );
  });
  relax(heads, { cap, iterations: 120 });
}

// One-sided arrangement facing the front: longest stem in the middle, stems
// shortening toward the sides of a triangle, overflow in a lower front row.
function fan(heads, { gap, rng, spread }) {
  const order = heads
    .map((h, i) => i)
    .sort((a, b) => heads[b].reach - heads[a].reach);
  const tallest = heads[order[0]].reach;
  const rows = [{ count: 0, left: 0, right: 0 }];
  let current = 0;

  // Rows are filled front to back: when one reaches the cone, the next flower
  // starts a shorter row in front of it, which is how a front-facing
  // arrangement gets depth instead of one crowded arc.
  const fit = (head, rowIndex) => {
    const row = rows[rowIndex];
    const target = tallest * (1 - 0.26 * rowIndex - 0.06 * row.count);
    const distance = Math.min(head.reach, Math.max(target, tallest * 0.4));
    const width = (2 * head.radius * (1 + gap)) / distance;
    // Rows start staggered: unstaggered, the first flower of every row sits
    // dead centre and the rows stack into each other.
    if (row.count === 0) {
      const stagger =
        rowIndex === 0 ? 0 : ((rowIndex % 2) * 2 - 1) * width * 0.5;
      return { angle: stagger, distance, width };
    }
    const side = row.count % 2 === 1 ? 1 : -1;
    const edge = side > 0 ? row.right : row.left;
    return { angle: side * (edge + width / 2), distance, width };
  };

  order.forEach((index) => {
    const head = heads[index];
    let placed = fit(head, current);
    if (
      rows[current].count > 0 &&
      Math.abs(placed.angle) + placed.width / 2 > MAX_CAP
    ) {
      rows.push({ count: 0, left: 0, right: 0 });
      current += 1;
      placed = fit(head, current);
    }
    const row = rows[current];
    row.right = Math.max(row.right, placed.angle + placed.width / 2);
    row.left = Math.max(row.left, -placed.angle + placed.width / 2);
    row.count += 1;
    Object.assign(head, {
      angle: placed.angle,
      distance: placed.distance,
      row: current,
    });
  });

  heads.forEach((head) => {
    const { left, right } = rows[head.row];
    const half = Math.max(left, right);
    let stretch = 1;
    if (half > MAX_CAP) stretch = MAX_CAP / half;
    else if (head.row === 0 && half < spread) stretch = spread / half;
    const lean = head.angle * stretch + rng.signed() * 0.03;
    const forward = (head.row * 26 - 6) * DEG;
    const u = direction(Math.abs(lean), Math.sign(lean) * 90 * DEG);
    const c = Math.cos(forward);
    const s = Math.sin(forward);
    const tilted = unit([u[0], u[1] * c - u[2] * s, u[1] * s + u[2] * c]);
    const polar = polarOf(tilted);
    Object.assign(head, {
      slide: head.reach - head.distance,
      u:
        polar > MAX_CAP
          ? direction(MAX_CAP, Math.atan2(tilted[0], tilted[2]))
          : tilted,
    });
  });
}

// Sogetsu basic upright, from a kenzan at the stem bases: shin, soe and hikae
// at 1 : 3/4 : 1/2 of the shin, leaning ~12°, 45° and 75°; the rest are jushi,
// shorter fillers tucked between them.
const IKEBANA_LINES = [
  { azimuth: -35, length: 1, polar: 12 },
  { azimuth: -60, length: 0.75, polar: 45 },
  { azimuth: 45, length: 0.5, polar: 75 },
];

function ikebana(heads, { rng }) {
  const order = heads
    .map((h, i) => i)
    .sort((a, b) => heads[b].reach - heads[a].reach);
  const shin = heads[order[0]].reach;
  const fixed = new Set();

  order.forEach((index, rank) => {
    const head = heads[index];
    const line = IKEBANA_LINES[rank];
    if (line) {
      head.distance = Math.min(head.reach, shin * line.length);
      head.u = direction(line.polar * DEG, line.azimuth * DEG);
      fixed.add(index);
    } else {
      head.distance = Math.min(head.reach, shin * rng.range(0.25, 0.55));
      head.u = direction(rng.range(25, 65) * DEG, rng.range(-80, 60) * DEG);
    }
    head.slide = head.reach - head.distance;
    head.need *= 0.8;
  });
  relax(heads, { cap: 85 * DEG, fixed });
}

const STYLES = { dome, fan, ikebana };

// Places `flowers` ({ center, crownRadius, height }) into a bouquet. Every
// flower is rigid: it turns about its own axis, swings from its head
// direction to a target direction about the pivot, and slides down its own
// stem (a shorter cut) — so the stems keep passing through the tie. Returns
// { pivot, from, to, turn, slide, scale } per flower.
export default function arrangeBouquet(
  flowers,
  {
    gap = 0.1,
    jitter = 0.35,
    seed = 'bouquet',
    spread = 30,
    style = 'dome',
    tie = 0.3,
  } = {}
) {
  const rng = createRng(`${seed}:bouquet`);
  const lowest = Math.min(...flowers.map((f) => f.height));
  // The tie is also the lever every flower swings on, so it has to sit well
  // below the crowns: tied up among them, the heads are barely further from
  // the pivot than they are wide and no arrangement can separate them.
  const usable = Math.min(
    ...flowers.map((f) => f.center[1] - f.crownRadius / 0.45)
  );
  const pivot = [
    0,
    style === 'ikebana' ? 0 : Math.max(0, Math.min(lowest * tie, usable)),
    0,
  ];
  const heads = flowers.map((flower) => {
    const size = 1 + rng.signed() * jitter * 0.08;
    const offset = sub(flower.center, pivot);
    return {
      from: unit(offset),
      need: flower.crownRadius * size * (1 + gap),
      radius: flower.crownRadius * size,
      reach: length(offset) * size,
      size,
    };
  });

  (STYLES[style] ?? dome)(heads, { gap, rng, spread: spread * DEG });

  return heads.map((head) => ({
    from: head.from,
    pivot,
    scale: head.size,
    slide: Math.max(0, head.slide + rng() * jitter * head.radius * 0.3),
    to: head.u,
    turn: rng() * Math.PI * 2,
  }));
}

// Axis-aligned bounds of a specimen's segment endpoints, sampled so a
// 400k-segment flower costs a few thousand reads.
export function specimenBounds(specimen, transform = (p) => p) {
  const { count, end, start } = specimen.segments;
  const stride = Math.max(1, Math.floor(count / 4000));
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  const add = (array, i) => {
    const p = transform([array[i], array[i + 1], array[i + 2]]);
    for (let a = 0; a < 3; a += 1) {
      min[a] = Math.min(min[a], p[a]);
      max[a] = Math.max(max[a], p[a]);
    }
  };

  for (let k = 0; k < count; k += stride) {
    add(start, k * 4);
    add(end, k * 4);
  }
  return count > 0 ? { max, min } : { max: [1, 1, 1], min: [-1, 0, -1] };
}
