/* eslint-disable max-classes-per-file, no-bitwise, no-continue, no-loop-func, no-param-reassign, no-plusplus */

// Line-for-line port of the TurtleToy blob-field reference's Grid and Cell
// classes (todo.md, "IRREGULAR / BLOB FIELD EXAMPLE"). Loop structure and
// Math.random() call ORDER are preserved deliberately: utils/seedrandom.js
// seeds the global generator, so any reordering silently changes the layout
// a given seed string produces.
//
// Sides/connectors are [top, right, bottom, left] = [0, 1, 2, 3].
const COL = 1;
const ROW = 2;

function neighborProbes(cell) {
  return [
    [COL, -1],
    [ROW, cell.size],
    [COL, cell.size],
    [ROW, -1],
  ];
}

// A discretized ray from the grid origin out to the boundary in a random
// direction, as a sequence of unit steps. Each new cell starts at the centre
// and walks this ray until it finds room, which is what gives the packing its
// dense core and sparse fringe rather than a uniform scatter.
function stepsToBoundary(direction, boundary) {
  const r = Math.SQRT2 * (boundary + 1);
  const dx = r * Math.cos(direction);
  const dy = r * Math.sin(direction);
  const dMax = Math.max(Math.abs(dx), Math.abs(dy));
  const dxs = dx / dMax;
  const dys = dy / dMax;

  const pts = [];
  for (let i = 0; i <= dMax; i++) {
    const pt = [Math.round(i * dxs), Math.round(i * dys)];
    if (
      pt[0] < -boundary ||
      boundary < pt[0] ||
      pt[1] < -boundary ||
      boundary < pt[1]
    ) {
      break;
    }
    pts.push(pt);
  }
  return Array.from({ length: pts.length - 1 }).map((e, i) => [
    pts[i + 1][0] - pts[i][0],
    pts[i + 1][1] - pts[i][1],
  ]);
}

export class Cell {
  constructor(grid, column, row, size) {
    this.id = grid.cells.length + 1;
    this.column = column;
    this.row = row;
    this.size = size;
    this.connectors = [true, true, true, true];
    this.destroyed = false;
  }

  get activeConnectorCount() {
    return this.connectors.reduce((a, c) => a + (c ? 1 : 0), 0);
  }

  destroy() {
    this.destroyed = true;
    this.connectors = [false, false, false, false];
  }

  // [[type, startEdge], ...] — type 0 = isolated (concentric circles about
  // the cell centre), 1 = stub (semicircles about a side midpoint), 2 =
  // corner turn (quarter arcs about a corner). Never more than two.
  getConnections() {
    const active = this.connectors
      .map((e, i) => [i, e])
      .filter((e) => e[1])
      .map((e) => e[0]);

    switch (active.length) {
      case 0:
        return [[0, 0]];
      case 1:
        return [[1, active[0]]];
      case 2: {
        const adjacent = this.connectors
          .map((e, i, a) => [i, e && a[(i + 3) % a.length]])
          .filter((e) => e[1]);
        if (adjacent.length === 1) return [[2, adjacent[0][0]]];
        return active.map((i) => [1, i]);
      }
      case 3:
        return this.connectors
          .map((e, i, a) => [i, e && a[(i + 3) % a.length]])
          .filter((e) => e[1])
          .map((e) => [2, e[0]]);
      default:
        return Math.random() < 0.5
          ? [
              [2, 0],
              [2, 2],
            ]
          : [
              [2, 1],
              [2, 3],
            ];
    }
  }
}

export class Grid {
  constructor(config) {
    this.config = config;
    this.size = config.gridSize;
    this.grid = Array.from({ length: config.gridSize }, () =>
      Array.from({ length: config.gridSize }, () => 0)
    );
    this.cells = [];
  }

  get mid() {
    return (this.size / 2) | 0;
  }

  populate(n, sizeFn) {
    const { config } = this;
    for (
      let i = 0, attempt = 0;
      i < n && attempt < config.attempts;
      i++, attempt++
    ) {
      const size = sizeFn(this.cells.length);
      const cell = new Cell(this, -((size / 2) | 0), -((size / 2) | 0), size);

      const moves = stepsToBoundary(
        Math.random() * 2 * Math.PI,
        (config.gridSize / 2) | 0
      );

      let available = this.cellAvailability(cell);
      while (!available && moves.length > 0) {
        const move = moves.shift();
        cell.column += move[0];
        cell.row += move[1];
        available = this.cellAvailability(cell);
      }

      if (!available) {
        i--;
        continue;
      }

      attempt = 0;
      this.cells.push(cell);

      for (let c = 0; c < cell.size; c++) {
        for (let r = 0; r < cell.size; r++) {
          this.grid[this.mid + c + cell.column][this.mid + r + cell.row] =
            this.cells.length;
        }
      }
    }
  }

  getMicroCellAvailability(checkCol, checkRow) {
    const { gridSize } = this.config;
    if (
      checkCol < 0 ||
      gridSize <= checkCol ||
      checkRow < 0 ||
      gridSize <= checkRow
    ) {
      return false;
    }
    return this.grid[checkCol][checkRow];
  }

