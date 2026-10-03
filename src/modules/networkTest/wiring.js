import { createRng } from '@modules/flora';

import createKdTree from './kdTree';
import { hashUnit } from './noise';
import { RULES } from './renderOptions.mjs';

const CANDIDATES = 16;
const BAND_CANDIDATES = 24;
const CHAIN_REACH = 8;

const RULE_KEYS = {
  band: 'ruleBand',
  bridge: 'ruleBridge',
  chain: 'ruleChain',
  gabriel: 'ruleGabriel',
  knn: 'ruleKnn',
  mst: 'ruleMst',
  rng: 'ruleRng',
};

function createUnionFind(n) {
  const parent = Int32Array.from({ length: n }, (_, i) => i);
  const find = (i) => {
    let root = i;
    while (parent[root] !== root) root = parent[root];
    let at = i;
    while (parent[at] !== root) {
      const next = parent[at];
      parent[at] = root;
      at = next;
    }
    return root;
  };
  return {
    find,
    union(a, b) {
      const ra = find(a);
      const rb = find(b);
      if (ra === rb) return false;
      parent[ra] = rb;
      return true;
    },
  };
}

function spacingOf(positions, count) {
  let volume = 1;
  for (let a = 0; a < 3; a += 1) {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < count; i += 1) {
      lo = Math.min(lo, positions[i * 3 + a]);
      hi = Math.max(hi, positions[i * 3 + a]);
    }
    volume *= Math.max(hi - lo, 0.05);
  }
  return Math.cbrt(volume / Math.max(count, 1));
}

// Links between placements: first along a spanning tree of their centroids
// so every placement is reached, then round the remaining pairs nearest
// first. Each link runs from a random point to its nearest in the other.
function addBridges({ add, config, count, dist2, group, positions, seed }) {
  const members = new Map();
  for (let i = 0; i < count; i += 1) {
    if (!members.has(group[i])) members.set(group[i], []);
    members.get(group[i]).push(i);
  }
  const groups = [...members.keys()].sort((a, b) => a - b);
  if (groups.length < 2) return;

  const centroid = (list) =>
    [0, 1, 2].map(
      (a) =>
        list.reduce((sum, i) => sum + positions[i * 3 + a], 0) / list.length
    );
  const centers = groups.map((g) => centroid(members.get(g)));
  const apart = (x, y) =>
    Math.hypot(...centers[x].map((v, a) => v - centers[y][a]));

  const inTree = new Set([0]);
  const pairs = [];
  while (inTree.size < groups.length) {
    let best = null;
    inTree.forEach((x) => {
      groups.forEach((_, y) => {
        if (!inTree.has(y) && (!best || apart(x, y) < best[2])) {
          best = [x, y, apart(x, y)];
        }
      });
    });
    inTree.add(best[1]);
    pairs.push(best);
  }
  const rest = [];
  groups.forEach((_, x) =>
    groups.forEach((__, y) => {
      if (
        x < y &&
        !pairs.some(([p, q]) => (p === x && q === y) || (p === y && q === x))
      ) {
        rest.push([x, y, apart(x, y)]);
      }
    })
  );
  rest.sort((p, q) => p[2] - q[2]);
  const order = [...pairs, ...rest];

  const rng = createRng(`bridges:${seed}`);
  const total = Math.round(config.bridgeCount);
  for (let n = 0; n < total; n += 1) {
    const [x, y] = order[n % order.length];
    const from = members.get(groups[x]);
    const to = members.get(groups[y]);
    const a = from[Math.floor(rng() * from.length)];
    let b = to[0];
    let best = Infinity;
    to.forEach((j) => {
      const d2 = dist2(a, j);
      if (d2 < best) {
        best = d2;
        b = j;
      }
    });
    add(a, b, 'bridge', { capped: false });
  }
}

