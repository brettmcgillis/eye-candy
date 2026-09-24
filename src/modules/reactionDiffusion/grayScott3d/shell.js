// Voxelises a band around a surface for createGrayScott3dField. `positions`
// are surface samples (xyz) carrying one scalar each in `values`; every voxel
// within `band` of a sample joins the shell and keeps the lowest nearby value.
export default function buildSurfaceShell({
  band = 2,
  padding = 3,
  positions,
  resolution = 128,
  values,
}) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let k = 0; k < 3; k += 1) {
      min[k] = Math.min(min[k], positions[i + k]);
      max[k] = Math.max(max[k], positions[i + k]);
    }
  }
  const extent = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]);
  const voxelSize = extent / (resolution - padding * 2);
  const origin = min.map((m) => m - padding * voxelSize);
  const dims = [0, 1, 2].map(
    (k) => Math.ceil((max[k] - min[k]) / voxelSize) + padding * 2
  );
  const [nx, ny, nz] = dims;
  const grid = new Float32Array(nx * ny * nz).fill(Infinity);
  let frontier = [];

  for (let i = 0; i < positions.length / 3; i += 1) {
    const x = Math.floor((positions[i * 3] - origin[0]) / voxelSize);
    const y = Math.floor((positions[i * 3 + 1] - origin[1]) / voxelSize);
    const z = Math.floor((positions[i * 3 + 2] - origin[2]) / voxelSize);
    const at = x + y * nx + z * nx * ny;
    if (grid[at] === Infinity) frontier.push(at);
    grid[at] = Math.min(grid[at], values[i]);
  }

  for (let layer = 0; layer < band; layer += 1) {
    const next = [];
    frontier.forEach((at) => {
      const x = at % nx;
      const y = Math.floor(at / nx) % ny;
      const z = Math.floor(at / (nx * ny));
      for (let dz = -1; dz <= 1; dz += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const X = x + dx;
            const Y = y + dy;
            const Z = z + dz;
            if (X >= 0 && Y >= 0 && Z >= 0 && X < nx && Y < ny && Z < nz) {
              const n = X + Y * nx + Z * nx * ny;
              if (grid[n] === Infinity) next.push(n);
              grid[n] = Math.min(grid[n], grid[at]);
            }
          }
        }
      }
    });
    frontier = next;
  }

  const members = [];
  grid.forEach((value, at) => {
    if (value !== Infinity) members.push(at);
  });
  const shell = new Float32Array(members.length * 4);
  members.forEach((at, i) => {
    shell[i * 4] = at % nx;
    shell[i * 4 + 1] = Math.floor(at / nx) % ny;
    shell[i * 4 + 2] = Math.floor(at / (nx * ny));
    shell[i * 4 + 3] = grid[at];
  });

  return { dims, origin, shell, voxelSize };
}
