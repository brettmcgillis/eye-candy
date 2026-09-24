const SPAN = 65536;
const HALF = SPAN / 2;

const cellKey = (ix, iy, iz) =>
  ((ix + HALF) * SPAN + (iy + HALF)) * SPAN + (iz + HALF);

// Uniform-grid index over a flat xyz array, for fixed-radius neighbour
// queries. Points are sorted by numeric cell key into typed arrays; string
// keys and a Map of arrays made this the slow step on million-point sets.
export default function createSpatialHash(positions, cellSize) {
  const count = positions.length / 3;
  const keys = new Float64Array(count);
  for (let i = 0; i < count; i += 1) {
    keys[i] = cellKey(
      Math.floor(positions[i * 3] / cellSize),
      Math.floor(positions[i * 3 + 1] / cellSize),
      Math.floor(positions[i * 3 + 2] / cellSize)
    );
  }
  const order = new Int32Array(count).map((_, i) => i);
  order.sort((a, b) => keys[a] - keys[b]);
  const sortedKeys = Float64Array.from(order, (i) => keys[i]);

  const findFirst = (key) => {
    let lo = 0;
    let hi = count;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (sortedKeys[mid] < key) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  };

  function forEachNear(x, y, z, radius, visit) {
    const reach = Math.ceil(radius / cellSize);
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    const cz = Math.floor(z / cellSize);
    const r2 = radius * radius;

    for (let dx = -reach; dx <= reach; dx += 1) {
      for (let dy = -reach; dy <= reach; dy += 1) {
        const rowStart = cellKey(cx + dx, cy + dy, cz - reach);
        const rowEnd = cellKey(cx + dx, cy + dy, cz + reach);
        for (
          let k = findFirst(rowStart);
          k < count && sortedKeys[k] <= rowEnd;
          k += 1
        ) {
          const j = order[k];
          const ex = positions[j * 3] - x;
          const ey = positions[j * 3 + 1] - y;
          const ez = positions[j * 3 + 2] - z;
          const d2 = ex * ex + ey * ey + ez * ez;
          if (d2 <= r2) visit(j, Math.sqrt(d2));
        }
      }
    }
  }

  return { forEachNear };
}
