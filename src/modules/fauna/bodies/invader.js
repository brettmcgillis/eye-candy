import { decode, fullBitmap } from '../genome';
import { BITMAP_ROWS, LEG_ROW_START, VOXEL_BLOCK } from '../params';
import surfaceNets from '../surfaceNets';

const WIDTH = 8;
const MAX_HALF_DEPTH = 2;
const DEPTH = MAX_HALF_DEPTH * 2 + 1;
const VOXEL = 1 / WIDTH;

function halfDepth(genome, r, x) {
  const half = Math.round(
    genome.rows[r] * (0.6 + decode(genome, 'depth') * 1.45)
  );
  const outer = x === 0 || x === WIDTH - 1;

  return Math.max(0, Math.min(MAX_HALF_DEPTH, outer ? half - 1 : half));
}

function occupancy(genome) {
  const frames = [fullBitmap(genome, 0), fullBitmap(genome, 1)];
  const grids = frames.map(() => new Uint8Array(WIDTH * BITMAP_ROWS * DEPTH));
  const key = (x, r, z) => x + WIDTH * (r + BITMAP_ROWS * z);

  frames.forEach((bitmap, f) => {
    for (let r = 0; r < BITMAP_ROWS; r += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        if (bitmap[r][x]) {
          const half = halfDepth(genome, r, x);

          for (let z = -half; z <= half; z += 1) {
            grids[f][key(x, r, z + MAX_HALF_DEPTH)] = 1;
          }
        }
      }
    }
  });

  return { frames, grids, key };
}

function eyeRows(bitmap) {
  const rows = new Set();

  for (let r = 1; r < 5; r += 1) {
    for (let x = 1; x < WIDTH - 1; x += 1) {
      if (!bitmap[r][x] && bitmap[r][x - 1] && bitmap[r][x + 1]) {
        rows.add(r);
      }
    }
  }

  return rows;
}

export function invaderVoxels(genome) {
  const { frames, grids, key } = occupancy(genome);
  const eyes = eyeRows(frames[0]);
  const filled = (f, x, r, z) =>
    x >= 0 &&
    x < WIDTH &&
    r >= 0 &&
    r < BITMAP_ROWS &&
    z >= 0 &&
    z < DEPTH &&
    grids[f][key(x, r, z)] === 1;
  const local = new Float32Array(VOXEL_BLOCK * 4);
  const info = new Float32Array(VOXEL_BLOCK * 4);
  let count = 0;

  for (let z = 0; z < DEPTH; z += 1) {
    for (let r = 0; r < BITMAP_ROWS; r += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        const inA = filled(0, x, r, z);
        const inB = filled(1, x, r, z);
        const interior = [0, 1].every(
          (f) =>
            filled(f, x - 1, r, z) &&
            filled(f, x + 1, r, z) &&
            filled(f, x, r - 1, z) &&
            filled(f, x, r + 1, z) &&
            filled(f, x, r, z - 1) &&
            filled(f, x, r, z + 1)
        );

        if ((inA || inB) && !interior && count < VOXEL_BLOCK) {
          const i = count * 4;
          const accent = eyes.has(r) || eyes.has(r - 1) || eyes.has(r + 1);

          local[i] = (x - (WIDTH - 1) / 2) * VOXEL;
          local[i + 1] = (BITMAP_ROWS - 1 - r + 0.5) * VOXEL;
          local[i + 2] = (z - MAX_HALF_DEPTH) * VOXEL;
          local[i + 3] = VOXEL;
          info[i] = inA && inB ? 0 : inA ? 1 : 2; // eslint-disable-line no-nested-ternary
          info[i + 1] = r >= LEG_ROW_START ? 2 : accent ? 1 : 0; // eslint-disable-line no-nested-ternary
          info[i + 2] = r / (BITMAP_ROWS - 1);
          count += 1;
        }
      }
    }
  }

  return { count, info, local };
}

function blur(field, dims, radius) {
  const [nx, ny, nz] = dims;
  const tmp = new Float32Array(field.length);
  const axes = [
    [1, nx],
    [nx, ny],
    [nx * ny, nz],
  ];
  let src = field;
  let dst = tmp;

  axes.forEach(([stride, len]) => {
    for (let i = 0; i < src.length; i += 1) {
      const coord = Math.floor(i / stride) % len;
      let sum = 0;
      let n = 0;

      for (let k = -radius; k <= radius; k += 1) {
        const c = coord + k;

        if (c >= 0 && c < len) {
          sum += src[i + k * stride];
          n += 1;
        }
      }

      dst[i] = sum / n;
    }

    [src, dst] = [dst, src];
  });

  return src;
}

export function invaderSkin(genome, detail = 3) {
  const { grids, key } = occupancy(genome);
  const pad = detail + 2;
  const dims = [
    WIDTH * detail + pad * 2,
    BITMAP_ROWS * detail + pad * 2,
    DEPTH * detail + pad * 2,
  ];
  const cell = VOXEL / detail;
  const origin = [
    -WIDTH * 0.5 * VOXEL - pad * cell + cell * 0.5,
    -pad * cell + cell * 0.5,
    -DEPTH * 0.5 * VOXEL - pad * cell + cell * 0.5,
  ];
  const parts = grids.map((grid) => {
    const field = new Float32Array(dims[0] * dims[1] * dims[2]);

    for (let z = 0; z < dims[2]; z += 1) {
      for (let y = 0; y < dims[1]; y += 1) {
        for (let x = 0; x < dims[0]; x += 1) {
          const vx = Math.floor((x - pad) / detail);
          const vr = BITMAP_ROWS - 1 - Math.floor((y - pad) / detail);
          const vz = Math.floor((z - pad) / detail);
          const inside =
            vx >= 0 &&
            vx < WIDTH &&
            vr >= 0 &&
            vr < BITMAP_ROWS &&
            vz >= 0 &&
            vz < DEPTH;

          field[x + dims[0] * (y + dims[1] * z)] = inside
            ? grid[key(vx, vr, vz)]
            : 0;
        }
      }
    }

    return surfaceNets(
      blur(blur(field, dims, Math.ceil(detail * 0.5)), dims, 1),
      dims,
      origin,
      cell,
      0.5
    );
  });

  const vertexCount =
    parts[0].positions.length / 3 + parts[1].positions.length / 3;
  const positions = new Float32Array(vertexCount * 3);
  const normals = new Float32Array(vertexCount * 3);
  const frame = new Float32Array(vertexCount);
  const indexCount = parts[0].index.length + parts[1].index.length;
  const index =
    vertexCount > 65535
      ? new Uint32Array(indexCount)
      : new Uint16Array(indexCount);
  let vOffset = 0;
  let iOffset = 0;

  parts.forEach((part, f) => {
    const verts = part.positions.length / 3;

    positions.set(part.positions, vOffset * 3);
    normals.set(part.normals, vOffset * 3);
    frame.fill(f + 1, vOffset, vOffset + verts);

    for (let i = 0; i < part.index.length; i += 1) {
      index[iOffset + i] = part.index[i] + vOffset;
    }

    vOffset += verts;
    iOffset += part.index.length;
  });

  return { frame, index, normals, positions };
}
