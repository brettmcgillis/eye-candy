/* eslint-disable no-bitwise */
import {
  Fn,
  If,
  float,
  instanceIndex,
  instancedArray,
  int,
  select,
  uint,
  uniform,
  vec2,
} from 'three/tsl';

import { cellIndexNode, decomposeIndexNode } from './gridIndex';
import { getK } from './ruleTables';

// Standalone "Continuous CA" engine — a classic 3D neighbor-counting
// Life-style birth/death simulation (26-neighbor Moore neighborhood). This
// is a genuinely different algorithm from growthCompute.js's one-shot
// hierarchical cube/face/edge subdivision: that one resolves a structure
// once and only cosmetically reveals it over time; this one keeps
// re-evaluating every cell forever, states being born/surviving/dying every
// tick. VoxelField.jsx seeds it from a just-finished hierarchical resolve
// (see `seedKernel`) so it starts from a recognizable shape rather than pure
// noise, then lets it evolve independently from there.
//
// Rendering can't use growthCompute.js's compaction trick (only-ever-
// occupied cells get an instance) here — occupancy keeps changing every
// step — so VoxelField renders the *full* k^3 grid in continuous mode
// (scale 0 for dead cells), which is why presets/presets.js's 'Continuous
// CA' preset defaults to a lower `level` than Default.
//
// `stateBuf` is the single, fixed buffer reference the render material's
// node graph reads — TSL node graphs can't dynamically pick between two
// buffers per draw the way plain JS step orchestration can. So instead of a
// true ping-pong pair, every step computes the next state into a second
// `scratchBuf`, then a copy kernel writes it back into `stateBuf`. That
// costs one extra full-grid pass per tick, cheap next to the neighbor-count
// pass itself.
const NEIGHBOR_OFFSETS = [];
for (let dz = -1; dz <= 1; dz += 1) {
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx !== 0 || dy !== 0 || dz !== 0) {
        NEIGHBOR_OFFSETS.push([dx, dy, dz]);
      }
    }
  }
}

export default function createContinuousFieldCompute({
  level,
  sourceStateBuf,
}) {
  const k = getK(level);
  const totalVoxels = k * k * k;

  // vec2(state, unused) — kept vec2 (not just a uint buffer) so this stays a
  // drop-in for createPaletteNode/VoxelField's existing `cell.x` reads; the
  // second component is never written to anything meaningful here (no
  // baked revealTime in continuous mode — VoxelField skips the growth-
  // progress gate entirely when reading from this engine).
  const stateBuf = instancedArray(totalVoxels, 'vec2');
  const scratchBuf = instancedArray(totalVoxels, 'vec2');

  const uniforms = {
    k: uniform(k, 'uint'),
    surviveMin: uniform(3, 'uint'),
    surviveMax: uniform(10, 'uint'),
    birthMin: uniform(6, 'uint'),
    birthMax: uniform(8, 'uint'),
  };

  const readState = (buf, x, y, z) =>
    buf.element(cellIndexNode(x, y, z, uniforms.k)).x.toUint();

  function addCounts(counters, stateNode) {
    const [c1, c2, c3] = counters;
    If(stateNode.equal(uint(1)), () => c1.assign(c1.add(uint(1))));
    If(stateNode.equal(uint(2)), () => c2.assign(c2.add(uint(1))));
    If(stateNode.equal(uint(3)), () => c3.assign(c3.add(uint(1))));
  }

  // Runs once, right after a hierarchical field finishes generating —
  // copies its resolved states in as this engine's starting point.
  const seedKernel = Fn(() => {
    const index = instanceIndex;
    const state = sourceStateBuf.element(index).x;
    stateBuf.element(index).assign(vec2(state, float(0)));
  })().compute(totalVoxels);

  const stepKernel = Fn(() => {
    const index = instanceIndex;
    const { x, y, z } = decomposeIndexNode(index, uniforms.k);
    const ix = int(x);
    const iy = int(y);
    const iz = int(z);
    const kInt = int(uniforms.k);

    const counters = [uint(0).toVar(), uint(0).toVar(), uint(0).toVar()];
    const aliveNeighbors = uint(0).toVar();

    NEIGHBOR_OFFSETS.forEach(([dx, dy, dz]) => {
      const nx = ix.add(int(dx));
      const ny = iy.add(int(dy));
      const nz = iz.add(int(dz));
      const inBounds = nx
        .greaterThanEqual(int(0))
        .and(ny.greaterThanEqual(int(0)))
        .and(nz.greaterThanEqual(int(0)))
        .and(nx.lessThan(kInt))
        .and(ny.lessThan(kInt))
        .and(nz.lessThan(kInt));
      If(inBounds, () => {
        const neighborState = readState(
          stateBuf,
          nx.toUint(),
          ny.toUint(),
          nz.toUint()
        );
        If(neighborState.notEqual(uint(0)), () =>
          aliveNeighbors.assign(aliveNeighbors.add(uint(1)))
        );
        addCounts(counters, neighborState);
      });
    });

    const current = stateBuf.element(index).x.toUint();
    const isAlive = current.notEqual(uint(0));
    const isDead = current.equal(uint(0));
    const staysAlive = isAlive
      .and(aliveNeighbors.greaterThanEqual(uniforms.surviveMin))
      .and(aliveNeighbors.lessThanEqual(uniforms.surviveMax));
    const isBorn = isDead
      .and(aliveNeighbors.greaterThanEqual(uniforms.birthMin))
      .and(aliveNeighbors.lessThanEqual(uniforms.birthMax));

    // A newborn cell takes the majority state among its live neighbors
    // (ties resolve toward state 1) — echoes how growthCompute.js's rule
    // tables pick a state from neighbor tallies, so continuous mode's
    // palette ('state' colorMode) still reads sensibly.
    const bornState = select(
      counters[0]
        .greaterThanEqual(counters[1])
        .and(counters[0].greaterThanEqual(counters[2])),
      uint(1),
      select(counters[1].greaterThanEqual(counters[2]), uint(2), uint(3))
    );

    const nextState = select(
      staysAlive,
      current,
      select(isBorn, bornState, uint(0))
    );

    scratchBuf.element(index).assign(vec2(nextState.toFloat(), float(0)));
  })().compute(totalVoxels);

  const copyKernel = Fn(() => {
    const index = instanceIndex;
    stateBuf.element(index).assign(scratchBuf.element(index));
  })().compute(totalVoxels);

  function seed(gl) {
    gl.compute(seedKernel);
  }

  function step(gl, thresholds = {}) {
    if (thresholds.surviveMin !== undefined) {
      uniforms.surviveMin.value = thresholds.surviveMin;
    }
    if (thresholds.surviveMax !== undefined) {
      uniforms.surviveMax.value = thresholds.surviveMax;
    }
    if (thresholds.birthMin !== undefined) {
      uniforms.birthMin.value = thresholds.birthMin;
    }
    if (thresholds.birthMax !== undefined) {
      uniforms.birthMax.value = thresholds.birthMax;
    }
    gl.compute(stepKernel);
    gl.compute(copyKernel);
  }

  return { k, totalVoxels, stateBuf, seed, step };
}
