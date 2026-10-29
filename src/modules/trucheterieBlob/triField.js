/* eslint-disable no-bitwise */
import { MEATBALLS } from './field';
import Formula from './formula';
import withSeededRandom from './seedrandom';
import {
  UP,
  normalizeTriDesign,
  triCornerGroups,
  triNetworks,
} from './triDesign';
import {
  TRIANGLE,
  cellNear,
  centroid,
  cornerPoints,
  microKey,
  microTriangles,
  toLattice,
} from './triangle';

const ATTEMPTS = 100;
const ALL_CORNERS = 7;
const RAY_STEP = 0.5;

// The square field's recipe on the triangular lattice: cells packed out from
// the centre along random rays, gaps filled nearest-first with the smallest
// triangles, holes punched, then corners closed until `connectivity` of them
// survive. The region is the gridSize square about the lattice origin.
function regionMicros(half) {
  const [, top] = toLattice(0, -half);
  const [, bottom] = toLattice(0, half);
  const out = [];
  for (let b = Math.floor(top) - 1; b <= Math.ceil(bottom) + 1; b += 1) {
    const [left] = toLattice(-half, b * (Math.sqrt(3) / 2));
    const [right] = toLattice(half, b * (Math.sqrt(3) / 2));
    for (let a = Math.floor(left) - 1; a <= Math.ceil(right) + 1; a += 1) {
      [false, true].forEach((up) => out.push([a, b, up]));
    }
  }
  return out;
}

export default function buildTriDesign({
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
  const half = size / 2;
  const inRegion = (cell) =>
    cornerPoints(cell).every(
      ([x, y]) => Math.abs(x) <= half + 1e-9 && Math.abs(y) <= half + 1e-9
    );

  return withSeededRandom(seed, () => {
    const formula = new Formula(sizeFunction);
    const owner = new Map();
    const cells = [];
    const fits = (cell) =>
      inRegion(cell) &&
      microTriangles(cell).every(
        ([a, b, up]) => !owner.has(microKey(a, b, up))
      );
    const claim = (cell) => {
      cells.push(cell);
      microTriangles(cell).forEach(([a, b, up]) =>
        owner.set(microKey(a, b, up), cells.length - 1)
      );
    };

    const popCount = (distributionCount * size ** 2) | 0;
    for (
      let i = 0, attempt = 0;
      i < popCount && attempt < ATTEMPTS;
      i += 1, attempt += 1
    ) {
      const n = Math.max(
        1,
        formula.solve({ cellCount: cells.length, gridSize: size }) | 0
      );
      const up = Math.random() < 0.5;
      const direction = Math.random() * 2 * Math.PI;
      let placed = null;
      for (let r = 0; r <= half * Math.SQRT2 && !placed; r += RAY_STEP) {
        const cell = {
          ...cellNear(Math.cos(direction) * r, Math.sin(direction) * r, n, up),
          shape: TRIANGLE,
        };
        if (fits(cell)) placed = cell;
      }
      if (placed) {
        attempt = 0;
        claim(placed);
      } else {
        i -= 1;
      }
    }

    const open = regionMicros(half)
      .map(([a, b, up]) => ({
        column: a,
        row: b,
        shape: TRIANGLE,
        size: 1,
        up,
      }))
      .filter(fits)
      .map((cell) => [cell, Math.hypot(...centroid(cell))])
      .sort((a, b) => a[1] - b[1]);
    const fillTarget = Math.max(
      cells.length === 0 ? 1 : 0,
      oneFill * open.length
    );
    for (let i = 0; i < fillTarget && i < open.length; i += 1) {
      claim(open[i][0]);
    }

    const destroyed = new Set();
    const destroyCount = (cells.length * (holes / 10)) | 0;
    const micros = [...owner.keys()];
    for (
      let i = 0, attempt = 0;
      i < destroyCount && attempt < ATTEMPTS;
      i += 1, attempt += 1
    ) {
      const index = owner.get(micros[(Math.random() * micros.length) | 0]);
      if (destroyed.has(index)) {
        i -= 1;
      } else {
        attempt = 0;
        destroyed.add(index);
      }
    }

    let design = normalizeTriDesign({
      cells: cells
        .filter((_, index) => !destroyed.has(index))
        .map(({ column, row, size: n, up }) => ({
          column,
          mask: ALL_CORNERS | (up ? UP : 0),
          row,
          size: n,
        })),
      shape: TRIANGLE,
    });

    // Corners close a whole group at a time, and the groups threading through
    // mixed sizes are huge, so a group is picked evenly rather than through a
    // random corner, which would nearly always land in the biggest one.
    const { groups } = triCornerGroups(design);
    const masks = design.cells.map(({ mask }) => mask);
    const isOn = (node) =>
      (masks[Math.floor(node / 3)] & (1 << (node % 3))) !== 0;
    let live = [...groups.values()].filter(({ members }) =>
      members.every(isOn)
    );
    const target =
      live.reduce((acc, { members }) => acc + members.length, 0) *
      (1 - connectivity);
    let closed = 0;
    while (closed < target && live.length > 0) {
      const remaining = target - closed;
      live = live.filter(({ members }) => members.length <= remaining);
      if (live.length === 0) break;
      const pick = (Math.random() * live.length) | 0;
      live[pick].members.forEach((node) => {
        masks[Math.floor(node / 3)] &= ~(1 << (node % 3));
      });
      closed += live[pick].members.length;
      live = live.filter((_, i) => i !== pick);
    }
    design = {
      ...design,
      cells: design.cells.map((cell, index) => ({
        ...cell,
        mask: masks[index],
      })),
    };

    if (meatballs === MEATBALLS.PRUNE_LOOSE) {
      const keep = new Set(
        triNetworks(design)
          .filter((group) => design.cells[group[0]].mask & ALL_CORNERS)
          .reduce(
            (best, group) => (group.length > best.length ? group : best),
            []
          )
      );
      design = { ...design, cells: design.cells.filter((_, i) => keep.has(i)) };
    } else if (meatballs === MEATBALLS.HIDE_LOOSE) {
      design = {
        ...design,
        cells: design.cells.filter((cell) => cell.mask & ALL_CORNERS),
      };
    }
    return design;
  });
}

// The region a seeded triangle field is framed in, in micro-cell units.
export const triRegionFrame = (gridSize) => {
  const size = Math.max(2, Math.round(gridSize));
  return { column: -size / 2, row: -size / 2, size };
};
