/* eslint-disable no-bitwise */
// Adaptive midpoint subdivision: any triangle with an edge longer than
// `maxEdge` becomes four, repeatedly, so a mesh decimated unevenly (big flat
// triangles on a dome, dense detail on a face) ends up with a roughly uniform
// vertex spacing. `parents` holds each new vertex's edge ends, in order.
// Midpoints are cached in an open-addressed table of typed arrays; a Map keyed
// by edge was the slow step at a million vertices.
export default function subdivide(
  { positions, triangles },
  maxEdge,
  passes = 5
) {
  let capacity = positions.length * 8;
  let out = new Float64Array(capacity);
  out.set(positions);
  let vertexCount = positions.length / 3;
  let parents = new Int32Array((capacity / 3) * 2);
  let parentCount = 0;

  const slots = 1 << 23;
  const keys = new Float64Array(slots).fill(-1);
  const values = new Int32Array(slots);

  const grow = () => {
    capacity *= 2;
    const next = new Float64Array(capacity);
    next.set(out);
    out = next;
    const nextParents = new Int32Array((capacity / 3) * 2);
    nextParents.set(parents);
    parents = nextParents;
  };

  const midpoint = (a, b) => {
    const key = a < b ? a * 4294967296 + b : b * 4294967296 + a;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    let slot =
      (Math.imul(lo, 73856093) ^ Math.imul(hi, 19349663)) & (slots - 1);
    while (keys[slot] !== -1 && keys[slot] !== key) {
      slot = (slot + 1) & (slots - 1);
    }
    if (keys[slot] === key) return values[slot];
    if ((vertexCount + 1) * 3 > capacity) grow();
    const m = vertexCount;
    for (let k = 0; k < 3; k += 1) {
      out[m * 3 + k] = (out[a * 3 + k] + out[b * 3 + k]) / 2;
    }
    parents[parentCount] = a;
    parents[parentCount + 1] = b;
    parentCount += 2;
    vertexCount += 1;
    keys[slot] = key;
    values[slot] = m;
    return m;
  };
  const tooLong = (a, b) => {
    const dx = out[a * 3] - out[b * 3];
    const dy = out[a * 3 + 1] - out[b * 3 + 1];
    const dz = out[a * 3 + 2] - out[b * 3 + 2];
    return dx * dx + dy * dy + dz * dz > maxEdge * maxEdge;
  };

  let current = Int32Array.from(triangles);
  for (let pass = 0; pass < passes; pass += 1) {
    let split = 0;
    for (let t = 0; t < current.length; t += 3) {
      const [a, b, c] = [current[t], current[t + 1], current[t + 2]];
      if (tooLong(a, b) || tooLong(b, c) || tooLong(c, a)) split += 1;
    }
    if (split === 0) break;
    const next = new Int32Array(current.length + split * 9);
    let w = 0;
    for (let t = 0; t < current.length; t += 3) {
      const [a, b, c] = [current[t], current[t + 1], current[t + 2]];
      if (tooLong(a, b) || tooLong(b, c) || tooLong(c, a)) {
        const ab = midpoint(a, b);
        const bc = midpoint(b, c);
        const ca = midpoint(c, a);
        next.set([a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca], w);
        w += 12;
      } else {
        next[w] = a;
        next[w + 1] = b;
        next[w + 2] = c;
        w += 3;
      }
    }
    current = next;
  }

  return {
    index: Uint32Array.from(current),
    parents: parents.slice(0, parentCount),
    position: Float32Array.from(out.subarray(0, vertexCount * 3)),
  };
}