  cellAvailability(cell) {
    for (let c = 0; c < cell.size; c++) {
      for (let r = 0; r < cell.size; r++) {
        const av = this.getMicroCellAvailability(
          this.mid + c + cell.column,
          this.mid + r + cell.row
        );
        if (av === false || av > 0) return false;
      }
    }
    return true;
  }

  // The reference's own size-based skip test reads `config.attemps` (typo) —
  // undefined, so the comparison is always false and any cell is fair game.
  // Ported as the runtime behaviour, not the apparent intent.
  destroyGrid(n) {
    const { config } = this;
    for (
      let i = 0, attempt = 0;
      i < n && this.cells.length > 0 && attempt < config.attempts;
      i++, attempt++
    ) {
      const col = (config.gridSize * Math.random()) | 0;
      const row = (config.gridSize * Math.random()) | 0;
      const cellId = this.grid[col][row];
      if (cellId === 0) {
        i--;
        continue;
      }
      attempt = 0;
      this.cells[cellId - 1].destroy();
    }
  }

  // Two passes over each cell's 4 connector flags: kill a side that borders
  // open space, then iterate killing any side whose neighbour's reciprocal
  // connector is off. One bad micro-position kills the whole side — there is
  // no partial per-neighbour connection, which is what keeps a big cell's
  // arcs from meeting a small neighbour's halfway along an edge.
  checkNeighborConnections() {
    this.cells.forEach((cell) => {
      neighborProbes(cell).forEach((e, i) => {
        for (let j = 0; j < cell.size; j++) {
          const checkCol =
            this.mid +
            (e[0] === COL ? j : 0) +
            cell.column +
            (e[0] === COL ? 0 : e[1]);
          const checkRow =
            this.mid +
            (e[0] === ROW ? j : 0) +
            cell.row +
            (e[0] === ROW ? 0 : e[1]);
          if (!this.getMicroCellAvailability(checkCol, checkRow)) {
            cell.connectors[i] = false;
          }
        }
      });
    });

    let changed = true;
    while (changed) {
      changed = false;
      this.cells.forEach((cell) => {
        const neighbors = neighborProbes(cell);
        for (let c = 0; c < cell.connectors.length; c++) {
          if (!cell.connectors[c]) continue;
          for (let j = 0; j < cell.size; j++) {
            const checkCol =
              this.mid +
              (neighbors[c][0] === COL ? j : 0) +
              cell.column +
              (neighbors[c][0] === COL ? 0 : neighbors[c][1]);
            const checkRow =
              this.mid +
              (neighbors[c][0] === ROW ? j : 0) +
              cell.row +
              (neighbors[c][0] === ROW ? 0 : neighbors[c][1]);
            const otherCellId = this.getMicroCellAvailability(
              checkCol,
              checkRow
            );
            if (!this.cells[otherCellId - 1].connectors[(c + 2) % 4]) {
              cell.connectors[c] = false;
              changed = true;
            }
          }
        }
      });
    }
  }

  destroyConnections(percentage) {
    const getConnectors = () =>
      this.cells.flatMap((c) =>
        c.connectors
          .map((e, i) => [i, e])
          .filter((e) => e[1])
          .map((e) => [c.id, e[0]])
      );

    const originalConnectors = getConnectors();
    const n = originalConnectors.length * percentage;
    let connectors = originalConnectors.map((e) => [...e]);
    while (originalConnectors.length - connectors.length < n) {
      const pick = (Math.random() * connectors.length) | 0;
      this.cells[connectors[pick][0] - 1].connectors[connectors[pick][1]] =
        false;
      this.checkNeighborConnections();
      connectors = getConnectors();
    }
  }

  destroySatelites() {
    const connected = [this.cells.find((c) => c.activeConnectorCount).id];
    for (let i = 0; i < connected.length; i++) {
      const cell = this.cells[connected[i] - 1];

      if (i > 0 && cell.activeConnectorCount === 2) {
        const onOppositeSides =
          cell.connectors
            .map((e, j) => [j, e])
            .filter((e) => e[1])
            .reduce((a, c) => a + c[0], 0) %
            2 ===
          0;
        if (onOppositeSides) continue;
      }

      const neighbors = neighborProbes(cell);
      for (let c = 0; c < cell.connectors.length; c++) {
        if (!cell.connectors[c]) continue;
        for (let j = 0; j < cell.size; j++) {
          const checkCol =
            this.mid +
            (neighbors[c][0] === COL ? j : 0) +
            cell.column +
            (neighbors[c][0] === COL ? 0 : neighbors[c][1]);
          const checkRow =
            this.mid +
            (neighbors[c][0] === ROW ? j : 0) +
            cell.row +
            (neighbors[c][0] === ROW ? 0 : neighbors[c][1]);
          const otherCellId = this.getMicroCellAvailability(checkCol, checkRow);
          if (this.cells[otherCellId - 1].connectors[(c + 2) % 4]) {
            if (!connected.some((e) => e === otherCellId)) {
              connected.push(otherCellId);
            }
          }
        }
      }
    }

    this.cells
      .filter((c) => !connected.includes(c.id))
      .forEach((c) => c.destroy());
    this.checkNeighborConnections();
  }
}
