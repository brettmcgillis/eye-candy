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
import {
  CUBE_RULE_STRIDE,
  EDGE_RULE_STRIDE,
  FACE_RULE_STRIDE,
  getK,
} from './ruleTables';

// TSL port of the hierarchical cube/face/edge subdivision CA compute kernels
// (~/dev/examples/260708_AutomataChunks/src/automata/gpuAutomata.ts's WGSL).
// The structure always resolves instantly (the timed growth-reveal-over-
// real-time animation this used to drive was removed — read as uneven, not
// organic, and was slow). Each cube/face/edge pass still bakes
// a per-cell `revealTime` — now purely a static ordering value the
// 'growthOrder' palette color mode (utils/paletteNode.js) samples for its
// gradient, not something read back per frame.
//
// Compaction deviates from the reference's approach: the reference filters
// occupied/non-stray/visible cells AND writes an indirect-draw argument
// buffer every display refresh, reaching into three.js's WebGPU backend
// internals (`backend.createIndirectStorageAttribute`) to do it — a
// low-level API this TSL/R3F app doesn't otherwise touch. This port instead
// runs compaction ONCE per regenerate: `compactVisibleKernel` atomically
// appends every occupied, non-stray, face-exposed cell's original index into
// `compactedIndexBuf`, then `dispatch()` does a single async readback of the
// resulting count and VoxelField sizes its mesh to exactly that — no
// per-frame readback, no indirect draw, no backend internals.

const BASE_FILL_TO_INT = {
  random: 0,
  state1: 1,
  state2: 2,
  state3: 3,
  split: 4,
};

function ruleIndexNode(c1, c2, c3, stride) {
  return c1.add(stride.mul(c2.add(stride.mul(c3))));
}

function cubeOriginNode(job, w, k) {
  const divisions = k.sub(uint(1)).div(w);
  return {
    x: job.mod(divisions).mul(w),
    y: job.div(divisions).mod(divisions).mul(w),
    z: job.div(divisions.mul(divisions)).mul(w),
  };
}

// Picks table[i] where i == indexNode, via a nested select() chain — TSL has
// no elseif for value expressions, so a small fixed lookup (6 faces, 12
// edges) is built this way rather than with control flow.
function selectFromTable(indexNode, table) {
  let result = table[table.length - 1];
  for (let i = table.length - 2; i >= 0; i -= 1) {
    result = select(indexNode.equal(uint(i)), table[i], result);
  }
  return result;
}

function facePointNode(origin, face, h, w) {
  const zero = uint(0);
  const xOff = selectFromTable(face, [h, h, h, h, zero, w]);
  const yOff = selectFromTable(face, [zero, w, h, h, h, h]);
  const zOff = selectFromTable(face, [h, h, zero, w, h, h]);
  return {
    x: origin.x.add(xOff),
    y: origin.y.add(yOff),
    z: origin.z.add(zOff),
  };
}

function edgePointNode(origin, edge, h, w) {
  const zero = uint(0);
  const xOff = selectFromTable(edge, [
    h,
    h,
    h,
    h,
    zero,
    w,
    zero,
    w,
    zero,
    w,
    zero,
    w,
  ]);
  const yOff = selectFromTable(edge, [
    zero,
    w,
    zero,
    w,
    h,
    h,
    h,
    h,
    zero,
    zero,
    w,
    w,
  ]);
  const zOff = selectFromTable(edge, [
    zero,
    zero,
    w,
    w,
    zero,
    zero,
    w,
    w,
    h,
    h,
    h,
    h,
  ]);
  return {
    x: origin.x.add(xOff),
    y: origin.y.add(yOff),
    z: origin.z.add(zOff),
  };
}

// Random-but-deterministic per-cell perturbation, same intent as the
// reference's maybeFlip: occasionally nudge a resolved state to a
// neighboring one so the structure doesn't look perfectly regular.
function maybeFlipNode(stateNode, x, y, z, seedUniform, flipChanceUniform) {
  const result = stateNode.toVar();
  If(
    stateNode.notEqual(uint(0)).and(flipChanceUniform.greaterThan(float(0))),
    () => {
      const combined = seedUniform
        .bitXor(x.add(uint(17)).mul(uint(73856093)))
        .bitXor(y.add(uint(31)).mul(uint(19349663)))
        .bitXor(z.add(uint(47)).mul(uint(83492791)));
      const roll = hash(combined);
      If(roll.lessThan(flipChanceUniform), () => {
        const bump = combined.bitAnd(uint(1));
        result.assign(result.add(bump).add(uint(1)).mod(uint(3)).add(uint(1)));
      });
    }
  );
  return result;
}

