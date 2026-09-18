export const MYCELIUM_FORMS = ['ball', 'mat', 'taproot', 'curtain', 'fan'];
export const STRAND_STYLES = ['straight', 'wavy', 'kinked', 'curly'];

const MAX_SEGMENTS = 60000;
const TAU = Math.PI * 2;

const pick = (rng, list) => list[Math.floor(rng() * list.length)];

export function rollMycelium(rng, alien, hints = {}) {
  return {
    net: rng.chance(0.2 + alien * 0.4) ? rng.range(0.1, 0.8) : 0,
    cords: rng.range(0.3, 1),
    density: rng.range(0.35, 1),
    depth: rng.range(0.7, 1.4) * (1 + alien * rng.range(0, 0.8)),
    form: pick(rng, MYCELIUM_FORMS),
    fuzz: rng.range(0.2, 1),
    reach: rng.range(0.35, 0.6),
    soil: rng.range(0, 1),
    style: pick(rng, STRAND_STYLES),
    wiggle: rng.range(0.2, 0.7) + alien * rng.range(0, 0.8),
    width: rng.range(0.7, 1.3),
    ...hints,
  };
}

// A point inside the volume the hyphae fill, below the soil line (y < 0).
function envelope(m, size, rng) {
  const w = size * 0.75 * m.width;
  const d = size * m.depth;
  if (m.form === 'mat') {
    const r = w * 1.8 * Math.sqrt(rng());
    const a = rng() * TAU;
    return [
      Math.cos(a) * r,
      -d * 0.35 * rng() ** 2 - 0.02 * size,
      Math.sin(a) * r,
    ];
  }
  if (m.form === 'taproot') {
    const t = rng() ** 0.7;
    const r = w * 0.35 * (1 - t * 0.85) * Math.sqrt(rng());
    const a = rng() * TAU;
    return [Math.cos(a) * r, -d * 2.2 * t - 0.05 * size, Math.sin(a) * r];
  }
  if (m.form === 'curtain') {
    const r = w * Math.sqrt(rng());
    const a = rng() * TAU;
    return [Math.cos(a) * r, -d * 1.6 * (0.3 + 0.7 * rng()), Math.sin(a) * r];
  }
  if (m.form === 'fan') {
    const a = rng.range(-0.9, 0.9) - Math.PI / 2;
    const r = w * 1.4 * Math.sqrt(rng());
    return [
      Math.cos(a) * r * 0.9,
      -Math.abs(Math.sin(a)) * r - 0.05 * size,
      rng.signed() * w * 0.25,
    ];
  }
  const u = rng.signed();
  const a = rng() * TAU;
  const s = Math.cbrt(rng());
  const ring = Math.sqrt(1 - u * u) * s;
  return [
    Math.cos(a) * ring * w,
    -d * 0.55 * (1 + u * s) - 0.03 * size,
    Math.sin(a) * ring * w,
  ];
}

function split(points, ids, rng) {
  let best = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const z = rng.signed();
    const a = rng() * TAU;
    const q = Math.sqrt(1 - z * z);
    const axis = [q * Math.cos(a), z, q * Math.sin(a)];
    const sorted = ids
      .map((id) => ({
        id,
        t:
          points[id][0] * axis[0] +
          points[id][1] * axis[1] +
          points[id][2] * axis[2],
      }))
      .sort((l, r) => l.t - r.t);
    const spread = sorted[sorted.length - 1].t - sorted[0].t;
    if (!best || spread > best.spread) best = { sorted, spread };
  }
  const cut = Math.min(
    ids.length - 1,
    Math.max(1, Math.round(ids.length * (0.5 + rng.signed() * 0.2)))
  );
  return [
    best.sorted.slice(0, cut).map((e) => e.id),
    best.sorted.slice(cut).map((e) => e.id),
  ];
}

const centroid = (points, ids) =>
  [0, 1, 2].map(
    (k) => ids.reduce((sum, id) => sum + points[id][k], 0) / ids.length
  );

