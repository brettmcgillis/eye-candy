// Uniform grid over a point set, bucketed by counting sort into flat typed
// arrays: `items` lists point indices cell by cell, `start` indexes into it.
// Built in O(n), so it can be rebuilt every simulation step.
export default function createDenseGrid(xyz, count, cellSize) {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  for (let i = 0; i < count; i += 1) {
    const x = xyz[i * 3];
    const y = xyz[i * 3 + 1];
    const z = xyz[i * 3 + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }
  const inv = 1 / cellSize;
  const nx = Math.floor((maxX - minX) * inv) + 1;
  const ny = Math.floor((maxY - minY) * inv) + 1;
  const nz = Math.floor((maxZ - minZ) * inv) + 1;
  const cells = new Int32Array(count);
  const start = new Int32Array(nx * ny * nz + 1);
  for (let i = 0; i < count; i += 1) {
    const c =
      Math.floor((xyz[i * 3] - minX) * inv) +
      Math.floor((xyz[i * 3 + 1] - minY) * inv) * nx +
      Math.floor((xyz[i * 3 + 2] - minZ) * inv) * nx * ny;
    cells[i] = c;
    start[c + 1] += 1;
  }
  for (let c = 0; c < nx * ny * nz; c += 1) start[c + 1] += start[c];
  const fill = start.slice(0, nx * ny * nz);
  const items = new Int32Array(count);
  for (let i = 0; i < count; i += 1) {
    items[fill[cells[i]]] = i;
    fill[cells[i]] += 1;
  }
  return { inv, items, minX, minY, minZ, nx, ny, nz, start };
}
