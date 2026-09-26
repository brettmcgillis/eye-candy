export default function createSpatialHash(worldSize, cellSize) {
  const res = Math.ceil(worldSize / cellSize);
  const buckets = Array.from({ length: res * res }, () => []);
  const indexOf = (v) =>
    Math.min(res - 1, Math.max(0, Math.floor((v / worldSize + 0.5) * res)));

  return {
    clear() {
      buckets.forEach((bucket) => {
        bucket.length = 0; // eslint-disable-line no-param-reassign
      });
    },
    insert(item) {
      buckets[indexOf(item.x) + indexOf(item.z) * res].push(item);
    },
    query(x, z, radius, out) {
      const x0 = indexOf(x - radius);
      const x1 = indexOf(x + radius);
      const z0 = indexOf(z - radius);
      const z1 = indexOf(z + radius);
      const r2 = radius * radius;

      out.length = 0; // eslint-disable-line no-param-reassign

      for (let bz = z0; bz <= z1; bz += 1) {
        for (let bx = x0; bx <= x1; bx += 1) {
          const bucket = buckets[bx + bz * res];

          for (let i = 0; i < bucket.length; i += 1) {
            const item = bucket[i];
            const dx = item.x - x;
            const dz = item.z - z;

            if (dx * dx + dz * dz <= r2) {
              out.push(item);
            }
          }
        }
      }

      return out;
    },
  };
}