// The mycelium hanging under the fruiting bodies: tips scattered through a
// rolled volume, gathered by recursive bisection so strands run toward
// sub-cluster centroids (Flora's crown method, turned upside down). Strand
// radius follows the pipe rule, so trunk cords thin to fine hyphae.
export default function buildMycelium(rng, genome, bases) {
  const m = genome.mycelium;
  // Slime-mould colonies are tiny; their film spreads about as far as the
  // colony does, not as far as a mushroom's mycelium would.
  const size =
    genome.plan === 'sporangium'
      ? Math.max(
          genome.size * genome.capRadius * 4,
          ...bases.map((b) => Math.hypot(b.position[0], b.position[2]) * 1.4)
        )
      : genome.size;
  const tipCount = Math.round(80 + m.density * 420);
  const tips = Array.from({ length: tipCount }, () => {
    const p = envelope(m, size, rng);
    const base = bases[Math.floor(rng() * bases.length)];
    return [p[0] + base.position[0] * 0.7, p[1], p[2] + base.position[2] * 0.7];
  });
  const owner = tips.map((t) =>
    bases.reduce(
      (best, b, i) =>
        Math.hypot(t[0] - b.position[0], t[2] - b.position[2]) <
        Math.hypot(
          t[0] - bases[best].position[0],
          t[2] - bases[best].position[2]
        )
          ? i
          : best,
      0
    )
  );

  const start = [];
  const end = [];
  const time = [];
  const baseR = Math.max(...bases.map((b) => b.genome.stipeR));
  const radius0 = Math.max(size * 0.012, baseR * 0.3) * (0.6 + m.cords * 0.6);
  const fine = size * 0.0018;
  const radiusFor = (n) => Math.max(fine, radius0 * (n / tipCount) ** 0.5);
  const kink = m.style === 'kinked' ? 1 : 0;
  const curl = m.style === 'curly' ? 1 : 0;
  const wave = m.style === 'wavy' ? 1 : 0.35;

  function strand(a, b, ra, rb, t0) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const steps = Math.max(2, Math.ceil(len / (size * 0.06)));
    const phase = rng() * TAU;
    const side = [rng.signed(), rng.signed() * 0.3, rng.signed()];
    let prev = a;
    let pt = t0;
    for (let i = 1; i <= steps; i += 1) {
      const f = i / steps;
      const env = Math.sin(Math.PI * f);
      const amp = len * 0.12 * m.wiggle * env;
      const w = Math.sin(f * (3 + curl * 6) + phase) * wave * amp;
      const next =
        i === steps
          ? b
          : [0, 1, 2].map(
              (k) =>
                a[k] +
                (b[k] - a[k]) * f +
                side[k] * w +
                (kink ? rng.signed() * amp * 0.5 : 0) +
                (curl ? Math.cos(f * 9 + phase + k) * amp * 0.6 : 0)
            );
      const step = Math.hypot(
        next[0] - prev[0],
        next[1] - prev[1],
        next[2] - prev[2]
      );
      const r = ra + (rb - ra) * f;
      if (start.length / 4 < MAX_SEGMENTS) {
        start.push(prev[0], prev[1], prev[2], ra + (rb - ra) * (f - 1 / steps));
        end.push(next[0], next[1], next[2], r);
        time.push(pt, pt + step);
      }
      pt += step;
      prev = next;
    }
    return pt;
  }

  const nodes = [];

  function grow(p, ids, t) {
    if (ids.length === 1) {
      const tip = tips[ids[0]];
      const at = strand(p, tip, radiusFor(1), fine, t);
      const fuzz = Math.round(m.fuzz * 6);
      for (let k = 0; k < fuzz; k += 1) {
        const l = size * rng.range(0.02, 0.08);
        strand(
          tip,
          [
            tip[0] + rng.signed() * l,
            tip[1] - rng() * l,
            tip[2] + rng.signed() * l,
          ],
          fine,
          fine * 0.6,
          at
        );
      }
      return;
    }
    split(tips, ids, rng).forEach((half) => {
      const c = centroid(tips, half);
      const q = p.map((v, k) => v + (c[k] - v) * m.reach);
      const at = strand(p, q, radiusFor(ids.length), radiusFor(half.length), t);
      nodes.push({ at, p: q, r: radiusFor(half.length) });
      grow(q, half, at);
    });
  }

  // Several cords leave each stipe base around its rim, so the specimen is
  // anchored in a flare of strands rather than hanging from one thread.
  bases.forEach((base, i) => {
    const ids = tips.map((_, k) => k).filter((k) => owner[k] === i);
    if (ids.length === 0) return;
    const [bx, , bz] = base.position;
    const rim = base.genome.stipeR * (1 + base.genome.bulb * 0.6) * 0.8;
    const cords = Math.min(ids.length, 3 + Math.floor(m.cords * 4));
    const byAngle = ids
      .map((k) => ({ a: Math.atan2(tips[k][2] - bz, tips[k][0] - bx), k }))
      .sort((l, r) => l.a - r.a);
    for (let c = 0; c < cords; c += 1) {
      const group = byAngle
        .slice(
          Math.floor((c * byAngle.length) / cords),
          Math.floor(((c + 1) * byAngle.length) / cords)
        )
        .map((e) => e.k);
      if (group.length > 0) {
        const { a } = byAngle[Math.floor(((c + 0.5) * byAngle.length) / cords)];
        const root = [
          bx + Math.cos(a) * rim,
          base.genome.stipeH * 0.04,
          bz + Math.sin(a) * rim,
        ];
        grow(root, group, 0);
      }
    }
  });

  // Anastomosis: neighbouring branches fuse, which turns a tree into the
  // vein network of a plasmodium.
  const links = Math.round(m.net * nodes.length * 0.6);
  for (let k = 0; k < links && nodes.length > 2; k += 1) {
    const a = nodes[Math.floor(rng() * nodes.length)];
    let best = null;
    let bestD = Infinity;
    for (let tries = 0; tries < 24; tries += 1) {
      const b = nodes[Math.floor(rng() * nodes.length)];
      const d = Math.hypot(b.p[0] - a.p[0], b.p[1] - a.p[1], b.p[2] - a.p[2]);
      if (b !== a && d > size * 0.06 && d < bestD) {
        best = b;
        bestD = d;
      }
    }
    if (best && bestD < size * 0.6) {
      const r = Math.min(a.r, best.r) * 0.8;
      strand(a.p, best.p, r, r, Math.max(a.at, best.at));
    }
  }

  const count = start.length / 4;
  let longest = 1e-6;
  for (let i = 0; i < count; i += 1)
    longest = Math.max(longest, time[i * 2 + 1]);
  const times = Float32Array.from(time, (t) => t / longest);

  const crumbs = [];
  const crumbCount = Math.round(m.soil * 160);
  for (let c = 0; c < crumbCount && count > 0; c += 1) {
    const i = Math.floor(rng() ** 2 * count);
    const s = size * rng.range(0.012, 0.045);
    crumbs.push(
      start[i * 4] + rng.signed() * s * 0.6,
      start[i * 4 + 1] + rng.signed() * s * 0.6,
      start[i * 4 + 2] + rng.signed() * s * 0.6,
      s,
      times[i * 2]
    );
  }

  return {
    count,
    crumbs: new Float32Array(crumbs),
    end: new Float32Array(end),
    start: new Float32Array(start),
    time: times,
  };
}
