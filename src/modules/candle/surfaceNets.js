// Narrow-band surface nets over a signed distance function: a coarse pass
// finds the blocks the surface can reach, only those are sampled finely, and
// each fine cell the surface crosses gets one vertex at the mean of its edge
// crossings. Returns flat position / normal / index arrays (three-free).
const BLOCK = 4;
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

export default function surfaceNets(sdf, { max, min, step, lipschitz = 1.6 }) {
  const counts = [0, 1, 2].map(
    (k) => Math.ceil((max[k] - min[k]) / step / BLOCK) * BLOCK + 1
  );
  const [nx, ny, nz] = counts;
  const at = (i, j, k) => i + nx * (j + ny * k);
  const values = new Float32Array(nx * ny * nz).fill(Number.NaN);
  const sample = (i, j, k) => {
    const n = at(i, j, k);
    if (Number.isNaN(values[n])) {
      values[n] = sdf(min[0] + i * step, min[1] + j * step, min[2] + k * step);
    }
    return values[n];
  };

  const blocks = [(nx - 1) / BLOCK, (ny - 1) / BLOCK, (nz - 1) / BLOCK];
  const reach = BLOCK * step * Math.sqrt(3) * lipschitz;
  const active = [];
  for (let bk = 0; bk < blocks[2]; bk += 1) {
    for (let bj = 0; bj < blocks[1]; bj += 1) {
      for (let bi = 0; bi < blocks[0]; bi += 1) {
        const near = CORNERS.some(
          ([dx, dy, dz]) =>
            Math.abs(
              sample((bi + dx) * BLOCK, (bj + dy) * BLOCK, (bk + dz) * BLOCK)
            ) <= reach
        );
        if (near) active.push([bi, bj, bk]);
      }
    }
  }

  const cx = nx - 1;
  const cy = ny - 1;
  const cell = (i, j, k) => i + cx * (j + cy * k);
  const vertexOf = new Int32Array(cx * cy * (nz - 1)).fill(-1);
  const positions = [];
  const corner = new Float32Array(8);
  const cells = [];

  active.forEach(([bi, bj, bk]) => {
    for (let k = bk * BLOCK; k < (bk + 1) * BLOCK; k += 1) {
      for (let j = bj * BLOCK; j < (bj + 1) * BLOCK; j += 1) {
        for (let i = bi * BLOCK; i < (bi + 1) * BLOCK; i += 1) {
          let inside = 0;
          for (let c = 0; c < 8; c += 1) {
            const [dx, dy, dz] = CORNERS[c];
            corner[c] = sample(i + dx, j + dy, k + dz);
            if (corner[c] < 0) inside += 1;
          }
          if (inside > 0 && inside < 8) {
            let sx = 0;
            let sy = 0;
            let sz = 0;
            let hits = 0;
            EDGES.forEach(([a, b]) => {
              const va = corner[a];
              const vb = corner[b];
              if (va < 0 === vb < 0) return;
              const t = va / (va - vb);
              const [ax, ay, az] = CORNERS[a];
              const [bx, by, bz] = CORNERS[b];
              sx += ax + (bx - ax) * t;
              sy += ay + (by - ay) * t;
              sz += az + (bz - az) * t;
              hits += 1;
            });
            vertexOf[cell(i, j, k)] = positions.length / 3;
            positions.push(
              min[0] + (i + sx / hits) * step,
              min[1] + (j + sy / hits) * step,
              min[2] + (k + sz / hits) * step
            );
            cells.push(i, j, k);
          }
        }
      }
    }
  });

  const indices = [];
  const quad = (a, b, c, d, flip) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) indices.push(a, c, b, a, d, c);
    else indices.push(a, b, c, a, c, d);
  };
  for (let n = 0; n < cells.length; n += 3) {
    const i = cells[n];
    const j = cells[n + 1];
    const k = cells[n + 2];
    const v0 = values[at(i, j, k)];
    if (j > 0 && k > 0) {
      const v1 = values[at(i + 1, j, k)];
      if (!Number.isNaN(v1) && v0 < 0 !== v1 < 0) {
        quad(
          vertexOf[cell(i, j, k)],
          vertexOf[cell(i, j - 1, k)],
          vertexOf[cell(i, j - 1, k - 1)],
          vertexOf[cell(i, j, k - 1)],
          v0 >= 0
        );
      }
    }
    if (i > 0 && k > 0) {
      const v1 = values[at(i, j + 1, k)];
      if (!Number.isNaN(v1) && v0 < 0 !== v1 < 0) {
        quad(
          vertexOf[cell(i, j, k)],
          vertexOf[cell(i, j, k - 1)],
          vertexOf[cell(i - 1, j, k - 1)],
          vertexOf[cell(i - 1, j, k)],
          v0 >= 0
        );
      }
    }
    if (i > 0 && j > 0) {
      const v1 = values[at(i, j, k + 1)];
      if (!Number.isNaN(v1) && v0 < 0 !== v1 < 0) {
        quad(
          vertexOf[cell(i, j, k)],
          vertexOf[cell(i - 1, j, k)],
          vertexOf[cell(i - 1, j - 1, k)],
          vertexOf[cell(i, j - 1, k)],
          v0 >= 0
        );
      }
    }
  }

  const position = Float32Array.from(positions);
  const index = Uint32Array.from(indices);
  const normal = new Float32Array(position.length);
  for (let t = 0; t < index.length; t += 3) {
    const a = index[t] * 3;
    const b = index[t + 1] * 3;
    const c = index[t + 2] * 3;
    const ux = position[b] - position[a];
    const uy = position[b + 1] - position[a + 1];
    const uz = position[b + 2] - position[a + 2];
    const vx = position[c] - position[a];
    const vy = position[c + 1] - position[a + 1];
    const vz = position[c + 2] - position[a + 2];
    const fx = uy * vz - uz * vy;
    const fy = uz * vx - ux * vz;
    const fz = ux * vy - uy * vx;
    [a, b, c].forEach((v) => {
      normal[v] += fx;
      normal[v + 1] += fy;
      normal[v + 2] += fz;
    });
  }
  for (let v = 0; v < normal.length; v += 3) {
    const length = Math.hypot(normal[v], normal[v + 1], normal[v + 2]) || 1;
    normal[v] /= length;
    normal[v + 1] /= length;
    normal[v + 2] /= length;
  }
  return { index, normal, position };
}
