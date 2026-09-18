import { memberGenome } from './genome';

const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function weighted(rng, weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  const roll = rng() * total;
  let running = 0;
  const hit = entries.find(([, w]) => {
    running += w;
    return roll <= running;
  });
  return (hit ?? entries[entries.length - 1])[0];
}

function tilt(normal, angle, heading) {
  const [nx, ny, nz] = normal;
  const helper = Math.abs(ny) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const ux = ny * helper[2] - nz * helper[1];
  const uy = nz * helper[0] - nx * helper[2];
  const uz = nx * helper[1] - ny * helper[0];
  const ul = Math.hypot(ux, uy, uz) || 1;
  const u = [ux / ul, uy / ul, uz / ul];
  const v = [
    ny * u[2] - nz * u[1],
    nz * u[0] - nx * u[2],
    nx * u[1] - ny * u[0],
  ];
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const ch = Math.cos(heading);
  const sh = Math.sin(heading);
  return [0, 1, 2].map((i) => normal[i] * c + (u[i] * ch + v[i] * sh) * s);
}

function outwardLean(x, z, angle) {
  const len = Math.hypot(x, z);
  if (len < 1e-6) return [0, 1, 0];
  return [
    (x / len) * Math.sin(angle),
    Math.cos(angle),
    (z / len) * Math.sin(angle),
  ];
}

function scatter(rng, count, radii, extent) {
  const points = [];
  for (let i = 0; i < count; i += 1) {
    let best = null;
    let bestGap = -Infinity;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const r = extent * Math.sqrt(rng());
      const a = rng() * TAU;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      const gap = points.reduce(
        (min, p, j) =>
          Math.min(
            min,
            Math.hypot(p[0] - x, p[1] - z) - (radii[i] + radii[j]) * 0.85
          ),
        Infinity
      );
      if (gap > bestGap) {
        best = [x, z];
        bestGap = gap;
      }
      if (gap > 0) break;
    }
    points.push(best);
  }
  return points;
}

function placeTroop(rng, radii, spread) {
  const mean = radii.reduce((a, b) => a + b, 0) / radii.length;
  const extent = spread * mean * 1.2 * Math.sqrt(radii.length);
  return scatter(rng, radii.length, radii, extent).map(([x, z]) => ({
    position: [x, 0, z],
    up: tilt([0, 1, 0], rng.range(0, 0.14), rng() * TAU),
  }));
}

function placeClump(rng, radii, spread) {
  const base = radii[0] * 0.45 * spread;
  return radii.map((_, i) => {
    const r = i === 0 ? 0 : base * Math.sqrt(rng.range(0.2, 1));
    const a = rng() * TAU;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const lean =
      i === 0 ? rng.range(0, 0.08) : 0.2 + (r / Math.max(base, 1e-6)) * 0.45;
    return { position: [x, 0, z], up: outwardLean(x, z, lean) };
  });
}

// Shelves fanning out from one base (hen-of-the-woods): each member tilts
// outward and turns its fan to face the way it leans.
function placeRosette(rng, radii) {
  const turn = rng() * TAU;
  return radii.map((radius, i) => {
    const a = turn + i * TAU * 0.618034 + rng.signed() * 0.2;
    const lean = rng.range(0.35, 0.75);
    const x = Math.cos(a) * radius * 0.15;
    const z = Math.sin(a) * radius * 0.15;
    return {
      position: [x, 0, z],
      up: [
        Math.cos(a) * Math.sin(lean),
        Math.cos(lean),
        Math.sin(a) * Math.sin(lean),
      ],
      yaw: -a,
    };
  });
}

// A slime-mould colony: heads packed shoulder to shoulder on one film, the
// middle standing tallest.
function placeColony(rng, radii) {
  const mean = radii.reduce((a, b) => a + b, 0) / radii.length;
  const extent = mean * 2.1 * Math.sqrt(radii.length);
  return scatter(rng, radii.length, radii, extent).map(([x, z]) => ({
    position: [x, 0, z],
    up: tilt(outwardLean(x, z, 0), rng.range(0, 0.12), rng() * TAU),
  }));
}

function rollWarts(rng, genome) {
  const warts = new Float32Array(genome.warts * 3);
  for (let i = 0; i < genome.warts; i += 1) {
    warts[i * 3] = Math.sqrt(rng()) * 0.85;
    warts[i * 3 + 1] = rng() * TAU;
    warts[i * 3 + 2] = genome.wartSize * rng.range(0.5, 1.4);
  }
  return warts;
}

const HABIT_WEIGHTS = { clump: 3, solitary: 5, troop: 1.2 };
const MAX_COLONY = 48;

function chooseHabit(rng, genome, requested) {
  if (genome.plan === 'bracket') return 'rosette';
  if (requested !== 'auto') return requested;
  if (genome.habitHint && rng.chance(0.85)) return genome.habitHint;
  if (genome.plan === 'sporangium') return 'colony';
  return weighted(rng, HABIT_WEIGHTS);
}

export default function buildCluster(rng, genome, params) {
  const bracket = genome.plan === 'bracket';
  const habit = chooseHabit(rng, genome, params.habit);

  const most = Math.max(2, Math.round(params.members));
  let count = 1;
  if (habit === 'clump') count = 2 + Math.floor(rng() * (most - 1));
  if (habit === 'troop') count = 2 + Math.floor(rng() * Math.min(3, most - 1));
  if (habit === 'rosette') count = 5 + Math.floor(rng() * 6);
  if (habit === 'colony') {
    count = Math.min(MAX_COLONY, 12 + Math.floor(rng() * (most * 5)));
  }

  const scales = Array.from({ length: count }, () =>
    clamp(Math.exp(rng.gauss() * params.variance * 0.4), 0.45, 1.7)
  ).sort((a, b) => b - a);
  const radii = scales.map((s) => genome.size * genome.capRadius * s);

  let placements;
  if (habit === 'clump') placements = placeClump(rng, radii, params.spread);
  else if (habit === 'troop')
    placements = placeTroop(rng, radii, params.spread);
  else if (habit === 'rosette') placements = placeRosette(rng, radii);
  else if (habit === 'colony') placements = placeColony(rng, radii);
  else
    placements = [
      {
        position: [0, 0, 0],
        up: tilt([0, 1, 0], rng.range(0, 0.08), rng() * TAU),
      },
    ];

  const members = placements.map((placement, i) => {
    const member = rng.fork(`member-${i}`);
    const age = clamp(0.5 - (scales[i] - 1) * 0.9 + rng.gauss() * 0.2, 0, 1);
    const own = memberGenome(genome, member, params.variance, scales[i]);
    if (bracket) {
      own.stipeH = own.capR * member.range(0.35, 0.8);
      own.stipeR = own.capR * member.range(0.1, 0.16);
    }
    return {
      delay: age,
      genome: own,
      position: placement.position,
      scale: scales[i],
      up: placement.up,
      warts: rollWarts(member, own),
      yaw: placement.yaw ?? member() * TAU,
    };
  });

  return { habit, members };
}
