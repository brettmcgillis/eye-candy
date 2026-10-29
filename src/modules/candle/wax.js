/* eslint-disable no-bitwise */
import { createRng } from '@modules/flora';

import surfaceNets from './surfaceNets';

const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const mix = (a, b, t) => a + (b - a) * t;

// Polynomial smooth min / max: blends within `k` instead of creasing.
export function smin(a, b, k) {
  if (k <= 0) return Math.min(a, b);
  const h = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1);
  return mix(b, a, h) - k * h * (1 - h);
}
const smax = (a, b, k) => -smin(-a, -b, k);

const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// A periodic function of bearing as a lookup table: the rim and wall are
// read millions of times per mesh.
const TABLE = 2048;
function tabulate(fn) {
  const table = new Float32Array(TABLE + 1);
  for (let i = 0; i <= TABLE; i += 1) table[i] = fn((i / TABLE) * TAU);
  return (theta) => {
    const u = ((((theta / TAU) % 1) + 1) % 1) * TABLE;
    const i = Math.floor(u);
    return table[i] + (table[i + 1] - table[i]) * (u - i);
  };
}

// A periodic wobble round the rim: a few harmonics with falling weight.
function harmonics(rng, count) {
  return Array.from({ length: count }, (_, n) => ({
    amp: (rng() * 2 - 1) / (n + 1) ** 0.9,
    k: n + 1,
    phase: rng() * TAU,
  }));
}
const wobble = (terms, theta) =>
  terms.reduce(
    (sum, { amp, k, phase }) => sum + amp * Math.cos(k * theta + phase),
    0
  );

// The candle's radius at height y (candle space, centred) and bearing theta.
function profileRadius(form, y, theta) {
  const { amount, count, half, kind, radius, twist } = form.profile;
  const u = clamp(y / half, -1, 1);
  switch (kind) {
    case 'spindle':
      return radius * (1 + amount * 0.28 * (1 - u * u));
    case 'waisted':
      return radius * (1 - amount * 0.24 * (1 - u * u));
    case 'twisted':
      return (
        radius * (1 + amount * 0.11 * Math.cos(count * (theta - twist * y)))
      );
    case 'fluted': {
      const groove = Math.max(0, Math.cos(count * theta)) ** 3;
      return radius * (1 - amount * 0.09 * groove);
    }
    case 'faceted': {
      const sector = TAU / count;
      const local = (((theta % sector) + sector) % sector) - sector / 2;
      const flat = Math.cos(Math.PI / count) / Math.cos(local);
      return radius * mix(1, flat, amount);
    }
    default:
      return radius;
  }
}

function boxOf(points) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  points.forEach(([x, y, z, w]) => {
    [x, y, z].forEach((v, k) => {
      min[k] = Math.min(min[k], v - w * 1.6);
      max[k] = Math.max(max[k], v + w * 1.6);
    });
  });
  return { max, min };
}

function capsule(x, y, z, a, b) {
  const px = x - a[0];
  const py = y - a[1];
  const pz = z - a[2];
  const bx = b[0] - a[0];
  const by = b[1] - a[1];
  const bz = b[2] - a[2];
  const h = clamp(
    (px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz),
    0,
    1
  );
  const dx = px - bx * h;
  const dy = py - by * h;
  const dz = pz - bz * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - (a[3] + (b[3] - a[3]) * h);
}

// The cotton wick: a braid rising out of the pool and curling over at its
// tip, with an optional carbon mushroom. Points in candle space (top end).
function wickOf(form, config, rng) {
  const length = config.wickLength;
  const bend = rng() * TAU;
  const curl = config.wickCurl;
  const base = [0, form.pool - 0.02, 0];
  const points = [];
  const steps = 12;
  for (let s = 0; s <= steps; s += 1) {
    const t = s / steps;
    const lean = curl * length * 0.55 * t ** 2.2;
    points.push([
      base[0] + Math.cos(bend) * lean,
      base[1] + length * (t - curl * 0.18 * t ** 3),
      base[2] + Math.sin(bend) * lean,
    ]);
  }
  const tip = points[points.length - 1];
  const thickness = 0.011 + length * 0.02;
  return {
    bend,
    mushroom:
      config.wickMushroom > 0.35
        ? thickness * (1.2 + config.wickMushroom * 1.4)
        : 0,
    points,
    thickness,
    tip,
  };
}

