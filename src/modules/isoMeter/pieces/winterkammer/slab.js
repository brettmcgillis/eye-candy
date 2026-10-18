import { NUMLAYERS } from './perlinGrid';

export const PADDING = 2;

const slabCell = {
  0: (level, x, y) => [level, x, y],
  1: (level, x, y) => [x, level, y],
  2: (level, x, y) => [x, y, level],
};

const slabSize = ({ I, J, K }) => ({ 0: [J, K], 1: [I, K], 2: [I, J] });

function flipFor(flipIJK, i, j, k, { I, J, K }) {
  if (flipIJK === 0) return i > I / 2;
  if (flipIJK === 1) return j > J / 2;
  if (flipIJK === 2) return k > K / 2;
  return flipIJK === 3;
}

export default function addSlab(tile, order, level) {
  const { dims, field, flipIJK, heightMap, lattice, offsets } = tile;
  const { I, J, K } = dims;
  const [outer, inner] = slabSize(dims)[order];
  const cellAt = slabCell[order];
  for (let x = 0; x < outer; x += 1) {
    for (let y = 0; y < inner; y += 1) {
      const [i, j, k] = cellAt(level, x, y);
      const corner =
        (i === I - 1 && j === 0) ||
        (k === K - 1 && j === 0) ||
        (i === 0 && j === J - 1) ||
        (k === 0 && j === J - 1) ||
        (i === I - 1 && k === 0) ||
        (k === K - 1 && i === 0);
      const outside =
        i < PADDING ||
        i >= I - PADDING ||
        k < PADDING ||
        k >= K - PADDING ||
        j < PADDING ||
        j >= J - PADDING;
      const f =
        corner || outside
          ? -1
          : field(
              Math.floor(i + offsets.i),
              Math.floor(j + offsets.j),
              Math.floor(k + offsets.k)
            );
      if (f >= 0) {
        lattice.addCube(
          i,
          j,
          k,
          f === NUMLAYERS ? f : f % 4,
          f,
          corner || flipFor(flipIJK, i, j, k, dims)
        );
        const g = k + K * i;
        if (j > heightMap[g]) heightMap[g] = j;
      }
    }
  }
}
