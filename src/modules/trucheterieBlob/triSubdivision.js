/* eslint-disable no-bitwise */
import withSeededRandom from './seedrandom';
import { PINNED_ORDER, SWAPPED_REST, UP } from './triDesign';
import { TRIANGLE } from './triangle';

// Jurgen's recursive four-triangle split and ordered corner fans:
// https://turtletoy.net/turtle/fa14c628d4 (CC BY-NC-SA 4.0).
export default function buildTriSubdivision({
  blobSeed,
  blobTriangleBigTileSize = 80,
  blobTriangleMinRes = 1,
  blobTriangleSplitProbability = 0.7,
  blobTriangleStartRes = 4,
}) {
  return withSeededRandom(blobSeed, () => {
    const cells = [];
    const start = Math.round(blobTriangleStartRes);
    const minimum = Math.min(start, Math.round(blobTriangleMinRes));
    const rootSize = 2 ** start;
    const height = blobTriangleBigTileSize / Math.sqrt(0.75);
    const columns = Math.ceil(200 / blobTriangleBigTileSize);
    const rows = Math.ceil(200 / height);

    function split(column, row, up, generation) {
      const size = 2 ** generation;
      if (
        generation <= minimum ||
        Math.random() > blobTriangleSplitProbability ** (1 + start - generation)
      ) {
        cells.push({ column, mask: up ? UP : 0, row, size });
        return;
      }
      const half = size / 2;
      if (up) {
        split(column + half, row, true, generation - 1);
        split(column + half, row + half, true, generation - 1);
        split(column, row + half, true, generation - 1);
        split(column + half, row + half, false, generation - 1);
      } else {
        split(column, row, false, generation - 1);
        split(column + half, row, false, generation - 1);
        split(column, row + half, false, generation - 1);
        split(column, row, true, generation - 1);
      }
    }

    for (
      let row = 0;
      (row * height) / 2 - (rows * height) / 2 - height < 100;
      row += 1
    ) {
      for (let column = 0; column < columns; column += 1) {
        const down = row % 2 === column % 2;
        const tip = column + (down ? 0 : 1);
        const a = ((tip - row) * rootSize) / 2;
        const b = ((tip + row) * rootSize) / 2;
        split(
          a - (down ? 0 : rootSize),
          b - (down ? 0 : rootSize),
          !down,
          start
        );
      }
    }

    return {
      cells: cells
        .sort(() => Math.random() - 0.5)
        .map((cell) => {
          const [top, middle] = [0, 1, 2].sort(() => Math.random() - 0.5);
          const swapped = middle !== (top + 1) % 3;
          return {
            ...cell,
            mask:
              cell.mask |
              7 |
              PINNED_ORDER |
              (top << 4) |
              (swapped ? SWAPPED_REST : 0),
          };
        }),
      layout: 'subdivide',
      shape: TRIANGLE,
    };
  });
}
