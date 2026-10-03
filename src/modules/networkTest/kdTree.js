/* eslint-disable no-bitwise */
// A static k-d tree over flat xyz positions: the tree is the index array
// itself, each range split at its median on its widest axis.
export default function createKdTree(positions) {
  const count = positions.length / 3;
  const order = Int32Array.from({ length: count }, (_, i) => i);
  const axes = new Uint8Array(count);

  function build(lo, hi) {
    if (hi - lo <= 1) return;
    const span = [0, 1, 2].map((a) => {
      let min = Infinity;
      let max = -Infinity;
      for (let i = lo; i < hi; i += 1) {
        const v = positions[order[i] * 3 + a];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      return max - min;
    });
    const axis = span.indexOf(Math.max(...span));
    const slice = Array.from(order.subarray(lo, hi)).sort(
      (a, b) => positions[a * 3 + axis] - positions[b * 3 + axis]
    );
    order.set(slice, lo);
    const mid = (lo + hi) >> 1;
    axes[mid] = axis;
    build(lo, mid);
    build(mid + 1, hi);
  }
  build(0, count);

  const dist2 = (i, x, y, z) => {
    const dx = positions[i * 3] - x;
    const dy = positions[i * 3 + 1] - y;
    const dz = positions[i * 3 + 2] - z;
    return dx * dx + dy * dy + dz * dz;
  };

  // Indices within `radius` of xyz (skipping `skip`), nearest first.
  function within(x, y, z, radius, skip = -1) {
    const r2 = radius * radius;
    const q = [x, y, z];
    const found = [];
    const visit = (lo, hi) => {
      if (hi <= lo) return;
      const mid = (lo + hi) >> 1;
      const i = order[mid];
      const d2 = dist2(i, x, y, z);
      if (d2 <= r2 && i !== skip) found.push([i, d2]);
      const axis = axes[mid];
      const delta = q[axis] - positions[i * 3 + axis];
      if (delta <= radius) visit(lo, mid);
      if (delta >= -radius) visit(mid + 1, hi);
    };
    visit(0, count);
    return found.sort((a, b) => a[1] - b[1]);
  }

  const bestIndex = new Int32Array(64);
  const bestDist = new Float64Array(64);
  let size = 0;
  let limit = 0;
  const query = new Float64Array(3);
  let self = -1;

  function offer(j, d2) {
    if (size === limit && d2 >= bestDist[size - 1]) return;
    let at = size === limit ? size - 1 : size;
    while (at > 0 && bestDist[at - 1] > d2) {
      bestDist[at] = bestDist[at - 1];
      bestIndex[at] = bestIndex[at - 1];
      at -= 1;
    }
    bestDist[at] = d2;
    bestIndex[at] = j;
    if (size < limit) size += 1;
  }

  function search(lo, hi) {
    if (hi <= lo) return;
    const mid = (lo + hi) >> 1;
    const j = order[mid];
    if (j !== self) offer(j, dist2(j, query[0], query[1], query[2]));
    const axis = axes[mid];
    const delta = query[axis] - positions[j * 3 + axis];
    if (delta < 0) {
      search(lo, mid);
      if (size < limit || delta * delta < bestDist[size - 1])
        search(mid + 1, hi);
    } else {
      search(mid + 1, hi);
      if (size < limit || delta * delta < bestDist[size - 1]) search(lo, mid);
    }
  }

  // The k nearest other points to point `i`, nearest first.
  function nearest(i, k) {
    limit = Math.min(k, count - 1, bestIndex.length);
    if (limit <= 0) return [];
    size = 0;
    self = i;
    query[0] = positions[i * 3];
    query[1] = positions[i * 3 + 1];
    query[2] = positions[i * 3 + 2];
    search(0, count);
    const out = new Array(size);
    for (let n = 0; n < size; n += 1) out[n] = [bestIndex[n], bestDist[n]];
    return out;
  }

  // The point nearest an arbitrary xyz, or -1 for an empty tree.
  function closest(x, y, z) {
    if (count === 0) return -1;
    limit = 1;
    size = 0;
    self = -1;
    query[0] = x;
    query[1] = y;
    query[2] = z;
    search(0, count);
    return size > 0 ? bestIndex[0] : -1;
  }

  return { closest, nearest, within };
}
