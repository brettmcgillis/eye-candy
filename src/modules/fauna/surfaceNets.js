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

export default function surfaceNets(field, dims, origin, cell, iso = 0) {
  const [nx, ny, nz] = dims;
  const at = (x, y, z) => field[x + nx * (y + ny * z)];
  const cellIndex = new Int32Array(nx * ny * nz).fill(-1);
  const positions = [];
  const index = [];
  const values = new Float32Array(8);

  for (let z = 0; z < nz - 1; z += 1) {
    for (let y = 0; y < ny - 1; y += 1) {
      for (let x = 0; x < nx - 1; x += 1) {
        let mask = 0;

        for (let c = 0; c < 8; c += 1) {
          const [cx, cy, cz] = CORNERS[c];

          values[c] = at(x + cx, y + cy, z + cz) - iso;
          mask |= values[c] > 0 ? 1 << c : 0; // eslint-disable-line no-bitwise
        }

        if (mask !== 0 && mask !== 255) {
          let sx = 0;
          let sy = 0;
          let sz = 0;
          let n = 0;

          EDGES.forEach(([e0, e1]) => {
            const a = values[e0];
            const b = values[e1];

            if (a > 0 !== b > 0) {
              const t = a / (a - b);
              const p0 = CORNERS[e0];
              const p1 = CORNERS[e1];

              sx += p0[0] + (p1[0] - p0[0]) * t;
              sy += p0[1] + (p1[1] - p0[1]) * t;
              sz += p0[2] + (p1[2] - p0[2]) * t;
              n += 1;
            }
          });

          cellIndex[x + nx * (y + ny * z)] = positions.length / 3;
          positions.push(
            origin[0] + (x + sx / n) * cell,
            origin[1] + (y + sy / n) * cell,
            origin[2] + (z + sz / n) * cell
          );
        }
      }
    }
  }

  const cellAt = (x, y, z) => cellIndex[x + nx * (y + ny * z)];
  const quad = (a, b, c, d, flip) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;

    if (flip) {
      index.push(a, c, b, b, c, d);
    } else {
      index.push(a, b, c, b, d, c);
    }
  };

  for (let z = 1; z < nz - 1; z += 1) {
    for (let y = 1; y < ny - 1; y += 1) {
      for (let x = 1; x < nx - 1; x += 1) {
        const inside = at(x, y, z) > iso;

        if (x < nx - 1 && inside !== at(x + 1, y, z) > iso) {
          quad(
            cellAt(x, y - 1, z - 1),
            cellAt(x, y, z - 1),
            cellAt(x, y - 1, z),
            cellAt(x, y, z),
            !inside
          );
        }

        if (y < ny - 1 && inside !== at(x, y + 1, z) > iso) {
          quad(
            cellAt(x - 1, y, z - 1),
            cellAt(x - 1, y, z),
            cellAt(x, y, z - 1),
            cellAt(x, y, z),
            !inside
          );
        }

        if (z < nz - 1 && inside !== at(x, y, z + 1) > iso) {
          quad(
            cellAt(x - 1, y - 1, z),
            cellAt(x, y - 1, z),
            cellAt(x - 1, y, z),
            cellAt(x, y, z),
            !inside
          );
        }
      }
    }
  }

  const normals = new Float32Array(positions.length);

  for (let i = 0; i < index.length; i += 3) {
    const [a, b, c] = [index[i] * 3, index[i + 1] * 3, index[i + 2] * 3];
    const ux = positions[b] - positions[a];
    const uy = positions[b + 1] - positions[a + 1];
    const uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a];
    const vy = positions[c + 1] - positions[a + 1];
    const vz = positions[c + 2] - positions[a + 2];
    const fx = uy * vz - uz * vy;
    const fy = uz * vx - ux * vz;
    const fz = ux * vy - uy * vx;

    [a, b, c].forEach((v) => {
      normals[v] += fx;
      normals[v + 1] += fy;
      normals[v + 2] += fz;
    });
  }

  for (let v = 0; v < normals.length; v += 3) {
    const len = Math.hypot(normals[v], normals[v + 1], normals[v + 2]) || 1;

    normals[v] /= len;
    normals[v + 1] /= len;
    normals[v + 2] /= len;
  }

  return {
    index:
      positions.length / 3 > 65535
        ? new Uint32Array(index)
        : new Uint16Array(index),
    normals,
    positions: new Float32Array(positions),
  };
}
