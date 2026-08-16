// `| 0` truncation and the exact loop shapes below are load-bearing: they are
// what the reference does, and both the cell sizes and the random-draw count
// change if they are rewritten as Math.floor/for-of.

/* eslint-disable no-bitwise, no-param-reassign, no-plusplus */
import { Cell, Grid } from './blobGrid';
import Formula from './formula';
import withSeededRandom from './seedrandom';

// The reference's global setup + walk loop: build the packing, sever it, then
// resolve each surviving cell to the up-to-two arc families Cell.draw() would
// have stroked. Only the drawing itself is deferred — utils/blobShader.js
// evaluates those same families analytically per pixel.
//
// Everything here runs inside one withSeededRandom() call because the
// reference's random draws are interleaved across all of it (placement,
// severing, then per-cell connection choice and draw order during the walk).

// The reference's `meatballs` control: hide unconnected cells, prune them
// outright, or keep them (its default — the isolated ring stacks).
const MEATBALLS = { HIDE_LOOSE: 0, KEEP_ALL: 2, PRUNE_LOOSE: 1 };

const NO_CONNECTION = -1;
const ATTEMPTS = 100;

const EMPTY = {
  cellSize: 1,
  centers: new Float32Array(0),
  conn0: new Float32Array(0),
  conn1: new Float32Array(0),
  connectorMask: new Float32Array(0),
  count: 0,
  positions: new Float32Array(0),
  sizes: new Float32Array(0),
};

function buildGrid(config) {
  const grid = new Grid(config);

  const popCount = (config.distributionCount * config.gridSize ** 2) | 0;
  grid.populate(
    popCount,
    (cellCount) =>
      config.sizeDistribution.solve({
        cellCount,
        gridSize: config.gridSize,
      }) | 0
  );

  const openCells = grid.grid
    .flatMap((row, c) => row.map((v, r) => [c, r, v]))
    .filter((e) => e[2] === 0)
    .map((e) => [e[0], e[1], (e[0] - grid.mid) ** 2 + (e[1] - grid.mid) ** 2])
    .sort((a, b) => (a[2] < b[2] ? -1 : 1));

  const fillTarget = Math.max(
    popCount === 0 ? 1 : 0,
    config.fill * openCells.length
  );
  for (let i = 0; i < fillTarget; i++) {
    grid.cells.push(
      new Cell(grid, openCells[i][0] - grid.mid, openCells[i][1] - grid.mid, 1)
    );
    grid.grid[openCells[i][0]][openCells[i][1]] = grid.cells.length;
  }

  grid.destroyGrid((grid.cells.length * config.destruction) | 0);
  grid.checkNeighborConnections();
  grid.destroyConnections(1 - config.connectivity);

  grid.checkNeighborConnections();
  if (config.allowSatelites === MEATBALLS.PRUNE_LOOSE) {
    grid.destroySatelites();
  }

  grid.cells.forEach((e) => {
    e.column += grid.mid;
    e.row += grid.mid;
  });
  grid.cells.sort((a, b) => {
    if (a.row !== b.row) return a.row < b.row ? -1 : 1;
    return a.column < b.column ? -1 : 1;
  });

  return grid;
}

// Mirrors the two early-outs at the top of the reference's Cell.draw(). It
// matters that skipped cells never reach getConnections()/sort() — those draw
// from the same random stream as everything after them.
function isDrawn(cell, config) {
  if (cell.destroyed) return false;
  return (
    config.allowSatelites !== MEATBALLS.HIDE_LOOSE ||
    cell.connectors.some((e) => e)
  );
}

export default function buildBlobField({
  canvasSize,
  connectivity,
  distributionCount,
  gridSize,
  holes,
  meatballs,
  oneFill,
  seed,
  sizeFunction,
}) {
  const size = Math.max(2, Math.round(gridSize));
  const config = {
    allowSatelites: meatballs,
    attempts: ATTEMPTS,
    connectivity,
    destruction: holes / 10,
    distributionCount,
    fill: oneFill,
    gridSize: size,
    sizeDistribution: new Formula(sizeFunction),
  };

  const drawn = withSeededRandom(seed, () => {
    const grid = buildGrid(config);
    return grid.cells
      .filter((cell) => isDrawn(cell, config))
      .map((cell) => {
        const connections = cell.getConnections();
        connections.sort(() => (Math.random() < 0.5 ? -1 : 1));
        return { cell, connections };
      });
  });

  if (drawn.length === 0) return EMPTY;

  const cellSize = canvasSize / size;
  const half = canvasSize / 2;
  const count = drawn.length;
  const positions = new Float32Array(count * 3);
  const centers = new Float32Array(count * 2);
  const sizes = new Float32Array(count);
  const conn0 = new Float32Array(count * 2);
  const conn1 = new Float32Array(count * 2);
  const connectorMask = new Float32Array(count);

  drawn.forEach(({ cell, connections }, i) => {
    const cx = (cell.column + cell.size / 2) * cellSize - half;
    const cy = (cell.row + cell.size / 2) * cellSize - half;
    centers[i * 2 + 0] = cx;
    centers[i * 2 + 1] = cy;

    positions[i * 3 + 0] = cx;
    // Turtle canvases run y-down; negating here (and again on the shader's
    // local y) keeps a given seed's layout identical to TurtleToy's.
    positions[i * 3 + 1] = -cy;
    positions[i * 3 + 2] = 0;
    sizes[i] = Math.max(cell.size, 1);

    const [firstType, firstEdge] = connections[0];
    conn0[i * 2 + 0] = firstType;
    conn0[i * 2 + 1] = firstEdge;
    conn1[i * 2 + 0] = connections[1] ? connections[1][0] : NO_CONNECTION;
    conn1[i * 2 + 1] = connections[1] ? connections[1][1] : 0;
    connectorMask[i] = cell.connectors.reduce(
      (acc, on, side) => acc + (on ? 2 ** side : 0),
      0
    );
  });

  return {
    cellSize,
    centers,
    conn0,
    conn1,
    connectorMask,
    count,
    positions,
    sizes,
  };
}