// Every rule proposes its own edge set; a rule's weight is the share of its
// edges kept (a stable die per edge), so weights blend rules and zeroing all
// but one solos it. `maxDegree` caps every rule but bridges, which exist to
// join what the others leave apart.
export default function buildEdges(points, config) {
  const { chain, count, group, positions } = points;
  const edges = [];
  const degree = new Uint16Array(count);
  if (count < 2) return { degree, edges, spacing: 1 };

  const seed = Math.round(config.wireSeed);
  const spacing = spacingOf(positions, count);
  const hash = createKdTree(positions);
  const k = Math.min(CANDIDATES, count - 1);
  const neighbors = Array.from({ length: count }, (_, i) => hash.nearest(i, k));
  const taken = new Set();
  const dist2 = (a, b) => {
    const dx = positions[a * 3] - positions[b * 3];
    const dy = positions[a * 3 + 1] - positions[b * 3 + 1];
    const dz = positions[a * 3 + 2] - positions[b * 3 + 2];
    return dx * dx + dy * dy + dz * dz;
  };

  function add(a, b, rule, { capped = true } = {}) {
    if (a === b) return false;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const key = lo * count + hi;
    if (taken.has(key)) return false;
    const weight = config[RULE_KEYS[rule]];
    if (
      !(weight >= 1 || hashUnit(seed, lo, hi, RULES.indexOf(rule)) < weight)
    ) {
      return false;
    }
    if (
      capped &&
      (degree[a] >= config.maxDegree || degree[b] >= config.maxDegree)
    ) {
      return false;
    }
    taken.add(key);
    degree[a] += 1;
    degree[b] += 1;
    edges.push({ a: lo, b: hi, length: Math.sqrt(dist2(lo, hi)), rule });
    return true;
  }

  const candidates = [];
  const proposed = new Set();
  neighbors.forEach((list, i) =>
    list.forEach(([j, d2]) => {
      const key = Math.min(i, j) * count + Math.max(i, j);
      if (!proposed.has(key)) {
        proposed.add(key);
        candidates.push([Math.min(i, j), Math.max(i, j), d2]);
      }
    })
  );
  candidates.sort((x, y) => x[2] - y[2]);

  const active = (rule) => config[RULE_KEYS[rule]] > 0;

  if (active('chain')) {
    const nearest = neighbors.map((list) => list[0]?.[1] ?? 0);
    const typical = nearest.reduce((sum, d2) => sum + Math.sqrt(d2), 0) / count;
    const reach2 = (typical * CHAIN_REACH) ** 2;
    for (let i = 1; i < count; i += 1) {
      if (
        chain[i] >= 0 &&
        chain[i] === chain[i - 1] &&
        dist2(i, i - 1) < reach2
      ) {
        add(i - 1, i, 'chain');
      }
    }
  }

  if (active('mst')) {
    const sets = createUnionFind(count);
    candidates.forEach(([a, b]) => {
      if (sets.union(a, b)) add(a, b, 'mst');
    });
  }

  const blocked = (a, b, d2, test) => {
    const near = [...neighbors[a], ...neighbors[b]];
    for (let n = 0; n < near.length; n += 1) {
      const r = near[n][0];
      if (r !== a && r !== b && test(dist2(a, r), dist2(b, r), d2)) return true;
    }
    return false;
  };

  if (active('rng')) {
    candidates.forEach(([a, b, d2]) => {
      if (!blocked(a, b, d2, (ar, br, ab) => Math.max(ar, br) < ab)) {
        add(a, b, 'rng');
      }
    });
  }

  if (active('gabriel')) {
    candidates.forEach(([a, b, d2]) => {
      if (!blocked(a, b, d2, (ar, br, ab) => ar + br < ab)) {
        add(a, b, 'gabriel');
      }
    });
  }

  if (active('knn')) {
    neighbors.forEach((list, i) =>
      list.slice(0, config.knnK).forEach(([j]) => add(i, j, 'knn'))
    );
  }

  if (active('band') && config.bandMax > config.bandMin) {
    const pairs = [];
    for (let i = 0; i < count; i += 1) {
      hash
        .within(
          positions[i * 3],
          positions[i * 3 + 1],
          positions[i * 3 + 2],
          config.bandMax,
          i
        )
        .slice(0, BAND_CANDIDATES)
        .forEach(([j, d2]) => {
          if (i < j && d2 >= config.bandMin * config.bandMin) {
            pairs.push([i, j, d2]);
          }
        });
    }
    pairs.sort((x, y) => x[2] - y[2]);
    const bandDegree = new Uint16Array(count);
    const chosen = [];
    const picked = new Uint8Array(pairs.length);
    const pass = (wants) =>
      pairs.forEach((pair, index) => {
        const [a, b] = pair;
        if (
          !picked[index] &&
          bandDegree[a] < config.bandMaxDegree &&
          bandDegree[b] < config.bandMaxDegree &&
          wants(a, b)
        ) {
          picked[index] = 1;
          bandDegree[a] += 1;
          bandDegree[b] += 1;
          chosen.push(pair);
        }
      });
    pass(
      (a, b) =>
        bandDegree[a] < config.bandMinDegree ||
        bandDegree[b] < config.bandMinDegree
    );
    pass(() => true);
    chosen.forEach(([a, b]) => add(a, b, 'band'));
  }

  if (active('bridge') && config.bridgeCount > 0) {
    addBridges({ add, config, count, dist2, group, positions, seed });
  }

  return { degree, edges, spacing };
}