function seededStateNode(x, z, seedUniform) {
  const combined = seedUniform
    .bitXor(x.add(uint(1)).mul(uint(374761393)))
    .bitXor(z.add(uint(1)).mul(uint(668265263)));
  return hash(combined).mul(3).floor().toUint().add(uint(1));
}

function chooseBaseStateNode(x, z, baseFillUniform, seedUniform, kUniform) {
  const state = seededStateNode(x, z, seedUniform).toVar();
  If(baseFillUniform.equal(uint(1)), () => state.assign(uint(1)));
  If(baseFillUniform.equal(uint(2)), () => state.assign(uint(2)));
  If(baseFillUniform.equal(uint(3)), () => state.assign(uint(3)));
  If(baseFillUniform.equal(uint(4)), () => {
    const kMinus1 = kUniform.sub(uint(1)).max(uint(1));
    state.assign(
      x
        .mul(uint(3))
        .div(kMinus1)
        .add(z.mul(uint(3)).div(kMinus1))
        .mod(uint(3))
        .add(uint(1))
    );
  });
  return state;
}

// Bakes how far into the growth animation this cell reveals: levelIndex/
// levelCount, softened by a per-cell hash so cells within the same
// hierarchical level don't all pop in on the exact same frame — dialed by
// growthJitter (0 = clean level-by-level snap, 1 = fully organic stagger).
function bakeRevealTime(
  dstIndex,
  seedUniform,
  levelIndexUniform,
  levelCountUniform,
  growthJitterUniform
) {
  const levelSlice = float(1).div(levelCountUniform.toFloat());
  const cellHash = hash(dstIndex.bitXor(seedUniform));
  return levelIndexUniform
    .toFloat()
    .mul(levelSlice)
    .add(cellHash.mul(levelSlice).mul(growthJitterUniform))
    .clamp(0, 1);
}

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

// Face (6-neighborhood), not the 26-neighborhood above — this drives
// compactVisibleKernel's interior-cell culling, which cares about whether a
// face of the cube is ever exposed, not whether any neighbor exists at all.
const FACE_NEIGHBOR_OFFSETS = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

function computeLevelCount(k) {
  let count = 0;
  for (let w = k - 1; w >= 2; w = Math.floor(w / 2)) {
    count += 1;
  }
  return Math.max(1, count);
}

