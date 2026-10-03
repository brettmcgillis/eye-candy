import { FACES, entrance, faceOf, spouts, windowGrid } from './details';

const MAX_FINS = 36;

// Tier heights: a few unequal bands, the lowest usually the tallest.
function tierHeights(rng, total, count) {
  const weights = Array.from(
    { length: count },
    (_, i) => rng.range(0.6, 1.4) * (i === 0 ? 1.3 : 1)
  );
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => (w / sum) * total);
}

function finRow(book, f, rng, { from, to }) {
  const spacing = rng.range(3, 7);
  const count = Math.min(MAX_FINS, Math.floor((f.width - 2) / spacing));
  if (count < 2) return;
  const depth = rng.range(1.2, 3.5);
  const thickness = rng.range(0.3, 0.6);
  const yaw = Math.atan2(f.normal[0], f.normal[2]);
  const base = f.part.center;
  const height = to - from;
  for (let i = 0; i < count; i += 1) {
    const s = ((i + 0.5) / count - 0.5) * (count * spacing);
    const out = f.depth + depth / 2 - 0.1;
    book.box(
      [
        base[0] + f.normal[0] * out + f.tangent[0] * s,
        from + height / 2,
        base[2] + f.normal[2] * out + f.tangent[2] * s,
      ],
      [thickness / 2, height / 2, depth / 2],
      'fin',
      { yaw }
    );
  }
}

function slitWindows(book, f, rng, openings) {
  const height = f.top - f.bottom;
  if (height < 8 || !rng.chance(openings)) return;
  const tall = rng.chance(0.6);
  const width = tall ? rng.range(0.6, 1.1) : rng.range(3, 9);
  const winHeight = tall ? rng.range(3, 8) : rng.range(0.7, 1.4);
  const pitchS = tall ? rng.range(3, 8) : width + rng.range(2, 6);
  const pitchY = winHeight + rng.range(3, 10);
  const columns = Math.max(1, Math.floor((f.width - 6) / pitchS));
  const rows = Math.max(1, Math.floor((height - 6) / pitchY));
  const used = Math.max(1, Math.round(rows * (0.3 + openings * 0.7)));
  const yFrom = f.bottom + 3 + (rows - used) * pitchY * rng();
  windowGrid(book, f, {
    columns: Math.max(1, Math.round(columns * (0.3 + openings * 0.7))),
    depth: rng.range(0.6, 1.6),
    height: winHeight,
    margin: 3,
    rows: used,
    width,
    yFrom,
    yTo: yFrom + used * pitchY,
  });
}

// A single unexplained mass: tiers that step back or cantilever out, necks
// that make the upper tiers float, rows of fins, windowless shafts, and very
// few openings.
export default function monolith(book, c, rng) {
  const width = c.footprint;
  const depth = c.footprint * c.aspect;
  let ground = 0;

  if (rng.chance(0.35 + c.complexity * 0.4)) {
    const podium = rng.range(4, 10);
    book.box(
      [0, (podium - 2) / 2, 0],
      [
        width * rng.range(0.6, 0.78),
        (podium + 2) / 2,
        depth * rng.range(0.62, 0.85),
      ],
      'plinth'
    );
    ground = podium;
  }

  const heights = tierHeights(
    rng,
    c.structureHeight - ground,
    Math.round(c.tiers)
  );
  const tiers = [];
  let hx = width / 2;
  let hz = depth / 2;
  let cx = 0;
  let cz = 0;
  let y = ground;

  heights.forEach((h, t) => {
    if (t > 0) {
      const [px, pz] = [hx, hz];
      if (rng.chance(c.overhang)) {
        hx = Math.min(width * 0.75, hx * rng.range(1.05, 1.4));
        hz = Math.min(depth * 0.9, hz * rng.range(1, 1.3));
        cx += rng.signed() * px * 0.2 * c.complexity;
      } else {
        hx *= rng.range(0.6, 0.9);
        hz *= rng.range(0.62, 0.92);
        cx += rng.signed() * (px - hx) * 0.8;
        cz += rng.signed() * (pz - hz) * 0.8;
      }
    }

    let from = y;
    if (t > 0 && rng.chance(c.slots)) {
      const neck = Math.min(h * 0.35, rng.range(2.5, 6));
      const inset = rng.range(3, 9);
      book.box(
        [cx, from + neck / 2, cz],
        [Math.max(2, hx - inset), neck / 2 + 0.3, Math.max(2, hz - inset)],
        'mass'
      );
      from += neck;
    }

    const id = book.box(
      [cx, (from + y + h) / 2 - (t === 0 ? 1 : 0), cz],
      [hx, (y + h - from) / 2 + (t === 0 ? 1 : 0.3), hz],
      'mass'
    );
    tiers.push({ from, id, to: y + h });
    y += h;
  });

  // Doors first: a later window that would overlap one is refused.
  if (c.humanDetail > 0) {
    const host = book.parts[tiers[0].id];
    entrance(book, faceOf(host, rng.chance(0.7) ? '+z' : '+x'), rng, {
      ground,
    });
  }

  tiers.forEach(({ from, id, to }, t) => {
    const part = book.parts[id];
    FACES.forEach((face) => {
      const f = faceOf(part, face);
      if (rng.chance(c.fins * 0.55)) {
        finRow(book, f, rng, { from: from + (t === 0 ? 3 : 0), to: to - 0.5 });
      } else {
        slitWindows(book, f, rng, c.openings);
      }
      if (c.humanDetail > 0 && rng.chance(c.humanDetail * 0.7)) {
        spouts(book, f, rng, 1 + Math.floor(rng() * 4));
      }
    });
  });

  for (let i = 0; i < Math.round(c.cores); i += 1) {
    const host = book.parts[tiers[0].id];
    const f = faceOf(host, FACES[Math.floor(rng() * 4)]);
    const coreW = rng.range(6, 13);
    const coreD = rng.range(5, 11);
    const coreH = c.structureHeight * rng.range(0.5, 1.18);
    const s = rng.range(-0.4, 0.4) * f.width;
    const out = f.depth + coreD / 2 - 1.5;
    const yaw = Math.atan2(f.normal[0], f.normal[2]);
    const core = book.box(
      [
        host.center[0] + f.normal[0] * out + f.tangent[0] * s,
        coreH / 2 - 1,
        host.center[2] + f.normal[2] * out + f.tangent[2] * s,
      ],
      [coreW / 2, coreH / 2 + 1, coreD / 2],
      'core',
      { yaw }
    );
    const shaft = faceOf(book.parts[core], '+z');
    windowGrid(book, shaft, {
      columns: 1,
      depth: 1,
      height: coreH * rng.range(0.4, 0.8),
      margin: 1,
      rows: 1,
      width: rng.range(0.5, 1.2),
      yFrom: coreH * rng.range(0.1, 0.3),
      yTo: coreH,
    });
  }

  const top = tiers[tiers.length - 1];
  const roof = book.parts[top.id];
  const plant = Math.floor(rng() * (1 + c.complexity * 3));
  for (let i = 0; i < plant; i += 1) {
    const w = rng.range(4, 12);
    const h = rng.range(2.5, 7);
    book.box(
      [
        roof.center[0] + rng.signed() * (roof.half[0] - w),
        top.to + h / 2 - 0.3,
        roof.center[2] + rng.signed() * (roof.half[2] - w),
      ],
      [w / 2, h / 2 + 0.3, rng.range(3, 8) / 2],
      'mass'
    );
  }

  return { ground };
}
