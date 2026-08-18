import { hexDistance, mulberry32, pickMotif, pickTriMotif } from './grid';
import { TRIANGLE_A, TRIANGLE_B } from './triangleGeometry';

// Macro triangle centers only (no motif assignment) — the same lattice as
// buildTriangularGrid's own loop, kept separate so that function's rng
// consumption order (and therefore the exact pattern an existing seed/
// preset produces) never shifts. Each returned center is a recursion root
// below.
function buildTriangularMacroPositions({ cellSize, hexRadius }) {
  const s = cellSize;
  const h = (s * Math.sqrt(3)) / 2;
  const bound = hexRadius + 1;

  const positionsA = [];
  const positionsB = [];

  for (let i = -bound; i <= bound; i += 1) {
    for (let j = -bound; j <= bound; j += 1) {
      const baseX = s * (i + 0.5 * j);
      const baseY = h * j;

      if (hexDistance(i + 1 / 3, j + 1 / 3) <= hexRadius) {
        positionsA.push([baseX + 0.5 * s, baseY + h / 3]);
      }
      if (hexDistance(i + 2 / 3, j + 2 / 3) <= hexRadius) {
        positionsB.push([baseX + s, baseY + (2 * h) / 3]);
      }
    }
  }

  return { positionsA, positionsB };
}

function shouldSplit(
  generation,
  rng,
  splitProbability,
  minGeneration,
  maxGeneration
) {
  if (generation >= maxGeneration) return false;
  if (generation < minGeneration) return true;
  return rng() < splitProbability;
}

// Recursive quadtree split: a square cell either becomes a leaf or splits
// into 4 half-size quadrants, each recursed independently — so leaf size
// varies by how deep its own branch went, not a single grid-wide cellSize.
function subdivideSquare(x, y, size, generation, params, rng, leaves) {
  const { maxGeneration, minGeneration, splitProbability } = params;
  if (
    !shouldSplit(
      generation,
      rng,
      splitProbability,
      minGeneration,
      maxGeneration
    )
  ) {
    leaves.push({ generation, size, x, y });
    return;
  }
  const half = size / 2;
  const offset = half / 2;
  [
    [-offset, -offset],
    [offset, -offset],
    [-offset, offset],
    [offset, offset],
  ].forEach(([dx, dy]) => {
    subdivideSquare(x + dx, y + dy, half, generation + 1, params, rng, leaves);
  });
}

// Recursive quadrisection of an equilateral triangle via its medial
// triangle: 3 corner children (same orientation, half size, centered at
// Vi/2 in the parent's own local coords) + 1 center child (flipped
// orientation, half size, same center) — the classic Truchet "multiscale"
// split. TRIANGLE_A/TRIANGLE_B are already unit, centroid-centered shapes
// (utils/triangleGeometry.js), so their own vertex coordinates give the
// child offsets directly with no extra geometry math.
function subdivideTriangle(
  x,
  y,
  scale,
  orientation,
  generation,
  params,
  rng,
  leavesA,
  leavesB
) {
  const { maxGeneration, minGeneration, splitProbability } = params;
  const leaves = orientation === 'A' ? leavesA : leavesB;
  if (
    !shouldSplit(
      generation,
      rng,
      splitProbability,
      minGeneration,
      maxGeneration
    )
  ) {
    leaves.push({ generation, scale, x, y });
    return;
  }
  const vertices =
    orientation === 'A' ? TRIANGLE_A.vertices : TRIANGLE_B.vertices;
  const childScale = scale / 2;
  vertices.forEach(([vx, vy]) => {
    subdivideTriangle(
      x + scale * vx * 0.5,
      y + scale * vy * 0.5,
      childScale,
      orientation,
      generation + 1,
      params,
      rng,
      leavesA,
      leavesB
    );
  });
  const flipped = orientation === 'A' ? 'B' : 'A';
  subdivideTriangle(
    x,
    y,
    childScale,
    flipped,
    generation + 1,
    params,
    rng,
    leavesA,
    leavesB
  );
}

export function subdivideSquareGrid({
  cols,
  rows,
  cellSize,
  seed,
  splitProbability,
  minGeneration,
  maxGeneration,
  straightTileChance,
  weaveEnabled,
  lanesEnabled,
}) {
  const rng = mulberry32(seed);
  const params = { maxGeneration, minGeneration, splitProbability };
  const originX = (-(cols - 1) * cellSize) / 2;
  const originY = (-(rows - 1) * cellSize) / 2;

  const leaves = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      subdivideSquare(
        originX + col * cellSize,
        originY + row * cellSize,
        cellSize,
        0,
        params,
        rng,
        leaves
      );
    }
  }

  const count = leaves.length;
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const motifIds = new Float32Array(count);
  const zBias = new Float32Array(count);

  leaves.forEach((leaf, i) => {
    positions[i * 3 + 0] = leaf.x;
    positions[i * 3 + 1] = leaf.y;
    positions[i * 3 + 2] = 0;
    sizes[i] = leaf.size / cellSize;
    motifIds[i] = pickMotif(
      rng,
      straightTileChance,
      weaveEnabled,
      lanesEnabled
    );
    zBias[i] = rng() * 2 - 1;
  });

  return { count, motifIds, positions, sizes, zBias };
}

export function subdivideTriangularGrid({
  cellSize,
  hexRadius,
  seed,
  splitProbability,
  minGeneration,
  maxGeneration,
  straightTileChance,
  weaveEnabled,
  lanesEnabled,
}) {
  const rng = mulberry32(seed);
  const params = { maxGeneration, minGeneration, splitProbability };
  const { positionsA, positionsB } = buildTriangularMacroPositions({
    cellSize,
    hexRadius,
  });

  const leavesA = [];
  const leavesB = [];
  positionsA.forEach(([x, y]) => {
    subdivideTriangle(x, y, cellSize, 'A', 0, params, rng, leavesA, leavesB);
  });
  positionsB.forEach(([x, y]) => {
    subdivideTriangle(x, y, cellSize, 'B', 0, params, rng, leavesA, leavesB);
  });

  const build = (leaves) => {
    const count = leaves.length;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const motifIds = new Float32Array(count);
    leaves.forEach((leaf, i) => {
      positions[i * 3 + 0] = leaf.x;
      positions[i * 3 + 1] = leaf.y;
      positions[i * 3 + 2] = 0;
      sizes[i] = leaf.scale / cellSize;
      motifIds[i] = pickTriMotif(
        rng,
        straightTileChance,
        weaveEnabled,
        lanesEnabled
      );
    });
    return { count, motifIds, positions, sizes };
  };

  const a = build(leavesA);
  const b = build(leavesB);

  return {
    countA: a.count,
    countB: b.count,
    motifIdsA: a.motifIds,
    motifIdsB: b.motifIds,
    positionsA: a.positions,
    positionsB: b.positions,
    sizesA: a.sizes,
    sizesB: b.sizes,
  };
}
