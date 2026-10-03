const CORNERS = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [1, 1, 0],
  [0, 0, 1],
  [1, 0, 1],
  [0, 1, 1],
  [1, 1, 1],
];

const EDGES = [
  [0, 1],
  [2, 3],
  [4, 5],
  [6, 7],
  [0, 2],
  [1, 3],
  [4, 6],
  [5, 7],
  [0, 4],
  [1, 5],
  [2, 6],
  [3, 7],
];

// Naive surface nets over a sampled signed field (negative = solid). One
// vertex per sign-changing cell at the mean of its edge crossings, one quad per
// sign-changing grid edge. Normals come from the trilinear gradient of the
// field, so bevels shade smooth rather than as the voxel staircase.
export default function surfaceNets({ values, dims, origin, step }) {
  const [nx, ny, nz] = dims;
  const sx = 1;
  const sy = nx;
  const sz = nx * ny;
  const cx = nx - 1;
  const cy = ny - 1;
  const cellIndex = new Int32Array(cx * cy * (nz - 1)).fill(-1);
  const positions = [];
  const normals = [];
  const indices = [];
  const corner = new Float64Array(8);

  const value = (i, j, k) => values[i * sx + j * sy + k * sz];
  const gradient = (i, j, k, axis) => {
    const d = [0, 0, 0];
    d[axis] = 1;
    const up = [i + d[0], j + d[1], k + d[2]];
    const down = [i - d[0], j - d[1], k - d[2]];
    const clampAxis = (v, n) => Math.min(Math.max(v, 0), n - 1);
    const a = value(
      clampAxis(up[0], nx),
      clampAxis(up[1], ny),
      clampAxis(up[2], nz)
    );
    const b = value(
      clampAxis(down[0], nx),
      clampAxis(down[1], ny),
      clampAxis(down[2], nz)
    );
    return a - b;
  };

  for (let k = 0; k < nz - 1; k += 1) {
    for (let j = 0; j < ny - 1; j += 1) {
      for (let i = 0; i < nx - 1; i += 1) {
        let mask = 0;
        for (let c = 0; c < 8; c += 1) {
          const [ox, oy, oz] = CORNERS[c];
          corner[c] = value(i + ox, j + oy, k + oz);
          if (corner[c] < 0) mask |= 1 << c; // eslint-disable-line no-bitwise
        }
        if (mask !== 0 && mask !== 255) {
          let px = 0;
          let py = 0;
          let pz = 0;
          let crossings = 0;
          EDGES.forEach(([a, b]) => {
            const va = corner[a];
            const vb = corner[b];
            if (va < 0 === vb < 0) return;
            const t = va / (va - vb);
            px += CORNERS[a][0] + (CORNERS[b][0] - CORNERS[a][0]) * t;
            py += CORNERS[a][1] + (CORNERS[b][1] - CORNERS[a][1]) * t;
            pz += CORNERS[a][2] + (CORNERS[b][2] - CORNERS[a][2]) * t;
            crossings += 1;
          });
          px /= crossings;
          py /= crossings;
          pz /= crossings;

          const n = [0, 0, 0];
          for (let c = 0; c < 8; c += 1) {
            const [ox, oy, oz] = CORNERS[c];
            const w =
              (ox ? px : 1 - px) * (oy ? py : 1 - py) * (oz ? pz : 1 - pz);
            for (let axis = 0; axis < 3; axis += 1) {
              n[axis] += w * gradient(i + ox, j + oy, k + oz, axis);
            }
          }
          const length = Math.hypot(n[0], n[1], n[2]) || 1;

          cellIndex[i + j * cx + k * cx * cy] = positions.length / 3;
          positions.push(
            origin[0] + (i + px) * step,
            origin[1] + (j + py) * step,
            origin[2] + (k + pz) * step
          );
          normals.push(n[0] / length, n[1] / length, n[2] / length);
        }
      }
    }
  }

  const cell = (i, j, k) => cellIndex[i + j * cx + k * cx * cy];
  const quad = (a, b, c, d, flip) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) indices.push(a, c, b, a, d, c);
    else indices.push(a, b, c, a, c, d);
  };

  for (let k = 1; k < nz - 1; k += 1) {
    for (let j = 1; j < ny - 1; j += 1) {
      for (let i = 1; i < nx - 1; i += 1) {
        const inside = value(i, j, k) < 0;
        if (inside !== value(i + 1, j, k) < 0) {
          quad(
            cell(i, j - 1, k - 1),
            cell(i, j, k - 1),
            cell(i, j, k),
            cell(i, j - 1, k),
            !inside
          );
        }
        if (inside !== value(i, j + 1, k) < 0) {
          quad(
            cell(i - 1, j, k - 1),
            cell(i - 1, j, k),
            cell(i, j, k),
            cell(i, j, k - 1),
            !inside
          );
        }
        if (inside !== value(i, j, k + 1) < 0) {
          quad(
            cell(i - 1, j - 1, k),
            cell(i, j - 1, k),
            cell(i, j, k),
            cell(i - 1, j, k),
            !inside
          );
        }
      }
    }
  }

  return {
    indices: new Uint32Array(indices),
    normals: new Float32Array(normals),
    positions: new Float32Array(positions),
  };
}
