// Every chain (and bead) flattened into one set of typed arrays, so the
// height solve, the retraction and the separation check can walk them
// without per-sample objects. A chain owns the contiguous run
// [start, start + count); a bead is a one-sample chain that never moves.
export default function flattenSamples({ beads, chains }, radiusOf) {
  const total =
    chains.reduce((sum, chain) => sum + chain.samples.length, 0) + beads.length;
  const x = new Float64Array(total);
  const y = new Float64Array(total);
  const s = new Float64Array(total);
  const u = new Float32Array(total);
  const radius = new Float32Array(total);
  const chainOf = new Int32Array(total);
  const pieceOf = new Int32Array(total).fill(-1);
  const alive = new Uint8Array(total).fill(1);
  const runs = [];

  let at = 0;
  chains.forEach((chain, c) => {
    const R = radiusOf(chain.kind);
    const start = at;
    let length = 0;
    chain.samples.forEach((sample, i) => {
      if (i > 0) {
        const prev = chain.samples[i - 1];
        length += Math.hypot(sample.x - prev.x, sample.y - prev.y);
      }
      x[at] = sample.x;
      y[at] = sample.y;
      s[at] = length;
      u[at] = sample.u;
      radius[at] = R;
      chainOf[at] = c;
      pieceOf[at] = sample.piece;
      at += 1;
    });
    if (chain.loop && chain.samples.length > 1) {
      const first = chain.samples[0];
      const last = chain.samples[chain.samples.length - 1];
      length += Math.hypot(first.x - last.x, first.y - last.y);
    }
    runs.push({
      count: chain.samples.length,
      ends: chain.ends,
      kind: chain.kind,
      length,
      loop: chain.loop,
      start,
    });
  });

  beads.forEach((bead) => {
    [x[at], y[at]] = bead.at;
    u[at] = 0.5;
    radius[at] = radiusOf('lane');
    chainOf[at] = runs.length;
    runs.push({
      bead,
      count: 1,
      ends: null,
      kind: 'bead',
      length: 0,
      loop: false,
      start: at,
    });
    at += 1;
  });

  return {
    alive,
    chainOf,
    // A tube's half-height never changes; `radius` is its plan half-width,
    // which tapers where an end narrows into a junction.
    height: Float32Array.from(radius),
    pieceOf,
    radius,
    runs,
    s,
    total,
    u,
    x,
    y,
    z: new Float64Array(total),
  };
}

// Arc distance between two samples of one chain, round the loop if closed.
export function alongDistance(samples, i, j) {
  const d = Math.abs(samples.s[i] - samples.s[j]);
  const run = samples.runs[samples.chainOf[i]];
  return run.loop ? Math.min(d, run.length - d) : d;
}

// Two samples whose tubes may touch without that being a collision: the
// same chain, close enough along it that a tube of this radius bends between
// them. A chain's curvature radius never falls below its tube radius, so
// beyond π·R along the chain the chord already clears 2R.
export function isNeighbour(samples, i, j) {
  if (samples.chainOf[i] !== samples.chainOf[j]) return false;
  return alongDistance(samples, i, j) < Math.PI * samples.radius[i] * 1.001;
}

export function createSpatialHash(samples, cellSize) {
  const buckets = new Map();
  const keyOf = (cx, cy) => (cx + 512) * 4096 + (cy + 512);
  for (let i = 0; i < samples.total; i += 1) {
    if (samples.alive[i]) {
      const key = keyOf(
        Math.floor(samples.x[i] / cellSize),
        Math.floor(samples.y[i] / cellSize)
      );
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(i);
    }
  }
  return (px, py, reach, visit) => {
    const x0 = Math.floor((px - reach) / cellSize);
    const x1 = Math.floor((px + reach) / cellSize);
    const y0 = Math.floor((py - reach) / cellSize);
    const y1 = Math.floor((py + reach) / cellSize);
    for (let cx = x0; cx <= x1; cx += 1) {
      for (let cy = y0; cy <= y1; cy += 1) {
        const bucket = buckets.get(keyOf(cx, cy));
        if (bucket) {
          for (let k = 0; k < bucket.length; k += 1) {
            if (samples.alive[bucket[k]]) visit(bucket[k]);
          }
        }
      }
    }
  };
}

export function maxRadius(samples) {
  let max = 0;
  for (let i = 0; i < samples.total; i += 1) {
    max = Math.max(max, samples.radius[i]);
  }
  return max;
}