export default function createVoxelFieldCompute({ level, ruleTables }) {
  const k = getK(level);
  const totalVoxels = k * k * k;
  const levelCount = computeLevelCount(k);
  const maxDivisions = Math.max(1, Math.floor((k - 1) / 2));
  const maxCubeJobs = maxDivisions ** 3;
  const maxFaceJobs = maxCubeJobs * 6;
  const maxEdgeJobs = maxCubeJobs * 12;

  const stateRevealBuf = instancedArray(totalVoxels, 'vec2');
  const cubeRulesBuf = instancedArray(ruleTables.cube, 'uint');
  const faceRulesBuf = instancedArray(ruleTables.face, 'uint');
  const edgeRulesBuf = instancedArray(ruleTables.edge, 'uint');
  // Compaction output: for compacted slot i, compactedIndexBuf[i] is the
  // ORIGINAL cellIndex into stateRevealBuf — sized to the worst case (every
  // cell occupied) since the real occupied count isn't known until after
  // compactVisibleKernel runs.
  const compactedIndexBuf = instancedArray(totalVoxels, 'uint');
  const countersBuf = instancedArray(1, 'uint').toAtomic();

  const uniforms = {
    k: uniform(k, 'uint'),
    w: uniform(0, 'uint'),
    h: uniform(0, 'uint'),
    seed: uniform(0, 'uint'),
    baseFill: uniform(0, 'uint'),
    cubeJobs: uniform(0, 'uint'),
    faceJobs: uniform(0, 'uint'),
    edgeJobs: uniform(0, 'uint'),
    flipChance: uniform(0),
    levelIndex: uniform(0, 'uint'),
    levelCount: uniform(levelCount, 'uint'),
    growthJitter: uniform(0.8),
    removeStrays: uniform(1, 'uint'),
  };

  const readState = (x, y, z) =>
    stateRevealBuf.element(cellIndexNode(x, y, z, uniforms.k)).x.toUint();

  function addCounts(counters, stateNode) {
    const [c1, c2, c3] = counters;
    If(stateNode.equal(uint(1)), () => c1.assign(c1.add(uint(1))));
    If(stateNode.equal(uint(2)), () => c2.assign(c2.add(uint(1))));
    If(stateNode.equal(uint(3)), () => c3.assign(c3.add(uint(1))));
  }

  const initKernel = Fn(() => {
    const index = instanceIndex;
    const { x, y, z } = decomposeIndexNode(index, uniforms.k);
    const isBase = y.equal(uint(0));
    const baseState = chooseBaseStateNode(
      x,
      z,
      uniforms.baseFill,
      uniforms.seed,
      uniforms.k
    );
    const finalState = select(isBase, baseState, uint(0));
    const revealTime = select(isBase, float(0), float(1));
    stateRevealBuf
      .element(index)
      .assign(vec2(finalState.toFloat(), revealTime));
  })().compute(totalVoxels);

  const evalCubeKernel = Fn(() => {
    const job = instanceIndex;
    If(job.greaterThanEqual(uniforms.cubeJobs), () => Return());

    const p = cubeOriginNode(job, uniforms.w, uniforms.k);
    const counters = [uint(0).toVar(), uint(0).toVar(), uint(0).toVar()];
    addCounts(counters, readState(p.x, p.y, p.z));
    addCounts(counters, readState(p.x.add(uniforms.w), p.y, p.z));
    addCounts(counters, readState(p.x, p.y.add(uniforms.w), p.z));
    addCounts(
      counters,
      readState(p.x.add(uniforms.w), p.y.add(uniforms.w), p.z)
    );
    addCounts(counters, readState(p.x, p.y, p.z.add(uniforms.w)));
    addCounts(
      counters,
      readState(p.x.add(uniforms.w), p.y, p.z.add(uniforms.w))
    );
    addCounts(
      counters,
      readState(p.x, p.y.add(uniforms.w), p.z.add(uniforms.w))
    );
    addCounts(
      counters,
      readState(p.x.add(uniforms.w), p.y.add(uniforms.w), p.z.add(uniforms.w))
    );

    const dstX = p.x.add(uniforms.h);
    const dstY = p.y.add(uniforms.h);
    const dstZ = p.z.add(uniforms.h);
    const dstIndex = cellIndexNode(dstX, dstY, dstZ, uniforms.k);
    const ruleIdx = ruleIndexNode(
      counters[0],
      counters[1],
      counters[2],
      uint(CUBE_RULE_STRIDE)
    );
    const rawState = cubeRulesBuf.element(ruleIdx);
    const finalState = maybeFlipNode(
      rawState,
      dstX,
      dstY,
      dstZ,
      uniforms.seed,
      uniforms.flipChance
    );
    const revealTime = bakeRevealTime(
      dstIndex,
      uniforms.seed,
      uniforms.levelIndex,
      uniforms.levelCount,
      uniforms.growthJitter
    );
    stateRevealBuf
      .element(dstIndex)
      .assign(vec2(finalState.toFloat(), revealTime));
  })().compute(Math.max(1, maxCubeJobs));

  const evalFaceKernel = Fn(() => {
    const jobId = instanceIndex;
    If(jobId.greaterThanEqual(uniforms.faceJobs), () => Return());

    const cubeJob = jobId.div(uint(6));
    const face = jobId.mod(uint(6));
    const p = cubeOriginNode(cubeJob, uniforms.w, uniforms.k);
    const { w, h } = uniforms;
    const center = readState(p.x.add(h), p.y.add(h), p.z.add(h));
    const counters = [uint(0).toVar(), uint(0).toVar(), uint(0).toVar()];

    If(face.lessThan(uint(2)), () => {
      const yy = select(face.equal(uint(0)), p.y, p.y.add(w));
      addCounts(counters, readState(p.x, yy, p.z));
      addCounts(counters, readState(p.x.add(w), yy, p.z));
      addCounts(counters, readState(p.x, yy, p.z.add(w)));
      addCounts(counters, readState(p.x.add(w), yy, p.z.add(w)));
    });
    If(face.greaterThanEqual(uint(2)).and(face.lessThan(uint(4))), () => {
      const zz = select(face.equal(uint(2)), p.z, p.z.add(w));
      addCounts(counters, readState(p.x, p.y, zz));
      addCounts(counters, readState(p.x.add(w), p.y, zz));
      addCounts(counters, readState(p.x, p.y.add(w), zz));
      addCounts(counters, readState(p.x.add(w), p.y.add(w), zz));
    });
    If(face.greaterThanEqual(uint(4)), () => {
      const xx = select(face.equal(uint(4)), p.x, p.x.add(w));
      addCounts(counters, readState(xx, p.y, p.z));
      addCounts(counters, readState(xx, p.y.add(w), p.z));
      addCounts(counters, readState(xx, p.y, p.z.add(w)));
      addCounts(counters, readState(xx, p.y.add(w), p.z.add(w)));
    });
    addCounts(counters, center);
    addCounts(counters, center);

    const dst = facePointNode(p, face, h, w);
    const dstIndex = cellIndexNode(dst.x, dst.y, dst.z, uniforms.k);
    const ruleIdx = ruleIndexNode(
      counters[0],
      counters[1],
      counters[2],
      uint(FACE_RULE_STRIDE)
    );
    const rawState = faceRulesBuf.element(ruleIdx);
    const finalState = maybeFlipNode(
      rawState,
      dst.x,
      dst.y,
      dst.z,
      uniforms.seed,
      uniforms.flipChance
    );
    const revealTime = bakeRevealTime(
      dstIndex,
      uniforms.seed,
      uniforms.levelIndex,
      uniforms.levelCount,
      uniforms.growthJitter
    );
    stateRevealBuf
      .element(dstIndex)
      .assign(vec2(finalState.toFloat(), revealTime));
  })().compute(Math.max(1, maxFaceJobs));

  const evalEdgeKernel = Fn(() => {
    const jobId = instanceIndex;
    If(jobId.greaterThanEqual(uniforms.edgeJobs), () => Return());

    const cubeJob = jobId.div(uint(12));
    const edge = jobId.mod(uint(12));
    const p = cubeOriginNode(cubeJob, uniforms.w, uniforms.k);
    const { h } = uniforms;
    const dst = edgePointNode(p, edge, h, uniforms.w);
    const counters = [uint(0).toVar(), uint(0).toVar(), uint(0).toVar()];

    addCounts(counters, readState(dst.x, dst.y, dst.z));
    addCounts(counters, readState(p.x.add(h), p.y.add(h), p.z.add(h)));
    If(dst.x.greaterThan(uint(0)), () =>
      addCounts(counters, readState(dst.x.sub(h), dst.y, dst.z))
    );
    If(dst.y.greaterThan(uint(0)), () =>
      addCounts(counters, readState(dst.x, dst.y.sub(h), dst.z))
    );
    If(dst.z.greaterThan(uint(0)), () =>
      addCounts(counters, readState(dst.x, dst.y, dst.z.sub(h)))
    );
    If(dst.x.add(h).lessThan(uniforms.k), () =>
      addCounts(counters, readState(dst.x.add(h), dst.y, dst.z))
    );
    If(dst.y.add(h).lessThan(uniforms.k), () =>
      addCounts(counters, readState(dst.x, dst.y.add(h), dst.z))
    );
    If(dst.z.add(h).lessThan(uniforms.k), () =>
      addCounts(counters, readState(dst.x, dst.y, dst.z.add(h)))
    );

    const dstIndex = cellIndexNode(dst.x, dst.y, dst.z, uniforms.k);
    const ruleIdx = ruleIndexNode(
      counters[0],
      counters[1],
      counters[2],
      uint(EDGE_RULE_STRIDE)
    );
    const rawState = edgeRulesBuf.element(ruleIdx);
    const finalState = maybeFlipNode(
      rawState,
      dst.x,
      dst.y,
      dst.z,
      uniforms.seed,
      uniforms.flipChance
    );
    const revealTime = bakeRevealTime(
      dstIndex,
      uniforms.seed,
      uniforms.levelIndex,
      uniforms.levelCount,
      uniforms.growthJitter
    );
    stateRevealBuf
      .element(dstIndex)
      .assign(vec2(finalState.toFloat(), revealTime));
  })().compute(Math.max(1, maxEdgeJobs));

  const finalizeStraysKernel = Fn(() => {
    const index = instanceIndex;
    If(index.greaterThanEqual(uint(totalVoxels)), () => Return());
    If(uniforms.removeStrays.equal(uint(0)), () => Return());

    const cell = stateRevealBuf.element(index);
    const state = cell.x.toUint();
    If(state.equal(uint(0)), () => Return());

    const { x, y, z } = decomposeIndexNode(index, uniforms.k);
    const ix = int(x);
    const iy = int(y);
    const iz = int(z);
    const kInt = int(uniforms.k);
    const found = uint(0).toVar();

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
        const neighborIndex = cellIndexNode(
          nx.toUint(),
          ny.toUint(),
          nz.toUint(),
          uniforms.k
        );
        If(
          stateRevealBuf.element(neighborIndex).x.toUint().notEqual(uint(0)),
          () => {
            found.assign(uint(1));
          }
        );
      });
    });

    If(found.equal(uint(0)), () => {
      stateRevealBuf.element(index).assign(vec2(float(0), cell.y));
    });
  })().compute(totalVoxels);

  const clearCountersKernel = Fn(() => {
    atomicStore(countersBuf.element(0), uint(0));
  })().compute(1);

  // Runs once, after finalizeStraysKernel — occupancy is fully resolved by
  // then. Every cell with a non-zero state AND at least one exposed face
  // (a face-neighbor that's out of bounds or empty in the final structure)
  // atomically claims the next compacted slot and records its own original
  // index there. Cells whose 6 face-neighbors are all occupied are never
  // visible and get excluded — there's no more animated reveal to account
  // for (removed), so this only needs to reason about the FINAL state, not
  // a transient reveal-order window.
  const compactVisibleKernel = Fn(() => {
    const index = instanceIndex;
    If(index.greaterThanEqual(uint(totalVoxels)), () => Return());
    const cell = stateRevealBuf.element(index);
    const state = cell.x.toUint();
    If(state.equal(uint(0)), () => Return());

    const { x, y, z } = decomposeIndexNode(index, uniforms.k);
    const ix = int(x);
    const iy = int(y);
    const iz = int(z);
    const kInt = int(uniforms.k);
    const exposed = uint(0).toVar();

    FACE_NEIGHBOR_OFFSETS.forEach(([dx, dy, dz]) => {
      const nx = ix.add(int(dx));
      const ny = iy.add(int(dy));
      const nz = iz.add(int(dz));
      const outOfBounds = nx
        .lessThan(int(0))
        .or(ny.lessThan(int(0)))
        .or(nz.lessThan(int(0)))
        .or(nx.greaterThanEqual(kInt))
        .or(ny.greaterThanEqual(kInt))
        .or(nz.greaterThanEqual(kInt));

      If(outOfBounds, () => {
        exposed.assign(uint(1));
      });

      If(outOfBounds.not(), () => {
        const neighborIndex = cellIndexNode(
          nx.toUint(),
          ny.toUint(),
          nz.toUint(),
          uniforms.k
        );
        const neighborState = stateRevealBuf.element(neighborIndex).x.toUint();
        If(neighborState.equal(uint(0)), () => {
          exposed.assign(uint(1));
        });
      });
    });

    If(exposed.equal(uint(0)), () => Return());

    const slot = atomicAdd(countersBuf.element(0), uint(1));
    compactedIndexBuf.element(slot).assign(index);
  })().compute(totalVoxels);

  async function dispatch(gl, settings) {
    uniforms.seed.value = settings.seed >>> 0;
    uniforms.baseFill.value = BASE_FILL_TO_INT[settings.baseFill] ?? 0;
    uniforms.flipChance.value = settings.flipChance;
    uniforms.growthJitter.value = settings.growthJitter;
    uniforms.removeStrays.value = settings.removeStrays ? 1 : 0;

    gl.compute(initKernel);

    let levelIndex = 0;
    for (let w = k - 1; w >= 2; w = Math.floor(w / 2)) {
      const divisions = (k - 1) / w;
      const cubeJobs = divisions ** 3;
      const faceJobs = cubeJobs * 6;
      const edgeJobs = cubeJobs * 12;
      uniforms.w.value = w;
      uniforms.h.value = Math.floor(w / 2);
      uniforms.cubeJobs.value = cubeJobs;
      uniforms.faceJobs.value = faceJobs;
      uniforms.edgeJobs.value = edgeJobs;
      uniforms.levelIndex.value = levelIndex;
      gl.compute(evalCubeKernel, cubeJobs);
      gl.compute(evalFaceKernel, faceJobs);
      gl.compute(evalEdgeKernel, edgeJobs);
      levelIndex += 1;
    }

    gl.compute(finalizeStraysKernel);

    gl.compute(clearCountersKernel);
    gl.compute(compactVisibleKernel);
    const counterBytes = await gl.getArrayBufferAsync(countersBuf.value);
    return new Uint32Array(counterBytes)[0];
  }

  return {
    stateRevealBuf,
    compactedIndexBuf,
    dispatch,
    totalVoxels,
    k,
    levelCount,
  };
}
