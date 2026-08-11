/* eslint-disable no-bitwise */
// CROSS_H_UNDER/CROSS_V_UNDER show both straight strands at once, crossing
// at the tile center — the "_UNDER" strand gets a dashed gap right at the
// crossing (weaveGapWidth) so it reads as passing under the other, like
// knotwork. Only shown when weaveEnabled.
export const MOTIF = {
  ARC_A: 0,
  ARC_B: 1,
  STRAIGHT_H: 2,
  STRAIGHT_V: 3,
  CROSS_H_UNDER: 4,
  CROSS_V_UNDER: 5,
};

const WEAVE_CHANCE = 0.15;

// Every equilateral-triangle corner is a valid arc center — 0-2 arc at
// v0/v1/v2, 3-5 the matching straight chord (see utils/triangleGeometry.js).
export const TRI_MOTIF = {
  ARC_V0: 0,
  ARC_V1: 1,
  ARC_V2: 2,
  STRAIGHT_V0: 3,
  STRAIGHT_V1: 4,
  STRAIGHT_V2: 5,
};

// Deterministic PRNG so a given `seed` always reproduces the same layout.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickMotif(rng, straightTileChance, weaveEnabled) {
  if (weaveEnabled && rng() < WEAVE_CHANCE) {
    return rng() < 0.5 ? MOTIF.CROSS_H_UNDER : MOTIF.CROSS_V_UNDER;
  }
  if (rng() < straightTileChance) {
    return rng() < 0.5 ? MOTIF.STRAIGHT_H : MOTIF.STRAIGHT_V;
  }
  return rng() < 0.5 ? MOTIF.ARC_A : MOTIF.ARC_B;
}

function pickTriMotif(rng, straightTileChance) {
  const vertex = Math.floor(rng() * 3);
  return rng() < straightTileChance ? vertex + 3 : vertex;
}

// Axial hex distance — cells with distance <= hexRadius form a regular
// hexagon in world space (the same lattice basis used for `positionsA`/
// `positionsB` below is the standard axial-to-pixel transform for it).
function hexDistance(i, j) {
  return (Math.abs(i) + Math.abs(i + j) + Math.abs(j)) / 2;
}

export function buildSquareGrid({
  cols,
  rows,
  cellSize,
  seed,
  straightTileChance,
  weaveEnabled,
}) {
  const count = cols * rows;
  const positions = new Float32Array(count * 3);
  const motifIds = new Float32Array(count);
  const rng = mulberry32(seed);

  const originX = (-(cols - 1) * cellSize) / 2;
  const originY = (-(rows - 1) * cellSize) / 2;

  let i = 0;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      positions[i * 3 + 0] = originX + col * cellSize;
      positions[i * 3 + 1] = originY + row * cellSize;
      positions[i * 3 + 2] = 0;
      motifIds[i] = pickMotif(rng, straightTileChance, weaveEnabled);
      i += 1;
    }
  }

  return { count, motifIds, positions };
}

// A true triangular lattice: each axial cell (i, j) is a 60°/120° rhombus
// split into an "up" and a "down" equilateral triangle by its short
// diagonal (see utils/triangleGeometry.js for the two shapes).
//
// The hex-boundary test must run per TRIANGLE, not per rhombus: the up and
// down triangles sit at different fractional offsets from the rhombus's own
// (i, j) index — (i+1/3, j+1/3) and (i+2/3, j+2/3) respectively, derived by
// inverting the position formulas below — so testing `hexDistance(i, j)`
// once per rhombus and keeping both triangles is asymmetric and produces a
// jagged, not hexagonal, boundary on the sides where that offset pushes a
// triangle outside the true hexagon. Testing each triangle's own offset
// coordinate independently (confirmed by hand: hexRadius=1 yields exactly 6
// triangles, the smallest true hexagon) gives a clean hexagon, and means the
// up/down counts are not necessarily equal.
export function buildTriangularGrid({
  cellSize,
  hexRadius,
  seed,
  straightTileChance,
}) {
  const s = cellSize;
  const h = (s * Math.sqrt(3)) / 2;
  const rng = mulberry32(seed);

  // +1 padding covers the fractional offset above pulling a triangle inside
  // the hex when its rhombus's integer index would otherwise fall outside.
  const bound = hexRadius + 1;

  const positionsA = [];
  const positionsB = [];
  const motifIdsA = [];
  const motifIdsB = [];

  for (let i = -bound; i <= bound; i += 1) {
    for (let j = -bound; j <= bound; j += 1) {
      const baseX = s * (i + 0.5 * j);
      const baseY = h * j;

      if (hexDistance(i + 1 / 3, j + 1 / 3) <= hexRadius) {
        positionsA.push(baseX + 0.5 * s, baseY + h / 3, 0);
        motifIdsA.push(pickTriMotif(rng, straightTileChance));
      }
      if (hexDistance(i + 2 / 3, j + 2 / 3) <= hexRadius) {
        positionsB.push(baseX + s, baseY + (2 * h) / 3, 0);
        motifIdsB.push(pickTriMotif(rng, straightTileChance));
      }
    }
  }

  return {
    countA: motifIdsA.length,
    countB: motifIdsB.length,
    motifIdsA: Float32Array.from(motifIdsA),
    motifIdsB: Float32Array.from(motifIdsB),
    positionsA: Float32Array.from(positionsA),
    positionsB: Float32Array.from(positionsB),
  };
}
