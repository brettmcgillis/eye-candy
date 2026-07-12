// Uniform spatial grid over a cube centered on the origin, extent
// [-worldSize/2, worldSize/2] per axis — the same bucket-by-cell approach as
// boids-js's Grid (http://gameprogrammingpatterns.com/spatial-partition.html),
// adapted to index into flat typed arrays (agent index, not entity objects)
// so it can be rebuilt cheaply every frame from a Float32Array of positions.
export default function createSpatialGrid({ worldSize, cellSize }) {
  const rowCount = Math.max(1, Math.floor(worldSize / cellSize));
  const cellCount = rowCount * rowCount * rowCount;
  const cells = new Array(cellCount);
  for (let i = 0; i < cellCount; i += 1) cells[i] = [];

  const half = worldSize / 2;

  function cellCoord(v) {
    const c = Math.floor((v + half) / cellSize);
    if (c < 0) return 0;
    if (c > rowCount - 1) return rowCount - 1;
    return c;
  }

  function cellIndex(x, y, z) {
    return (
      cellCoord(x) +
      cellCoord(y) * rowCount +
      cellCoord(z) * rowCount * rowCount
    );
  }

  function clear() {
    for (let i = 0; i < cellCount; i += 1) cells[i].length = 0;
  }

  // Buckets every agent [0, count) by its position in posArray (stride 3).
  function insertAll(posArray, count) {
    for (let i = 0; i < count; i += 1) {
      const base = i * 3;
      cells[
        cellIndex(posArray[base], posArray[base + 1], posArray[base + 2])
      ].push(i);
    }
  }

  // Visits every agent index bucketed within `radius` (Chebyshev, i.e. the
  // cube of cells touching that radius — callers filter to an exact sphere
  // themselves via distance checks) of (x, y, z).
  function forEachNear(x, y, z, radius, callback) {
    const minX = cellCoord(x - radius);
    const maxX = cellCoord(x + radius);
    const minY = cellCoord(y - radius);
    const maxY = cellCoord(y + radius);
    const minZ = cellCoord(z - radius);
    const maxZ = cellCoord(z + radius);

    for (let cz = minZ; cz <= maxZ; cz += 1) {
      for (let cy = minY; cy <= maxY; cy += 1) {
        for (let cx = minX; cx <= maxX; cx += 1) {
          const bucket = cells[cx + cy * rowCount + cz * rowCount * rowCount];
          for (let i = 0; i < bucket.length; i += 1) callback(bucket[i]);
        }
      }
    }
  }

  return { clear, insertAll, forEachNear, rowCount };
}