// Everything a generation's candle is made of, in candle space: y runs up
// the candle's axis with its middle at the origin. The top end is authored;
// the bottom end is the top turned half a turn about z, the suicide king's
// symmetry, so its drips run up the candle toward the middle.
export function candleForm(config) {
  const rng = createRng(`${config.formSeed}:form`);
  const { radius } = config;
  const half = config.candleHeight / 2;
  const wall = config.rimWall * radius;
  const pool = half - config.burnDepth * radius;
  const rim = harmonics(rng, 7);
  const wallTerms = harmonics(rng, 5);
  const profile = {
    amount: config.profile === 'pillar' ? 0 : config.profileAmount,
    count: Math.round(config.profileCount),
    half,
    kind: config.profile,
    radius,
    twist: (config.profileTwist * TAU) / config.candleHeight,
  };

  const maxLength = Math.max(0.05, half - radius * 1.2);
  const drips = Array.from({ length: Math.round(config.dripCount) }, (_, i) => {
    const count = Math.round(config.dripCount);
    const angle = ((i + 0.15 + rng() * 0.7) / count) * TAU;
    const length = Math.min(
      maxLength,
      config.dripLength * (0.3 + 0.7 * rng() ** 0.8)
    );
    return {
      angle,
      bulb: 1.1 + rng() * 0.6,
      length,
      phase: rng() * TAU,
      thickness: radius * 0.1 * config.dripThickness * (0.65 + rng() * 0.7),
      wander: (rng() * 2 - 1) * 0.22,
    };
  });
  const sheets = Array.from({ length: Math.round(config.buildup * 5) }, () => ({
    angle: rng() * TAU,
    length: radius * (0.5 + rng() * 1.6) * (0.5 + config.buildup * 0.5),
    thickness: radius * (0.06 + rng() * 0.05),
    width: radius * (0.25 + rng() * 0.45),
  }));

  const form = {
    config,
    drips,
    lumps:
      config.look === 'clay' ? (config.clayLumps ?? 0.5) * radius * 0.08 : 0,
    half,
    pool,
    profile,
    radius,
    rim,
    sheets,
    wall,
    wallTerms,
  };
  const rimExact = (theta) => {
    let y = half + radius * config.rimRagged * 0.07 * wobble(rim, theta);
    drips.forEach((drip) => {
      const d = wrapAngle(theta - drip.angle);
      const notch = Math.min(
        config.burnDepth * radius * 0.55,
        drip.thickness * 2.2
      );
      y -= notch * Math.exp(-((d / 0.32) ** 2));
    });
    return y;
  };
  const wallExact = (theta) =>
    wall * (1 + 0.35 * config.rimRagged * wobble(wallTerms, theta));
  form.rimAt = tabulate(rimExact);
  form.wallAt = tabulate(wallExact);

  drips.forEach((drip) => {
    const steps = 9;
    const top = form.rimAt(drip.angle);
    const points = [];
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      const theta = drip.angle + drip.wander * Math.sin(drip.phase + t * 3) * t;
      const y = s === 0 ? top - drip.thickness * 0.2 : top - drip.length * t;
      const lip = s === 0 ? -form.wallAt(theta) * 0.6 : 0;
      const r = profileRadius(form, y, theta) + lip + drip.thickness * 0.5;
      const width =
        drip.thickness *
        (s === steps
          ? drip.bulb
          : 1.15 - 0.45 * t + 0.25 * Math.sin(drip.phase * 3 + t * 9) * t);
      points.push([Math.cos(theta) * r, y, Math.sin(theta) * r, width]);
    }
    Object.assign(drip, {
      box: boxOf(points),
      points,
    });
  });
  sheets.forEach((sheet) => {
    const top = form.rimAt(sheet.angle);
    const center = top - sheet.length * 0.45;
    const r = profileRadius(form, center, sheet.angle);
    Object.assign(sheet, {
      center: [Math.cos(sheet.angle) * r, center, Math.sin(sheet.angle) * r],
      normal: [Math.cos(sheet.angle), 0, Math.sin(sheet.angle)],
      tangent: [-Math.sin(sheet.angle), 0, Math.cos(sheet.angle)],
    });
  });

  sheets.forEach((sheet) => {
    Object.assign(sheet, { reach: sheet.length * 0.55 });
  });
  form.reachY =
    Math.min(
      pool - radius * 0.4,
      ...drips.map((drip) => drip.box.min[1]),
      ...sheets.map((sheet) => sheet.center[1] - sheet.reach)
    ) -
    radius * 0.3;
  form.wick = wickOf(form, config, rng);
  form.extent = {
    radial:
      radius * 1.35 +
      Math.max(0, ...drips.map((d) => d.thickness * d.bulb * 2)) +
      0.04,
    y: half + radius * 0.25 + 0.05,
  };
  return form;
}

