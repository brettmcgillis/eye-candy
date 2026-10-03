import { rotateZ } from './parts';

const DEG = Math.PI / 180;
const RISE = 0.17;
const TREAD = 0.32;

// The centre height that sinks a leaning prism's highest base corner a
// metre into the ground, so a lean never lifts a blade off its footing.
function seat(profile, tilt, base) {
  const lifted = profile
    .filter(([, y]) => y <= 0.01)
    .map((p) => rotateZ([p[0], p[1], 0], tilt)[1]);
  return base - 1 - Math.max(...lifted);
}

function mirrored(profile) {
  return profile.map(([x, y]) => [-x, y]).reverse();
}

// A flight up the front of a terrace: nested blocks, each a step taller and
// shorter than the last, so no two share a face.
function flight(book, { from, to, width, x, z }) {
  const count = Math.max(1, Math.round((to - from) / RISE));
  const rise = (to - from) / count;
  for (let i = 0; i < count; i += 1) {
    const top = from + (i + 1) * rise;
    const reach = (count - i) * TREAD;
    book.box(
      [x, (top + from - 0.3) / 2, z + reach / 2 - 0.1],
      [width / 2 - i * 0.003, (top - from + 0.3) / 2, reach / 2 + 0.1],
      'step'
    );
  }
}

function plaza(book, c, rng, radius) {
  const terraces = Math.round(1 + c.plaza * 4);
  if (c.plaza <= 0.02) return 0;
  let y = 0;
  let half = radius * (1.25 + c.plaza * 0.55);
  const stairWidth = rng.range(6, 14);
  for (let i = 0; i < terraces; i += 1) {
    const h = rng.range(0.9, 2);
    book.box(
      [0, (y + h - 1) / 2, 0],
      [half, (h + 1) / 2 + y / 2, half],
      'plinth'
    );
    flight(book, { from: y, to: y + h, width: stairWidth, x: 0, z: half });
    y += h;
    half -= rng.range(3, 7) + radius * 0.05;
  }
  return y;
}

function fan(book, c, rng, base) {
  const radius = c.footprint / 2;
  const count = Math.round(c.blades);
  const phase = rng() * Math.PI * 2;
  const lean = c.lean * DEG;
  for (let i = 0; i < count; i += 1) {
    const h = c.structureHeight * (i === 0 ? 1 : rng.range(0.65, 0.98));
    const r0 = radius * rng.range(0.04, 0.2);
    const r1 = radius * rng.range(0.7, 1);
    const top = r0 + (r1 - r0) * (1 - c.taper) * rng.range(0.2, 0.6);
    const knee = r1 + (top - r1) * rng.range(0.3, 0.7);
    const profile = [
      [r0, 0],
      [r1, 0],
      [knee, h * rng.range(0.2, 0.45)],
      [top, h],
      [r0, h * rng.range(0.82, 0.97)],
    ];
    const tilt = lean * rng.range(0.6, 1);
    book.prism(
      [0, seat(profile, tilt, base), 0],
      profile,
      rng.range(2.5, 6),
      'blade',
      {
        tilt,
        yaw: phase + (i / count) * Math.PI * 2 + rng.signed() * 0.08,
      }
    );
  }
}

function split(book, c, rng, base) {
  const radius = c.footprint / 2;
  const gap = radius * rng.range(0.08, 0.22);
  const width = radius * rng.range(0.55, 0.9);
  const depth = radius * rng.range(0.8, 1.4);
  const h = c.structureHeight;
  const inner = -gap / 2;
  const half = [
    [inner - width, 0],
    [inner, 0],
    [inner - width * rng.range(0, 0.08), h * rng.range(0.45, 0.6)],
    [inner - width * (0.1 + c.taper * 0.2), h],
    [inner - width * rng.range(0.55, 0.75), h * rng.range(0.68, 0.8)],
    [inner - width * rng.range(0.95, 1.05), h * rng.range(0.28, 0.4)],
  ];
  const yaw = rng() * Math.PI;
  const lean = c.lean * DEG * 0.35;
  [
    [half, -lean],
    [mirrored(half), lean],
  ].forEach(([profile, tilt]) =>
    book.prism([0, seat(profile, tilt, base), 0], profile, depth, 'blade', {
      tilt,
      yaw,
    })
  );
}

function ring(book, c, rng, base) {
  const radius = c.footprint / 2;
  const count = Math.round(c.blades * 1.5);
  const ringRadius = radius * rng.range(0.5, 0.8);
  const ribDepth = radius * rng.range(0.12, 0.25);
  const thickness = ((Math.PI * 2 * ringRadius) / count) * rng.range(0.3, 0.55);
  const phase = rng();
  const lean = c.lean * DEG * 0.5;
  for (let i = 0; i < count; i += 1) {
    const climb = (i / count + phase) % 1;
    const h = c.structureHeight * (0.4 + 0.6 * climb ** 1.4);
    const a = ringRadius - ribDepth / 2;
    const b = ringRadius + ribDepth / 2;
    const profile = [
      [a, 0],
      [b, 0],
      [b - ribDepth * c.taper * 0.6, h * rng.range(0.85, 0.95)],
      [a + ribDepth * c.taper * 0.3, h],
    ];
    book.prism([0, seat(profile, lean, base), 0], profile, thickness, 'blade', {
      tilt: lean,
      yaw: (i / count) * Math.PI * 2,
    });
  }
}

function pierced(book, c, rng, base) {
  const radius = c.footprint / 2;
  const bw = radius * rng.range(0.7, 1);
  const tw = bw * (1 - c.taper * 0.65);
  const h = c.structureHeight;
  const chamfer = Math.min(tw, h * 0.12) * rng.range(0.2, 0.7);
  const depth = radius * rng.range(0.35, 0.7);
  const profile = [
    [-bw, 0],
    [bw, 0],
    [tw, h - chamfer],
    [tw - chamfer, h],
    [-tw + chamfer, h],
    [-tw, h - chamfer],
  ];
  const yaw = rng() * Math.PI;
  const block = book.prism([0, base - 1, 0], profile, depth, 'blade', { yaw });
  const voidRadius = Math.min(tw, h * 0.3) * rng.range(0.45, 0.8);
  const voidY = base - 1 + h * rng.range(0.5, 0.68);
  book.cut(block, {
    center: [0, voidY, 0],
    half: [voidRadius, depth / 2 + 2, voidRadius],
    kind: 'cylinder',
    pitch: Math.PI / 2,
    role: 'void',
    yaw,
  });

  if (rng.chance(0.4 + c.complexity * 0.4)) {
    const wing = h * rng.range(0.3, 0.55);
    const reach = bw * rng.range(0.6, 1);
    [-1, 1].forEach((side) => {
      const p = [
        [0, 0],
        [reach, 0],
        [reach * 0.15, wing],
        [0, wing * 0.9],
      ];
      book.prism(
        [0, base - 1, 0],
        (side > 0 ? p : mirrored(p)).map(([x, y]) => [x + side * bw * 0.98, y]),
        depth * 0.6,
        'blade',
        { yaw }
      );
    });
  }
}

const MOTIFS = { fan, pierced, ring, split };

// A memorial whose meaning nobody remembers: shards, splits and rings on a
// stepped plaza, every step a measure of how large the thing is.
export default function spomenik(book, c, rng) {
  const base = plaza(book, c, rng, c.footprint / 2);
  (MOTIFS[c.motif] ?? fan)(book, c, rng, base);
  return { ground: base };
}
