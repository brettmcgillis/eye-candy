/* eslint-disable no-param-reassign */
import {
  alongDistance,
  createSpatialHash,
  isNeighbour,
  maxRadius,
} from './samples';

const ITERATIONS = 160;
const OVERSHOOT = 0.35;

// After retraction the only strands still closer in plan than their radii
// allow are real crossings: a four-way cell's second family passing under
// its first (Weave), or two strokes meeting square at a grid corner. Each
// crossing pair is pushed apart vertically — over up, under down by equal
// amounts, so the piece reads the same from either side — and the lift is
// diffused along its chains so the strands dip and rise rather than kink.
function crossingPairs(samples, { exempt, include, tolerance }) {
  const reach = maxRadius(samples) * 2;
  const query = createSpatialHash(samples, Math.max(reach, 1e-3));
  const { alive, radius, total, x, y } = samples;
  const pairs = [];
  for (let i = 0; i < total; i += 1) {
    if (alive[i]) {
      query(x[i], y[i], reach, (j) => {
        if (j <= i || isNeighbour(samples, i, j)) return;
        if (!include(i, j) || exempt(i, j)) return;
        const plan = Math.hypot(x[i] - x[j], y[i] - y[j]);
        if (plan < radius[i] + radius[j] - tolerance) pairs.push([i, j, plan]);
      });
    }
  }
  return pairs;
}

// Over/under follows the 2D occlusion in the cell the crossing sits in: the
// first-drawn family there is over. A strand passing through that cell from
// a neighbour borrows the slot its chain holds in it. Anything else is left
// open (null) and decided at each push by which strand is already higher,
// so it follows the resolved crossings around it instead of fighting them.
function overOf(samples, { cellAt, cellSlots, pieces }) {
  const slotIn = (i, cell) => {
    const p = samples.pieceOf[i];
    if (p >= 0 && pieces[p].cell === cell) return pieces[p].slot;
    return cellSlots[samples.chainOf[i]]?.get(cell);
  };
  return (i, j) => {
    const cell = cellAt(
      (samples.x[i] + samples.x[j]) / 2,
      (samples.y[i] + samples.y[j]) / 2
    );
    if (cell < 0) return null;
    const a = slotIn(i, cell);
    const b = slotIn(j, cell);
    return a != null && b != null && a !== b ? a < b : null;
  };
}

// One physical crossing touches many sample pairs, and near a grid corner
// their midpoints land in different cells — so pairs are grouped into
// clusters (the same two chains, contiguous along the first) and each
// cluster takes the majority order of its pairs, or stays open if none vote.
function orientClusters(samples, pairs, over) {
  const byChains = new Map();
  pairs.forEach((pair) => {
    const [i, j] = pair;
    const [a, b] = samples.chainOf[i] <= samples.chainOf[j] ? [i, j] : [j, i];
    const key = `${samples.chainOf[a]}:${samples.chainOf[b]}`;
    if (!byChains.has(key)) byChains.set(key, []);
    byChains.get(key).push([a, b, pair[2]]);
  });
  const out = [];
  byChains.forEach((group) => {
    group.sort((p, q) => samples.s[p[0]] - samples.s[q[0]]);
    let cluster = [];
    const flush = () => {
      const votes = cluster.reduce((sum, [a, b]) => {
        const order = over(a, b);
        if (order == null) return sum;
        return sum + (order ? 1 : -1);
      }, 0);
      cluster.forEach(([a, b, plan]) => {
        if (votes < 0) out.push([b, a, plan, true]);
        else out.push([a, b, plan, votes > 0]);
      });
      cluster = [];
    };
    group.forEach((pair) => {
      const last = cluster[cluster.length - 1];
      const reach = (samples.radius[pair[0]] + samples.radius[pair[1]]) * 2;
      if (last && alongDistance(samples, last[0], pair[0]) > reach) flush();
      cluster.push(pair);
    });
    flush();
  });
  return out;
}

function smoothLift(samples, lift, active, passes, keep) {
  const { runs } = samples;
  const next = Float64Array.from(lift);
  for (let pass = 0; pass < passes; pass += 1) {
    active.forEach((c) => {
      const { head, loop, tail } = runs[c];
      for (let i = head; i <= tail; i += 1) {
        const wrapPrev = loop ? tail : i;
        const wrapNext = loop ? head : i;
        const prev = i > head ? i - 1 : wrapPrev;
        const after = i < tail ? i + 1 : wrapNext;
        const mean = (lift[prev] + lift[after]) / 2;
        next[i] = lift[i] * keep + mean * (1 - keep);
      }
    });
    active.forEach((c) => {
      const { head, tail } = runs[c];
      for (let i = head; i <= tail; i += 1) lift[i] = next[i];
    });
  }
}

// `include` picks which pairs this pass resolves and `movable` which
// strands it may move: lanes are solved first, then strokes are fitted to
// them with the lanes pinned. A crossing's clearance is elliptical — plan
// half-widths across, half-heights up — since a tapered end is narrower
// than it is tall.
export default function liftCrossings(samples, context) {
  const {
    exempt,
    include = () => true,
    margin,
    movable = () => true,
    rampSamples,
    tolerance,
  } = context;
  const pairs = crossingPairs(samples, { exempt, include, tolerance });
  const lift = new Float64Array(samples.total);
  if (pairs.length === 0) return { crossings: 0, lift };

  const oriented = orientClusters(samples, pairs, overOf(samples, context)).map(
    ([i, j, plan, fixed]) => {
      const across = samples.radius[i] + samples.radius[j];
      const up = samples.height[i] + samples.height[j];
      const need =
        up * Math.sqrt(Math.max(0, 1 - (plan / across) ** 2)) + margin;
      return [i, j, need, fixed];
    }
  );
  const active = [
    ...new Set(
      pairs.flatMap(([i, j]) =>
        [i, j].filter(movable).map((k) => samples.chainOf[k])
      )
    ),
  ];
  const { z } = samples;

  const push = (extra) => {
    let worst = 0;
    oriented.forEach((pair) => {
      const [i, j, need, fixed] = pair;
      const flip = !fixed && z[j] + lift[j] > z[i] + lift[i];
      const a = flip ? j : i;
      const b = flip ? i : j;
      const gap = z[a] + lift[a] - (z[b] + lift[b]);
      const want = need * (1 + extra);
      if (gap < want) {
        const moveA = movable(a);
        const moveB = movable(b);
        if (!moveA && !moveB) return;
        const share = moveA && moveB ? 0.5 : 1;
        if (moveA) lift[a] += (want - gap) * share;
        if (moveB) lift[b] -= (want - gap) * share;
        worst = Math.max(worst, need - gap);
      }
    });
    return worst;
  };

  // Annealed: early pushes overshoot and smoothing is strong, so the lift
  // settles into broad bumps; both taper off, so the last pushes only make
  // small corrections and never leave a kink.
  const passes = Math.max(
    1,
    Math.ceil((rampSamples * rampSamples * 2) / ITERATIONS)
  );
  for (let it = 0; it < ITERATIONS; it += 1) {
    const cool = 1 - it / ITERATIONS;
    push(OVERSHOOT * cool);
    smoothLift(samples, lift, active, passes, 1 - 0.5 * cool * cool);
  }
  for (let it = 0; it < 4000 && push(0) > 1e-9; it += 1);
  return { crossings: pairs.length, lift };
}
