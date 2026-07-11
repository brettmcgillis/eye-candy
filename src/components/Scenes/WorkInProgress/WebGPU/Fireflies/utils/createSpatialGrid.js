// Uniform cell-hash grid for O(n) neighbor queries, adapted from Floids'
// UnitGrid (~/dev/examples/Floids/src/world/Grid.js). That reference rebuilds
// Maps/Sets/arrays on every call, which would violate this repo's "no
// per-frame allocation in hot loops" rule at 200+ agents; this version
// counting-sorts agents into typed-array buckets that are only reallocated
// when the grid dimension itself changes (i.e. when neighborRadius moves),
// not every frame.
export default function createSpatialGrid(maxCount) {
  const order = new Int32Array(maxCount);
  const cellOf = new Int32Array(maxCount);
  let dim = 0;
  let cellStart = new Int32Array(1);
  let cursor = new Int32Array(0);
  let cellSize = 1;
  let boundsRadius = 1;

  function resize(newDim) {
    dim = newDim;
    const cellCount = dim * dim * dim;
    cellStart = new Int32Array(cellCount + 1);
    cursor = new Int32Array(cellCount);
  }

  function cellCoord(value) {
    const coord = Math.floor((value + boundsRadius) / cellSize);
    if (coord < 0) return 0;
    if (coord >= dim) return dim - 1;
    return coord;
  }

  function cellIndexOf(x, y, z) {
    const ix = cellCoord(x);
    const iy = cellCoord(y);
    const iz = cellCoord(z);
    return ix + iy * dim + iz * dim * dim;
  }

  // Rebuild the buckets for this frame's agent positions. `radius` is the
  // current neighbor-search radius (drives cell size); `radius` changing
  // (a Leva edit) is the only thing that resizes the backing arrays.
  function build(positions, count, radius, habitatBoundsRadius) {
    cellSize = Math.max(radius, 0.05);
    boundsRadius = habitatBoundsRadius;
    const newDim = Math.max(1, Math.ceil((boundsRadius * 2) / cellSize));
    if (newDim !== dim) resize(newDim);

    cellStart.fill(0);
    for (let i = 0; i < count; i += 1) {
      const idx = cellIndexOf(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );
      cellOf[i] = idx;
      cellStart[idx + 1] += 1;
    }
    for (let c = 0; c < cellStart.length - 1; c += 1) {
      cellStart[c + 1] += cellStart[c];
    }
    cursor.set(cellStart.subarray(0, cellStart.length - 1));
    for (let i = 0; i < count; i += 1) {
      const idx = cellOf[i];
      order[cursor[idx]] = i;
      cursor[idx] += 1;
    }
  }

  // Visits every other agent within `radius` of (px, py, pz), scanning only
  // the neighboring cells instead of every agent. `visit(otherIndex,
  // radiusSq)` must be a stable function reference the caller allocates once
  // (not an inline arrow recreated per agent/frame) — see
  // createFloidsSimulation.js's `visitNeighbor`.
  function forEachNeighbor(px, py, pz, radius, selfIndex, visit) {
    const radiusSq = radius * radius;
    const ix = cellCoord(px);
    const iy = cellCoord(py);
    const iz = cellCoord(pz);
    const reach = Math.max(1, Math.ceil(radius / cellSize));
    const minI = Math.max(0, ix - reach);
    const maxI = Math.min(dim - 1, ix + reach);
    const minJ = Math.max(0, iy - reach);
    const maxJ = Math.min(dim - 1, iy + reach);
    const minK = Math.max(0, iz - reach);
    const maxK = Math.min(dim - 1, iz + reach);

    for (let k = minK; k <= maxK; k += 1) {
      const kBase = k * dim * dim;
      for (let j = minJ; j <= maxJ; j += 1) {
        const rowBase = kBase + j * dim;
        const start = cellStart[minI + rowBase];
        const end = cellStart[maxI + rowBase + 1];
        for (let s = start; s < end; s += 1) {
          const other = order[s];
          if (other !== selfIndex) visit(other, radiusSq);
        }
      }
    }
  }

  return { build, forEachNeighbor };
}