// Smooth 3D value noise in [-1, 1].
function lattice3(i, j, k) {
  let h =
    Math.imul(i, 374761393) +
    Math.imul(j, 668265263) +
    Math.imul(k, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 2147483647.5 - 1;
}

function noise3(x, y, z) {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const k = Math.floor(z);
  const fx = x - i;
  const fy = y - j;
  const fz = z - k;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const w = fz * fz * (3 - 2 * fz);
  let sum = 0;
  for (let c = 0; c < 8; c += 1) {
    const dx = c & 1;
    const dy = (c >> 1) & 1;
    const dz = (c >> 2) & 1;
    sum +=
      lattice3(i + dx, j + dy, k + dz) *
      (dx ? u : 1 - u) *
      (dy ? v : 1 - v) *
      (dz ? w : 1 - w);
  }
  return sum;
}

// Folds the bottom end onto the top: half a turn about z.
const fold = (x, y, z) => (y >= 0 ? [x, y, z] : [-x, -y, z]);

function candleShape(form, px, py, pz) {
  const rho = Math.sqrt(px * px + pz * pz);
  const theta = Math.atan2(pz, px);
  const body = (rho - profileRadius(form, py, theta)) / 1.15;

  const [x, y, z] = fold(px, py, pz);
  const qrho = Math.sqrt(x * x + z * z);
  const qtheta = Math.atan2(z, x);
  const { radius } = form;
  if (y < form.reachY) return body;

  const rimY = form.rimAt(qtheta);
  const wall = form.wallAt(qtheta);
  const outer = smax(body, y - rimY, wall * 0.45);
  const inner = profileRadius(form, y, qtheta) - wall;
  const dish = form.pool + radius * 0.06 * (qrho / Math.max(inner, 1e-3)) ** 2;
  const crater = smax(qrho - inner, dish - y, radius * 0.12);
  let d = smax(outer, -crater, wall * 0.5);

  for (let n = 0; n < form.sheets.length; n += 1) {
    const sheet = form.sheets[n];
    const dx = x - sheet.center[0];
    const dy = y - sheet.center[1];
    const dz = z - sheet.center[2];
    // A run of wax: an ellipsoid thick and wide where it left the rim,
    // thinning and narrowing toward its foot.
    const along = Math.max(-1, Math.min(1, dy / sheet.reach));
    const width = sheet.width * (0.8 + 0.3 * along);
    const thick = sheet.thickness * (0.7 + 0.4 * along);
    const u = (dx * sheet.tangent[0] + dz * sheet.tangent[2]) / width;
    const v = dy / sheet.reach;
    const w = (dx * sheet.normal[0] + dz * sheet.normal[2]) / thick;
    const k0 = Math.sqrt(u * u + v * v + w * w);
    const su = u / width;
    const sv = v / sheet.reach;
    const sw = w / thick;
    const k1 = Math.max(1e-5, Math.sqrt(su * su + sv * sv + sw * sw));
    d = smin(d, (k0 * (k0 - 1)) / k1, sheet.thickness * 2.5);
  }

  for (let n = 0; n < form.drips.length; n += 1) {
    const drip = form.drips[n];
    const { max, min } = drip.box;
    const ox = Math.max(min[0] - x, 0, x - max[0]);
    const oy = Math.max(min[1] - y, 0, y - max[1]);
    const oz = Math.max(min[2] - z, 0, z - max[2]);
    const reach = Math.abs(d) + drip.thickness;
    if (ox * ox + oy * oy + oz * oz <= reach * reach) {
      let best = Infinity;
      for (let s = 0; s < drip.points.length - 1; s += 1) {
        const c = capsule(x, y, z, drip.points[s], drip.points[s + 1]);
        if (c < best) best = c;
      }
      d = smin(d, best, drip.thickness * 0.55);
    }
  }
  return d;
}

// The widest the candle's body gets, for anything that bounds it with a
// cylinder (the flame's wax occlusion).
export function maxBodyRadius(form) {
  let widest = 0;
  for (let i = 0; i <= 32; i += 1) {
    const y = -form.half + (2 * form.half * i) / 32;
    for (let k = 0; k < 48; k += 1) {
      widest = Math.max(widest, profileRadius(form, y, (k / 48) * TAU));
    }
  }
  return widest;
}

// Where the flame burns, in candle space (the top end).
export function flameCentre(form) {
  const { tip } = form.wick;
  return [tip[0] * 0.5, tip[1] + 0.22, tip[2] * 0.5];
}

export function candleDistance(form, px, py, pz) {
  const d = candleShape(form, px, py, pz);
  if (!form.lumps || Math.abs(d) > form.lumps * 4) return d;
  // Plasticine: hand-pressed lumps, folded so both ends keep the symmetry.
  const [x, y, z] = fold(px, py, pz);
  const scale = 2.4 / form.radius;
  return (
    d +
    form.lumps *
      (noise3(x * scale, y * scale * 0.7, z * scale) +
        0.22 * noise3(x * scale * 2.6 + 7, y * scale * 2.6, z * scale * 2.6))
  );
}

// The wax as a mesh in candle space, plus per-vertex bakes the material
// reads: `glow` (flame light that would pass through the wax to reach this
// point, the subsurface look of a lit pillar's rim) and `pool` (the liquid
// pool in each crater).
export function buildWax(form) {
  const step = form.radius / form.config.waxDetail;
  const { radial, y } = form.extent;
  const sdf = (px, py, pz) => candleDistance(form, px, py, pz);
  const mesh = surfaceNets(sdf, {
    max: [radial, y, radial],
    min: [-radial, -y, -radial],
    step,
  });
  const count = mesh.position.length / 3;
  const glow = new Float32Array(count);
  const pool = new Float32Array(count);
  const flame = flameCentre(form);
  const depth = form.radius * 0.18;
  for (let v = 0; v < count; v += 1) {
    const [x, yv, z] = fold(
      mesh.position[v * 3],
      mesh.position[v * 3 + 1],
      mesh.position[v * 3 + 2]
    );
    const dx = flame[0] - x;
    const dy = flame[1] - yv;
    const dz = flame[2] - z;
    const dist = Math.hypot(dx, dy, dz);
    if (dist < form.radius * 4) {
      let inside = 0;
      const samples = 10;
      for (let s = 1; s <= samples; s += 1) {
        const t = (s - 0.5) / samples;
        if (sdf(x + dx * t, yv + dy * t, z + dz * t) < 0) inside += 1;
      }
      const thickness = (inside / samples) * dist;
      glow[v] =
        Math.exp(-thickness / depth) / (1 + (dist / (form.radius * 1.3)) ** 2);
    }
    const qrho = Math.hypot(x, z);
    const inner =
      profileRadius(form, yv, Math.atan2(z, x)) - form.wallAt(Math.atan2(z, x));
    pool[v] =
      clamp(1 - Math.abs(yv - form.pool) / (form.radius * 0.1), 0, 1) *
      clamp((inner - qrho) / (form.radius * 0.08), 0, 1);
  }
  return { ...mesh, glow, pool };
}
