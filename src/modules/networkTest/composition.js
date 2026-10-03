import { createRng } from '@modules/flora';

import { GENERATORS, NO_CHAIN } from './generators';
import { imagePoints, prepareImage } from './image';
import createKdTree from './kdTree';
import { createNoise } from './noise';
import { FAMILIES, FAMILY_KINDS, MAX_POINTS } from './renderOptions.mjs';

const FAMILY_WEIGHT_KEYS = {
  attractor: 'weightAttractor',
  cluster: 'weightCluster',
  noise: 'weightNoise',
  primitive: 'weightPrimitive',
};
const CHAIN_STRIDE = 4096;

function weighted(rng, entries) {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  if (total <= 0) return entries[0][0];
  let roll = rng() * total;
  for (let i = 0; i < entries.length; i += 1) {
    roll -= entries[i][1];
    if (roll <= 0) return entries[i][0];
  }
  return entries[entries.length - 1][0];
}

function randomRotation(rng) {
  const [u1, u2, u3] = [rng(), rng(), rng()];
  const a = Math.sqrt(1 - u1);
  const b = Math.sqrt(u1);
  const [x, y, z, w] = [
    a * Math.sin(2 * Math.PI * u2),
    a * Math.cos(2 * Math.PI * u2),
    b * Math.sin(2 * Math.PI * u3),
    b * Math.cos(2 * Math.PI * u3),
  ];
  return [
    [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)],
    [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)],
    [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)],
  ];
}

const rotate = (m, p) =>
  m.map((row) => row[0] * p[0] + row[1] * p[1] + row[2] * p[2]);

// The composition: `shapeCount` placements, each a generator drawn by family
// weight, scaled, turned and set in the domain, plus `imageShare` of the
// budget scattered over a source image when there is one; then one domain
// warp over every point and a Poisson thinning. Positions are flat xyz;
// `rgb` holds a source colour per image point and -1 elsewhere.
export default function buildPoints(config, { image = null } = {}) {
  const rng = createRng(`points:${config.pointSeed}`);
  const noise = createNoise(config.pointSeed);
  const domain = [config.domainX, config.domainY, config.domainZ];
  const unit = Math.min(...domain);
  const families = FAMILIES.map((family) => [
    family,
    Math.max(config[FAMILY_WEIGHT_KEYS[family]], 0),
  ]);
  const count = Math.max(1, Math.round(config.shapeCount));

  const placements = Array.from({ length: count }, (_, index) => {
    const family = weighted(rng, families);
    const pinned = config[`${family}Kind`];
    const kinds = FAMILY_KINDS[family];
    const kind =
      pinned && pinned !== 'any'
        ? pinned
        : kinds[Math.floor(rng() * kinds.length)];
    const center =
      count === 1
        ? [0, 0, 0]
        : domain.map((h) => (rng() * 2 - 1) * h * config.spread);
    const scale =
      config.shapeScale *
      unit *
      (1 + config.scaleJitter * (rng() * 2 - 1) * 0.8);
    return {
      center,
      family,
      index,
      kind,
      rotation: randomRotation(rng),
      scale: Math.max(scale, unit * 0.05),
      share: 0.5 + rng(),
    };
  });

  const imageShare = image ? Math.min(Math.max(config.imageShare, 0), 1) : 0;
  const generated = config.pointCount * (1 - imageShare);
  const shareTotal = placements.reduce((sum, p) => sum + p.share, 0);
  const raw = [];
  placements.forEach((placement) => {
    if (generated < 1) return;
    const budget = Math.max(
      8,
      Math.round((generated * placement.share) / shareTotal)
    );
    const local = GENERATORS[placement.family][placement.kind](
      rng.fork(`gen-${placement.index}`),
      budget,
      noise
    );
    const jitter = rng.fork(`jitter-${placement.index}`);
    local.points.forEach((p, i) => {
      const turned = rotate(placement.rotation, p);
      raw.push({
        chain:
          local.chains[i] === NO_CHAIN
            ? NO_CHAIN
            : placement.index * CHAIN_STRIDE + local.chains[i],
        group: placement.index,
        p: turned.map(
          (v, a) =>
            placement.center[a] +
            v * placement.scale +
            jitter.gauss() * config.surfaceJitter * placement.scale
        ),
      });
    });
  });

  if (imageShare > 0) {
    const field = prepareImage(image);
    if (generated < 1) placements.length = 0;
    const index = placements.length;
    const scattered = imagePoints(
      field,
      config,
      Math.round(config.pointCount * imageShare)
    );
    const jitter = rng.fork('jitter-image');
    const thickness = config.surfaceJitter * scattered.halfH;
    placements.push({
      center: [0, 0, 0],
      family: 'image',
      index,
      kind: 'source',
      scale: scattered.halfH,
      share: imageShare,
    });
    scattered.points.forEach((p, i) =>
      raw.push({
        chain: NO_CHAIN,
        group: index,
        p: p.map((v) => v + jitter.gauss() * thickness),
        rgb: scattered.colors[i],
      })
    );
  }

  const amount = config.warpAmount * unit;
  const s = config.warpScale / unit;
  const warped =
    amount > 0
      ? raw.map((item) => {
          const d = noise.vector(
            item.p[0] * s + 11.7,
            item.p[1] * s - 3.1,
            item.p[2] * s + 7.3
          );
          return { ...item, p: item.p.map((v, a) => v + d[a] * amount) };
        })
      : raw;

  let kept = warped;
  if (config.minSpacing > 0 && warped.length > 1) {
    const flat = new Float32Array(warped.length * 3);
    warped.forEach((item, i) => flat.set(item.p, i * 3));
    const hash = createKdTree(flat);
    const taken = new Uint8Array(warped.length);
    kept = warped.filter((item, i) => {
      const near = hash.within(...item.p, config.minSpacing, i);
      if (near.some(([j]) => taken[j])) return false;
      taken[i] = 1;
      return true;
    });
  }
  kept = kept.slice(0, MAX_POINTS);

  const positions = new Float32Array(kept.length * 3);
  const group = new Int16Array(kept.length);
  const chain = new Int32Array(kept.length);
  const rgb = new Float32Array(kept.length * 3).fill(-1);
  kept.forEach((item, i) => {
    positions.set(item.p, i * 3);
    group[i] = item.group;
    chain[i] = item.chain;
    if (item.rgb) rgb.set(item.rgb, i * 3);
  });

  return { chain, count: kept.length, group, placements, positions, rgb };
}

export function boundsOf(positions, pad = 0) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let a = 0; a < 3; a += 1) {
      min[a] = Math.min(min[a], positions[i + a]);
      max[a] = Math.max(max[a], positions[i + a]);
    }
  }
  if (!Number.isFinite(min[0])) return { max: [1, 1, 1], min: [-1, -1, -1] };
  return { max: max.map((v) => v + pad), min: min.map((v) => v - pad) };
}
