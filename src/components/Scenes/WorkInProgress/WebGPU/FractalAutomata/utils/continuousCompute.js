/* eslint-disable no-bitwise */
import {
  Fn,
  If,
  Return,
  atomicAdd,
  atomicStore,
  float,
  hash,
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

// Standalone "Continuous CA" engine, supporting two interchangeable rule
// modes that share everything else (grid, ping-pong, compaction, render
// wiring) — picked once at creation via `ruleMode` (structural in
// VoxelField.jsx: switching modes reseeds from scratch):
//
// - 'life' (default): classic 3D neighbor-counting Life-style birth/death
//   (26-neighbor Moore neighborhood). Seeds from a just-finished hierarchical
//   resolve (see `seedKernel`) so it starts from a recognizable shape rather
//   than pure noise, then evolves independently. States are 0 (dead) or
//   1/2/3 (alive, one of 3 "colors").
// - 'cyclic': classic Cyclic Cellular Automaton — a cell advances to the
//   next state in a fixed N-length cycle once enough neighbors already sit
//   at that next state (see `stepCyclicKernel`). Unlike Life, every cell is
//   always "occupied" (there's no natural dead/empty state) — states are
//   stored 1-based ([1, N], see `seedCyclicKernel`) purely so state 0 keeps
//   meaning "nothing here" consistently across compaction/rendering/palette,
//   matching the 'life' mode's convention; state 1 is simply the first point
//   in the cycle, not a quiescent background. Seeds from random noise (the
//   hierarchical resolve's shape has no meaningful mapping onto an N-length
//   cycle), and self-organizes into spiraling wave patterns from there.
//
// Both are a genuinely different kind of algorithm from growthCompute.js's
// one-shot hierarchical cube/face/edge subdivision: that one resolves a
// structure once and only cosmetically reveals it over time; these keep
// re-evaluating every cell forever.
//
// Rendering used to draw the *full* k^3 grid every frame (scale 0 for dead
// cells) since occupancy keeps changing every step, unlike growthCompute.js's
// one-time compaction. It now recompacts to just the live cells after every
// step too (compactedIndexBuf/countersBuf below) — same trick, just paid
// every tick instead of once. The live count is read back asynchronously
// (liveCountState, updated whenever a readback resolves) rather than
// awaited, so a fast step rate never stalls the render loop; VoxelField.jsx
// sets InstancedMesh.count from whatever liveCountState currently holds,
// which may lag the true count by a frame or two. The existing per-instance
// scale-gate (state.x > 0.5) is deliberately left untouched — it's what
// makes that lag harmless: any instance whose slot in compactedIndexBuf is
// momentarily stale (from a still-in-flight recompaction) reads its actual
// current state and renders at scale 0 if that cell is genuinely dead now.
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
  ruleMode = 'life',
  cyclicStates = 12,
  seed: randomSeed = 0,
}) {
  const k = getK(level);
  const totalVoxels = k * k * k;
  const isCyclic = ruleMode === 'cyclic';

  // vec2(state, unused) — kept vec2 (not just a uint buffer) so this stays a
  // drop-in for createPaletteNode/VoxelField's existing `cell.x` reads; the
  // second component is never written to anything meaningful here (no
  // baked revealTime in continuous mode — VoxelField skips the growth-
  // progress gate entirely when reading from this engine).
  const stateBuf = instancedArray(totalVoxels, 'vec2');
  const scratchBuf = instancedArray(totalVoxels, 'vec2');
  // Recomputed from scratch after every step/seed — worst-case sized since
  // the live count isn't known until compactLiveKernel finishes (same
  // approach as growthCompute.js's one-time compactedIndexBuf).
  const compactedIndexBuf = instancedArray(totalVoxels, 'uint');
  const countersBuf = instancedArray(1, 'uint').toAtomic();

  const uniforms = {
    k: uniform(k, 'uint'),
    surviveMin: uniform(3, 'uint'),
    surviveMax: uniform(10, 'uint'),
    birthMin: uniform(6, 'uint'),
    birthMax: uniform(8, 'uint'),
    seed: uniform(randomSeed >>> 0, 'uint'),
    cyclicStates: uniform(Math.max(2, cyclicStates), 'uint'),
    cyclicThreshold: uniform(4, 'uint'),
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

  // Cyclic CA has no meaningful mapping onto the hierarchical resolve's
  // shape (there's no "dead" state to grow into), so it seeds from random
  // noise instead — hash-based, same deterministic-per-seed convention as
  // growthCompute.js's seededStateNode. Stored 1-based ([1, cyclicStates])
  // so 0 keeps meaning "nothing here" everywhere else in the pipeline.
  const seedCyclicKernel = Fn(() => {
    const index = instanceIndex;
    const { x, y, z } = decomposeIndexNode(index, uniforms.k);
    const combined = uniforms.seed
      .bitXor(x.add(uint(1)).mul(uint(374761393)))
      .bitXor(y.add(uint(1)).mul(uint(83492791)))
      .bitXor(z.add(uint(1)).mul(uint(668265263)));
    const state = hash(combined)
      .mul(uniforms.cyclicStates.toFloat())
      .floor()
      .toUint()
      .add(uint(1));
    stateBuf.element(index).assign(vec2(state.toFloat(), float(0)));
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

  // Cyclic CA: a cell at state S advances to (S+1) once enough neighbors are
  // already at that next state, wrapping through a fixed N-length cycle
  // forever. Internally 0-based (currentPhase/nextPhase) since the cycle
  // itself has no notion of "empty"; converted back to the engine-wide
  // 1-based storage convention ([1, cyclicStates]) only when reading/writing
  // stateBuf/scratchBuf, so state 0 still consistently means "nothing here"
  // for compaction/rendering/palette.
  const stepCyclicKernel = Fn(() => {
    const index = instanceIndex;
    const { x, y, z } = decomposeIndexNode(index, uniforms.k);
    const ix = int(x);
    const iy = int(y);
    const iz = int(z);
    const kInt = int(uniforms.k);

    const currentStored = stateBuf.element(index).x.toUint();
    const currentPhase = currentStored.sub(uint(1));
    const nextPhase = currentPhase.add(uint(1)).mod(uniforms.cyclicStates);
    const nextStored = nextPhase.add(uint(1));

    const nextPhaseNeighborCount = uint(0).toVar();
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
        const neighborStored = readState(
          stateBuf,
          nx.toUint(),
          ny.toUint(),
          nz.toUint()
        );
        If(neighborStored.equal(nextStored), () => {
          nextPhaseNeighborCount.assign(nextPhaseNeighborCount.add(uint(1)));
        });
      });
    });

    const shouldAdvance = nextPhaseNeighborCount.greaterThanEqual(
      uniforms.cyclicThreshold
    );
    const resultStored = select(shouldAdvance, nextStored, currentStored);

    scratchBuf.element(index).assign(vec2(resultStored.toFloat(), float(0)));
  })().compute(totalVoxels);

  const copyKernel = Fn(() => {
    const index = instanceIndex;
    stateBuf.element(index).assign(scratchBuf.element(index));
  })().compute(totalVoxels);

  const clearCountersKernel = Fn(() => {
    atomicStore(countersBuf.element(0), uint(0));
  })().compute(1);

  // Plain occupancy compaction — unlike growthCompute.js's one-time pass,
  // this deliberately skips face-exposure/interior culling: it's cheap to
  // check once, but here it'd be an extra neighbor-check pass on every
  // single tick, and continuous CA's churning, porous patterns don't carry
  // the same large solid-interior fraction a grown megalith does. Plain
  // "is this cell alive" compaction already fixes the actual problem (render
  // cost tracking population instead of grid size).
  const compactLiveKernel = Fn(() => {
    const index = instanceIndex;
    If(index.greaterThanEqual(uint(totalVoxels)), () => Return());
    const state = stateBuf.element(index).x.toUint();
    If(state.equal(uint(0)), () => Return());
    const slot = atomicAdd(countersBuf.element(0), uint(1));
    compactedIndexBuf.element(slot).assign(index);
  })().compute(totalVoxels);

  // Recompaction itself (cheap GPU dispatch) runs every single step/seed,
  // unconditionally — compactedIndexBuf is never more than one tick stale.
  //
  // But the async CPU *readback* of the resulting count lags behind that by
  // design (a frame or more), and VoxelField.jsx uses this count to decide
  // how many instances to draw. Right after a step that grows the live
  // population, compactedIndexBuf already contains the newly-born cells
  // (recompact ran synchronously), but liveCountState.current still holds
  // the OLD, smaller pre-step count until its readback resolves — so the
  // newly-grown region is excluded from the draw range and invisible until
  // the readback catches up. That's the "grow a step, then that section
  // pops in a beat later" bug: not a stale buffer (fixed previously), but a
  // stale COUNT trusted to exclude data that's already there.
  //
  // compactionVersion/resolvedVersion make this decidable: VoxelField.jsx
  // only trusts liveCountState.current to shrink the draw range when
  // resolvedVersion matches the LATEST recompact's version; otherwise it
  // falls back to the safe worst case (totalVoxels — never excludes real
  // data, just briefly draws some already-hidden scale-0 instances) until a
  // readback confirms it's safe to shrink again.
  let readbackInFlight = false;
  let compactionVersion = 0;
  const liveCountState = { current: totalVoxels, resolvedVersion: 0 };

  function recompact(gl) {
    compactionVersion += 1;
    gl.compute(clearCountersKernel);
    gl.compute(compactLiveKernel);
  }

  async function refreshLiveCount(gl) {
    if (readbackInFlight) return;
    readbackInFlight = true;
    const versionAtStart = compactionVersion;
    try {
      const bytes = await gl.getArrayBufferAsync(countersBuf.value);
      [liveCountState.current] = new Uint32Array(bytes);
      liveCountState.resolvedVersion = versionAtStart;
    } finally {
      readbackInFlight = false;
    }
  }

  function isLiveCountFresh() {
    return liveCountState.resolvedVersion === compactionVersion;
  }

  function seed(gl) {
    gl.compute(isCyclic ? seedCyclicKernel : seedKernel);
    // Cyclic CA has no dead state — every cell always holds a value in
    // [1, cyclicStates], never 0, so compaction would always include
    // literally every cell. Running it anyway would double the GPU work
    // every step for zero benefit (never actually shrinks the draw range),
    // so it's skipped entirely for this mode; VoxelField.jsx renders cyclic
    // mode directly by instanceIndex instead of through compactedIndexBuf.
    if (!isCyclic) {
      recompact(gl);
      refreshLiveCount(gl);
    }
  }

  function step(gl, thresholds = {}) {
    if (isCyclic) {
      if (thresholds.cyclicThreshold !== undefined) {
        uniforms.cyclicThreshold.value = thresholds.cyclicThreshold;
      }
      gl.compute(stepCyclicKernel);
    } else {
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
    }
    gl.compute(copyKernel);
    if (!isCyclic) {
      recompact(gl);
      refreshLiveCount(gl);
    }
  }

  return {
    k,
    totalVoxels,
    stateBuf,
    compactedIndexBuf,
    liveCountState,
    isLiveCountFresh,
    ruleMode,
    isCyclic,
    // Palette's 'state' color mode needs to know how many states span the
    // gradient — 3 for 'life' (states 1/2/3), cyclicStates for 'cyclic'.
    maxState: isCyclic ? uniforms.cyclicStates.value : 3,
    seed,
    step,
  };
}
