import { createRng } from '@modules/flora';

import { inFootprint, weatherRecord } from './parts';
import { MAX_TREES, VIEW_AZIMUTHS } from './renderOptions.mjs';
import { ledgePoints } from './structure';
import { footRadius, groundAt } from './terrain';

// An old access road runs out from the structure along the approach view's
// bearing, so the eye-level camera stands on it rather than in the trees.
export const ROAD_BEARING = VIEW_AZIMUTHS.approach;
export const ROAD_WIDTH = 9;

export function roadDistance(x, z) {
  const b = (ROAD_BEARING * Math.PI) / 180;
  const along = x * Math.cos(b) + z * Math.sin(b);
  return along > 0 ? Math.abs(-x * Math.sin(b) + z * Math.cos(b)) : Infinity;
}

// Tree kinds the renderer turns into templates, weighted per biome. The
// kernel only names them.
export const TREE_KINDS = [
  'pine',
  'spruce',
  'oak',
  'ash',
  'aspen',
  'dead',
  'bush',
];
const BIOMES = {
  bare: { ash: 1, dead: 4 },
  conifer: { bush: 0.6, dead: 0.4, pine: 3, spruce: 3 },
  deciduous: { ash: 2, aspen: 2, bush: 1, dead: 0.4, oak: 2 },
  mixed: { ash: 1, aspen: 1, bush: 0.8, dead: 0.8, oak: 1, pine: 2, spruce: 2 },
};
const SAPLING_KINDS = {
  bare: 'dead',
  conifer: 'spruce',
  deciduous: 'bush',
  mixed: 'bush',
};

function weighted(rng, table) {
  const entries = Object.entries(table);
  let roll = rng() * entries.reduce((sum, [, w]) => sum + w, 0);
  for (let i = 0; i < entries.length; i += 1) {
    roll -= entries[i][1];
    if (roll <= 0) return entries[i][0];
  }
  return entries[entries.length - 1][0];
}

// Parts that stand on the ground, with a bounding radius for a cheap
// reject before the exact footprint test.
function groundParts(structure) {
  return structure.parts
    .filter((part) => {
      const [, bottom] = weatherRecord(part);
      return bottom < structure.ground + 6 && part.role !== 'spout';
    })
    .map((part) => {
      const reach =
        part.kind === 'prism'
          ? Math.max(...part.profile.map(([x, y]) => Math.hypot(x, y)))
          : Math.hypot(part.half[0], part.half[2]);
      return { part, radius: reach + part.half[2] };
    });
}

function blocked(standing, x, z, margin) {
  return standing.some(
    ({ part, radius }) =>
      Math.hypot(x - part.center[0], z - part.center[2]) < radius + margin &&
      inFootprint(part, x, z, margin)
  );
}

// Every tree, sapling and its pose. Still: no wind ever moves them, so a
// lean is part of the pose. Trees crowd the clearing's edge and thin out
// with distance, where the haze has them anyway.
export default function scatterTrees(config, structure) {
  const rng = createRng(`brutalist:site:${config.siteSeed}`);
  const foot = footRadius(structure);
  const standing = groundParts(structure);
  const clearing = config.clearing * (1 - config.encroach * 0.85);
  const inner = foot * 0.6;
  const outer = Math.max(config.forestRadius, foot + clearing + 40);
  const spacing = (config.treeHeight * 0.32) / (0.35 + config.treeDensity);
  const area = Math.PI * (outer * outer - inner * inner);
  const target = Math.min(
    MAX_TREES,
    Math.round((area / spacing ** 2) * config.treeDensity * 0.55)
  );
  const cell = spacing * 0.75;
  const grid = new Map();
  const keyOf = (x, z) => `${Math.floor(x / cell)},${Math.floor(z / cell)}`;
  const crowded = (x, z) => {
    const cx = Math.floor(x / cell);
    const cz = Math.floor(z / cell);
    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dz = -1; dz <= 1; dz += 1) {
        const other = grid.get(`${cx + dx},${cz + dz}`);
        if (other && Math.hypot(other[0] - x, other[1] - z) < cell) return true;
      }
    }
    return false;
  };

  // One dart: a tree, or null when it lands somewhere a tree cannot stand.
  function dart() {
    const r = inner + (outer - inner) * rng() ** 1.7;
    const a = rng() * Math.PI * 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (crowded(x, z)) return null;
    const kind = weighted(rng, BIOMES[config.biome] ?? BIOMES.conifer);
    const grown = kind === 'bush' ? rng.range(0.15, 0.3) : rng.range(0.7, 1.3);
    const young = blocked(standing, x, z, clearing);
    const scale =
      config.treeHeight * grown * (young ? rng.range(0.25, 0.6) : 1);
    const onRoad = roadDistance(x, z) < ROAD_WIDTH / 2 + scale * 0.22;
    if (onRoad && !rng.chance(config.encroach * 0.1)) return null;
    if (young && !rng.chance(config.encroach * 0.5)) return null;
    if (blocked(standing, x, z, 1.5)) return null;
    grid.set(keyOf(x, z), [x, z]);
    return {
      kind,
      lean: rng.gauss() * 0.04,
      leanYaw: rng() * Math.PI * 2,
      scale,
      x,
      y: groundAt(x, z, config, foot) - 0.3,
      yaw: rng() * Math.PI * 2,
      z,
    };
  }

  const trees = [];
  for (
    let attempt = 0;
    attempt < target * 6 && trees.length < target;
    attempt += 1
  ) {
    const tree = dart();
    if (tree) trees.push(tree);
  }

  const saplings = ledgePoints(
    structure,
    rng.fork('ledges'),
    Math.round(config.encroach * 48)
  ).map(({ x, y, z }) => ({
    kind: SAPLING_KINDS[config.biome] ?? 'bush',
    lean: rng.gauss() * 0.08,
    leanYaw: rng() * Math.PI * 2,
    scale: config.treeHeight * rng.range(0.06, 0.22),
    x,
    y: y - 0.1,
    yaw: rng() * Math.PI * 2,
    z,
  }));

  return { foot, saplings, trees };
}
