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

// GPU port of "recursive subdivision" from Adam Smith's "Two Methods for
// Voxel Detail Enhancement" (PCGames 2011), generalized into two independent
// modes rather than the paper's single uniform-everywhere pass (see
// @jaymezd's own "Recursive Voxel Subdivision" study, which generalizes the
// same paper in a similar spirit — large clean strata with detail
// concentrated at edges/corners, not uniform fine-graining):
//
// - EROSION (subtractive): an originally-SOLID coarse voxel is replaced by
//   its finer, chipped/rougher fragments. VoxelField.jsx zeroes these voxels
//   out of the state array fed to the existing (unmodified) greedy-mesh
//   "kept" representation, so the eroded region disappears from the kept
//   mesh and reappears only as this module's fine fragments — one array,
//   one zeroing pass, no way for the two to disagree about the same cell.
// - GROWTH (additive): an originally-EMPTY coarse voxel next to solid
//   material gets fine fragments added into it (debris/growth bleeding
//   outward into the air pocket). Never touches the kept mesh at all, since
//   these voxels were already air.
//
// Both draw from the SAME per-cell boundary test (occupancy differs from a
// face neighbor) but roll against INDEPENDENT coverage rates
// (`erosionCoverage`/`growthCoverage`), so each can be dialed separately —
// e.g. heavy erosion concentrated at edges, light scattered growth debris.
// A coarse voxel is either solid or empty, never both, so the two modes (and
// the untouched "kept" tier) partition the grid into three fully disjoint
// sets by construction — no cell can ever end up in two of them, which is
// what actually rules out the tier-vs-tier z-fighting this module used to
// risk when "kept" was its own separate, newly-written InstancedMesh instead
// of the proven greedy-mesh path.
//
// SPARSE, two-stage compaction (this is the part that changed): candidate
// coarse voxels (chosen by markSubdivideKernel below) are first compacted
// into a small, k³-sized list (candidateCoarseIndexBuf/candidateSlotBuf) —
// cheap regardless of level, same class of buffer as subdivideFlagBuf. Only
// AFTER that candidate count is read back from the GPU are the actual fine
// fragment buffers (fineStateBuf etc.) allocated, sized to
// `candidateCount * 8` — the fragments a flagged voxel's 2x2x2 block
// actually produces — instead of a dense `(2k)³` cube covering every
// possible fine cell whether or not its parent was ever flagged. At Level 7
// the dense cube needed a 137MB single storage-buffer binding (exceeding
// WebGPU's 128MB default limit — the crash this replaced); the sparse
// buffers scale with how much of the structure is actually being detailed,
// which coverage-gating already keeps small. It also means a further
// (quarter-size) detail level is no longer blocked by needing its own dense
// `(4k)³` buffer — it would run this same candidate-then-fragment pattern
// one level deeper, sized off ITS OWN exposed-fragment count.
//
// Cross-coarse-boundary neighbor lookups (compactDetailKernel, deciding
// which fragments are actually exposed and worth keeping) use
// candidateSlotBuf to find a face-adjacent coarse voxel's fragments when
// that neighbor is ALSO a candidate. When it isn't, this treats the
// boundary as exposed rather than reading the neighbor's actual coarse
// state — matching what the original dense implementation did (a
// non-candidate coarse voxel's region of the dense fine buffer was simply
// never written, defaulting to "empty"), so this stays a pure memory-layout
// change, not a meshing-behavior change.
//
// Fragment generation itself (per flagged voxel, its 2x2x2 block of 8 fine
// fragments, each decided by counting {the voxel, its neighbor in the
// fragment's octant direction on X, same for Y, same for Z} against a
// threshold — the paper's §2 rule, max count 4) is identical for both modes;
// only candidate SELECTION (which voxels get flagged at all) differs.
//
// RECURSIVE subdivision (createRecursiveDetailLevel, VoxelDetail's
// `subdivisionLevels` control): a single level can only ever chip off up to
// one octant's worth of a voxel — every fragment keeps at least one solid
// neighbor unless ALL 3 of its sampled axes point into open air, so there's
// no way for a single pass to thin material out gradually across scales
// (16->8->4->2->1, the @jaymezd reference's actual look) — it reads as
// "voxels getting culled," not eroded. Each further level reruns the same
// candidate-then-fragment pattern on the PREVIOUS level's own surviving
// (solid, exposed) fragments instead of the base dense grid — there is no
// dense grid at these depths, so neighbor lookups address fragments purely
// by their `s*8+o` slot (see sampleAxisNeighborState) and approximate any
// neighbor that isn't a same-parent-block sibling as empty, rather than
// walking the exact chain of parent candidates level 1's compactDetailKernel
// does via candidateSlotBuf. That trades a small amount of accuracy at
// deeper block seams (an occasional extra exposed micro-face at a boundary
// that would, walked exactly, have touched more solid material) for
// tractable implementation — re-deriving which candidate (if any) owns a
// neighboring block gets one hop deeper per level, and the target look is
// already chipped/faceted, where a stray seam face reads as texture, not a
// defect. Deeper levels only ever erode (a fragment that survived to be
// exposed is solid by construction, so growthCoverage — which only ever
// applied to originally-EMPTY cells — has nothing left to act on past level
// 1) and skip altitude variance (no cheap absolute world-Y at this depth).

const FACE_NEIGHBOR_OFFSETS = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

const OCTANTS = [];
for (let oz = 0; oz <= 1; oz += 1) {
  for (let oy = 0; oy <= 1; oy += 1) {
    for (let ox = 0; ox <= 1; ox += 1) {
      OCTANTS.push([ox, oy, oz]);
    }
  }
}

// Bit position of each axis within the packed 3-bit octant index
// (ox + oy*2 + oz*4, matching OCTANTS' own push order above) — XORing a
// fragment's octant index with one of these flips exactly that axis, which
// is how compactDetailKernel walks to a face-adjacent fragment whether it
// lives in the same coarse voxel's block or a different one.
const AXIS_BIT = { x: 1, y: 2, z: 4 };

function octantIndexOf(ox, oy, oz) {
  return ox + oy * 2 + oz * 4;
}

// CPU-side sibling of the coarse↔fine decomposition — VoxelField.jsx bakes
// tier geometry (see bakeTierMesh) rather than rendering it through a live
// shader, so it needs a plain-JS version of the same index math to place
// each fragment while building geometry on the CPU. Decodes a fragment slot
// (s*8+o — see buildEvalDetailKernel) back into its FINE grid [x,y,z].
// `candidateCoarseIndexArray` is candidateCoarseIndexBuf's own values, read
// back once per regenerate. `coarseK` is the COARSE grid's k (not fineK).
export function decomposeFragmentCpu(
  fragSlot,
  candidateCoarseIndexArray,
  coarseK
) {
  const s = Math.floor(fragSlot / 8);
  const o = fragSlot % 8;
  const coarseIndex = candidateCoarseIndexArray[s];
  const cx = coarseIndex % coarseK;
  const cy = Math.floor(coarseIndex / coarseK) % coarseK;
  const cz = Math.floor(coarseIndex / (coarseK * coarseK));
  const ox = o % 2;
  const oy = Math.floor(o / 2) % 2;
  const oz = Math.floor(o / 4);
  return [cx * 2 + ox, cy * 2 + oy, cz * 2 + oz];
}

// Checks one face-neighbor direction for a fragment during
// compactDetailKernel, flipping `exposed` to 1 if that neighbor is empty
// (or doesn't exist as a fragment at all). `direction` is a plain JS -1/1.
function checkFaceNeighbor({
  exposed,
  s,
  o,
  axisLocal,
  axisIntCoord,
  axisBit,
  direction,
  buildNeighborIndex,
  kInt,
  fineStateBuf,
  candidateSlotBuf,
}) {
  const flippedOctant = o.bitXor(uint(axisBit));
  const staysInBlock =
    direction === -1 ? axisLocal.equal(uint(1)) : axisLocal.equal(uint(0));

  If(staysInBlock, () => {
    const siblingFrag = s.mul(uint(8)).add(flippedOctant);
    If(fineStateBuf.element(siblingFrag).x.toUint().equal(uint(0)), () => {
      exposed.assign(uint(1));
    });
  });

  If(staysInBlock.not(), () => {
    const neighborAxisCoord = axisIntCoord.add(int(direction));
    const outOfRange = neighborAxisCoord
      .lessThan(int(0))
      .or(neighborAxisCoord.greaterThanEqual(kInt));
    If(outOfRange, () => {
      exposed.assign(uint(1));
    });
    If(outOfRange.not(), () => {
      const neighborCoarseIndex = buildNeighborIndex(
        neighborAxisCoord.toUint()
      );
      const raw = candidateSlotBuf.element(neighborCoarseIndex);
      If(raw.equal(uint(0)), () => {
        exposed.assign(uint(1));
      });
      If(raw.notEqual(uint(0)), () => {
        const neighborSlot = raw.sub(uint(1));
        const neighborFrag = neighborSlot.mul(uint(8)).add(flippedOctant);
        If(fineStateBuf.element(neighborFrag).x.toUint().equal(uint(0)), () => {
          exposed.assign(uint(1));
        });
      });
    });
  });
}

// Reads the state of a candidate's axis-neighbor at levels 2+, where there's
// no dense grid to index into — only the same-parent-block sibling
// (`s*8 + o^axisBit`) is ever looked up exactly; a neighbor that would cross
// out of the block is approximated as empty (state 0). `wantPositive` is a
// plain JS bool (always known at kernel-build time — called either from a
// fixed OCTANTS.forEach entry or a fixed direction list, never from a
// runtime value), so which case applies is resolved once per call site, not
// per GPU invocation. Whether the sibling actually sits in the wanted
// direction depends on the octant's own bit for that axis: bit 0 means this
// fragment occupies the block's low side, so its sibling (bit flipped to 1)
// is the block's high (+) side, and vice-versa.
function sampleAxisNeighborState({
  parentStateBuf,
  s,
  o,
  axisBit,
  wantPositive,
}) {
  const bitIsSet = o.bitAnd(uint(axisBit)).notEqual(uint(0));
  const staysInBlock = wantPositive ? bitIsSet.not() : bitIsSet;
  const flippedOctant = o.bitXor(uint(axisBit));
  const siblingSlot = s.mul(uint(8)).add(flippedOctant);
  const siblingState = parentStateBuf.element(siblingSlot).x.toUint();
  return select(staysInBlock, siblingState, uint(0));
}

// CPU-side sibling of the level-2+ decomposition, for the same reason as
// decomposeFragmentCpu above. Decodes a level-2+ fragment slot back into its
// FINE grid [x,y,z], walking back down through each level's own candidate-
// to-parent-slot array until it reaches a level-1 slot, then finishing with
// the same coarse-voxel lookup decomposeFragmentCpu uses.
// `levelParentSlotArrays` is ordered deepest-first: index 0 is THIS level's
// own candidateParentSlotBuf values (mapping ITS candidate index to a
// level-(N-1) fragment slot), the last entry is level 2's (mapping to a
// level-1 slot) — each read back once per regenerate, same as
// candidateCoarseIndexArray. Each level contributes one more bit of
// resolution to the coordinate — the deepest level's octant is the least-
// significant bit, level 1's is the most significant among the fragment
// bits — exactly mirroring how binary place values compose, which is what
// makes this a plain loop rather than anything recursive.
export function decomposeRecursiveFragmentCpu(
  fragSlot,
  levelParentSlotArrays,
  candidateCoarseIndexArray,
  coarseK
) {
  let currentSlot = fragSlot;
  let accumX = 0;
  let accumY = 0;
  let accumZ = 0;

  for (let i = 0; i < levelParentSlotArrays.length; i += 1) {
    const s = Math.floor(currentSlot / 8);
    const o = currentSlot % 8;
    const scale = 1 << i;
    accumX += (o % 2) * scale;
    accumY += (Math.floor(o / 2) % 2) * scale;
    accumZ += Math.floor(o / 4) * scale;
    currentSlot = levelParentSlotArrays[i][s];
  }

  const s1 = Math.floor(currentSlot / 8);
  const o1 = currentSlot % 8;
  const coarseIndex = candidateCoarseIndexArray[s1];
  const cx = coarseIndex % coarseK;
  const cy = Math.floor(coarseIndex / coarseK) % coarseK;
  const cz = Math.floor(coarseIndex / (coarseK * coarseK));
  const level1Scale = 1 << levelParentSlotArrays.length;
  accumX += (o1 % 2) * level1Scale;
  accumY += (Math.floor(o1 / 2) % 2) * level1Scale;
  accumZ += Math.floor(o1 / 4) * level1Scale;

  const totalScale = 1 << (levelParentSlotArrays.length + 1);
  return [
    cx * totalScale + accumX,
    cy * totalScale + accumY,
    cz * totalScale + accumZ,
  ];
}

// One further subdivision pass on top of a previous level's own surviving
// (solid, exposed) fragments — see the module comment's "RECURSIVE
// subdivision" section for why this exists and what it approximates.
// Candidate selection only iterates the previous level's EXPOSED-compacted
// list (never-visible interior fragments aren't worth subdividing further —
// nothing downstream can ever expose them, since this is a one-shot
// decision, not simulated erosion over time), but sibling lookups during
// that selection and during fragment generation read the previous level's
// FULL per-slot state buffer, since a sibling can be solid-but-interior
// (not itself in the exposed list) and still needs to count.
export function createRecursiveDetailLevel() {
  const candidateCounterBuf = instancedArray(1, 'uint').toAtomic();
  const clearCandidateCounterKernel = Fn(() => {
    atomicStore(candidateCounterBuf.element(0), uint(0));
  })().compute(1);

  function buildMarkAndCompactKernel({
    parentStateBuf,
    parentExposedIndexBuf,
    parentExposedCount,
    candidateParentSlotBuf,
    uniforms,
  }) {
    return Fn(() => {
      const i = instanceIndex;
      If(i.greaterThanEqual(uint(parentExposedCount)), () => Return());
      const parentSlot = parentExposedIndexBuf.element(i);
      const s = parentSlot.div(uint(8));
      const o = parentSlot.mod(uint(8));
      // Every candidate here is solid by construction (only solid fragments
      // ever reach the exposed-compacted list) — differingCount only needs
      // the solid-vs-solid/empty comparison, not a separate empty-center
      // branch.
      const differingCount = uint(0).toVar();
      [1, 2, 4].forEach((axisBit) => {
        [true, false].forEach((wantPositive) => {
          const neighborState = sampleAxisNeighborState({
            parentStateBuf,
            s,
            o,
            axisBit,
            wantPositive,
          });
          If(neighborState.equal(uint(0)), () => {
            differingCount.assign(differingCount.add(uint(1)));
          });
        });
      });

      const isCandidate = differingCount.greaterThanEqual(
        uniforms.minSharpness
      );
      const roll = hash(parentSlot.bitXor(uniforms.seed));
      If(isCandidate.and(roll.lessThan(uniforms.erosionCoverage)).not(), () =>
        Return()
      );

      const slot = atomicAdd(candidateCounterBuf.element(0), uint(1));
      candidateParentSlotBuf.element(slot).assign(parentSlot);
    })().compute(Math.max(1, parentExposedCount));
  }

  function buildEvalKernel({
    parentStateBuf,
    candidateParentSlotBuf,
    candidateCount,
    fineStateBuf,
    uniforms,
  }) {
    return Fn(() => {
      const c = instanceIndex;
      If(c.greaterThanEqual(uint(candidateCount)), () => Return());
      const parentSlot = candidateParentSlotBuf.element(c);
      const s = parentSlot.div(uint(8));
      const o = parentSlot.mod(uint(8));
      const centerState = parentStateBuf.element(parentSlot).x.toUint();

      OCTANTS.forEach(([ox, oy, oz]) => {
        const xState = sampleAxisNeighborState({
          parentStateBuf,
          s,
          o,
          axisBit: AXIS_BIT.x,
          wantPositive: ox === 1,
        });
        const yState = sampleAxisNeighborState({
          parentStateBuf,
          s,
          o,
          axisBit: AXIS_BIT.y,
          wantPositive: oy === 1,
        });
        const zState = sampleAxisNeighborState({
          parentStateBuf,
          s,
          o,
          axisBit: AXIS_BIT.z,
          wantPositive: oz === 1,
        });

        const count = select(centerState.notEqual(uint(0)), uint(1), uint(0))
          .add(select(xState.notEqual(uint(0)), uint(1), uint(0)))
          .add(select(yState.notEqual(uint(0)), uint(1), uint(0)))
          .add(select(zState.notEqual(uint(0)), uint(1), uint(0)));
        const solid = count.greaterThanEqual(uniforms.threshold);

        const fragmentState = select(
          centerState.notEqual(uint(0)),
          centerState,
          select(
            xState.notEqual(uint(0)),
            xState,
            select(yState.notEqual(uint(0)), yState, zState)
          )
        );
        const finalState = select(solid, fragmentState, uint(0));

        const fragSlot = c.mul(uint(8)).add(uint(octantIndexOf(ox, oy, oz)));
        fineStateBuf
          .element(fragSlot)
          .assign(vec2(finalState.toFloat(), float(1)));
      });
    })().compute(Math.max(1, candidateCount));
  }

  // A level-1 fragment that gets picked as a level-2 candidate (etc. one
  // level deeper) is conceptually replaced by its own children — but
  // nothing else shrinks its PARENT tier's own render list to match (that
  // list, `parentExposedIndexBuf`, was fixed before this level ever ran).
  // Without this, both the parent fragment (still rendering, unaware it was
  // subdivided further) and its new children render at the same position —
  // the tier-vs-tier z-fighting this module's coarse↔level-1 boundary
  // already avoids via subdivideFlagBuf/subtractSubdivided (VoxelField.jsx).
  // Zeroing parentStateBuf's state (not removing it from the buffer — nothing
  // downstream, including THIS level's own eval kernel while other
  // candidates are still using their own untouched siblings, reads it as
  // anything but "this cell is now empty") is what the parent tier's live
  // shader-gated InstancedMesh already treats as invisible (scale 0),
  // exactly like showState*/bounds* hiding elsewhere in this pipeline — no
  // separate compaction pass needed. MUST run only after buildEvalKernel has
  // finished ALL its reads of parentStateBuf (including sibling lookups for
  // OTHER still-in-flight candidates) — zeroing any earlier would corrupt
  // those candidates' own fragment generation.
  function buildZeroParentKernel({
    candidateParentSlotBuf,
    candidateCount,
    parentStateBuf,
  }) {
    return Fn(() => {
      const c = instanceIndex;
      If(c.greaterThanEqual(uint(candidateCount)), () => Return());
      const parentSlot = candidateParentSlotBuf.element(c);
      parentStateBuf.element(parentSlot).assign(vec2(float(0), float(1)));
    })().compute(Math.max(1, candidateCount));
  }

  function buildCompactKernel({
    fragCount,
    fineStateBuf,
    fineExposedCompactedBuf,
    fineExposedCounterBuf,
  }) {
    return Fn(() => {
      const f = instanceIndex;
      If(f.greaterThanEqual(uint(fragCount)), () => Return());
      const state = fineStateBuf.element(f).x.toUint();
      If(state.equal(uint(0)), () => Return());

      const s = f.div(uint(8));
      const o = f.mod(uint(8));
      const exposed = uint(0).toVar();
      [1, 2, 4].forEach((axisBit) => {
        [true, false].forEach((wantPositive) => {
          const neighborState = sampleAxisNeighborState({
            parentStateBuf: fineStateBuf,
            s,
            o,
            axisBit,
            wantPositive,
          });
          If(neighborState.equal(uint(0)), () => {
            exposed.assign(uint(1));
          });
        });
      });

      If(exposed.equal(uint(0)), () => Return());
      const slot = atomicAdd(fineExposedCounterBuf.element(0), uint(1));
      fineExposedCompactedBuf.element(slot).assign(f);
    })().compute(Math.max(1, fragCount));
  }

  async function dispatch(
    gl,
    {
      parentStateBuf,
      parentExposedIndexBuf,
      parentExposedCount,
      seed,
      seedSalt,
      settings,
    }
  ) {
    const uniforms = {
      minSharpness: uniform(settings.detailMinSharpness, 'uint'),
      threshold: uniform(settings.detailThreshold, 'uint'),
      erosionCoverage: uniform(settings.erosionCoverage),
      seed: uniform((seed ^ seedSalt) >>> 0, 'uint'),
    };

    const candidateParentSlotBuf = instancedArray(
      Math.max(1, parentExposedCount),
      'uint'
    );

    gl.compute(clearCandidateCounterKernel);
    const markKernel = buildMarkAndCompactKernel({
      parentStateBuf,
      parentExposedIndexBuf,
      parentExposedCount,
      candidateParentSlotBuf,
      uniforms,
    });
    gl.compute(markKernel);

    const candidateCounterBytes = await gl.getArrayBufferAsync(
      candidateCounterBuf.value
    );
    const candidateCount = new Uint32Array(candidateCounterBytes)[0];
    const fragCount = candidateCount * 8;

    const fineStateBuf = instancedArray(Math.max(1, fragCount), 'vec2');
    const fineExposedCompactedBuf = instancedArray(
      Math.max(1, fragCount),
      'uint'
    );
    const fineExposedCounterBuf = instancedArray(1, 'uint').toAtomic();

    const evalKernel = buildEvalKernel({
      parentStateBuf,
      candidateParentSlotBuf,
      candidateCount,
      fineStateBuf,
      uniforms,
    });
    gl.compute(evalKernel);

    // Only now — after evalKernel's last read of parentStateBuf — is it
    // safe to zero out the candidates it just subdivided (see
    // buildZeroParentKernel's comment). This is what stops the parent
    // tier's own mesh from still rendering fragments that were just
    // replaced by these children.
    const zeroParentKernel = buildZeroParentKernel({
      candidateParentSlotBuf,
      candidateCount,
      parentStateBuf,
    });
    gl.compute(zeroParentKernel);

    const clearExposedKernel = Fn(() => {
      atomicStore(fineExposedCounterBuf.element(0), uint(0));
    })().compute(1);
    gl.compute(clearExposedKernel);

    const compactKernel = buildCompactKernel({
      fragCount,
      fineStateBuf,
      fineExposedCompactedBuf,
      fineExposedCounterBuf,
    });
    gl.compute(compactKernel);

    const exposedCounterBytes = await gl.getArrayBufferAsync(
      fineExposedCounterBuf.value
    );
    const fineCount = new Uint32Array(exposedCounterBytes)[0];

    return {
      candidateParentSlotBuf,
      fineStateBuf,
      fineExposedCompactedBuf,
      fineCount,
    };
  }

  return { dispatch };
}

export default function createDetailEnhanceCompute({ k }) {
  const totalVoxels = k * k * k;
  const fineK = k * 2;

  // 1 if this coarse voxel was chosen for detail (either mode — see module
  // comment), 0 if it stays untouched in the kept/greedy-mesh tier.
  // VoxelField.jsx reads this back to zero eroded (originally-solid) voxels
  // out of the kept tier's own state array before meshing.
  const subdivideFlagBuf = instancedArray(totalVoxels, 'uint');
  // 0 = this coarse voxel isn't a detail candidate; candidate slot+1
  // otherwise (see compactCandidatesKernel). The +1 offset is what lets 0
  // double as "not a candidate" with no separate sentinel pass, relying on
  // WebGPU's zero-initialized storage buffers.
  const candidateSlotBuf = instancedArray(totalVoxels, 'uint');
  // candidateCoarseIndexBuf[slot] = original coarse cellIndex — the inverse
  // of candidateSlotBuf, worst-case sized (every voxel a candidate), same
  // pattern as growthCompute.js's own compactedIndexBuf.
  const candidateCoarseIndexBuf = instancedArray(totalVoxels, 'uint');
  const candidateCounterBuf = instancedArray(1, 'uint').toAtomic();

  const uniforms = {
    threshold: uniform(2, 'uint'),
    thresholdHigh: uniform(3, 'uint'),
    altitudeVarianceEnabled: uniform(0, 'uint'),
    erosionCoverage: uniform(0.25),
    growthCoverage: uniform(0.25),
    minSharpness: uniform(2, 'uint'),
    seed: uniform(0, 'uint'),
  };

  // x/y/z are int nodes that may fall outside [0, k). Clamped before use so
  // the buffer read is always in-bounds; `select` below then zeroes out
  // (treats as empty/air) whatever the clamp papered over.
  function readCoarseState(coarseStateBuf, kUint, x, y, z) {
    const kInt = int(kUint);
    const inBounds = x
      .greaterThanEqual(int(0))
      .and(y.greaterThanEqual(int(0)))
      .and(z.greaterThanEqual(int(0)))
      .and(x.lessThan(kInt))
      .and(y.lessThan(kInt))
      .and(z.lessThan(kInt));
    const cx = x.clamp(int(0), kInt.sub(int(1))).toUint();
    const cy = y.clamp(int(0), kInt.sub(int(1))).toUint();
    const cz = z.clamp(int(0), kInt.sub(int(1))).toUint();
    const idx = cellIndexNode(cx, cy, cz, kUint);
    return select(inBounds, coarseStateBuf.element(idx).x.toUint(), uint(0));
  }

  // A coarse voxel is a detail CANDIDATE based on how many of its 6 face
  // neighbors differ in occupancy — a flat exterior face voxel has exactly
  // 1 (the single neighbor facing open air); an edge where two faces meet
  // has 2; a corner where three meet has 3+. Gating on `minSharpness`
  // (default 2) restricts detail to edges/corners/thin features and leaves
  // broad flat faces alone — this is what makes erosionCoverage/
  // growthCoverage read as a LOCAL, comprehensible dial instead of visibly
  // reshaping the entire silhouette: at minSharpness 1 (or lower), nearly
  // the WHOLE exposed surface qualifies as a candidate (this scene's CA is
  // porous/lacy, not smooth terrain), so any coverage value perforates
  // broad flat regions too, which reads as "the whole structure changed"
  // rather than "detail appeared at the edges" — matching the concentrated-
  // at-corners look in @jaymezd's reference piece (see module comment).
  // Candidates then roll against whichever coverage applies to their OWN
  // occupancy — erosionCoverage if solid, growthCoverage if empty.
  function buildMarkSubdivideKernel(coarseStateBuf) {
    return Fn(() => {
      const index = instanceIndex;
      If(index.greaterThanEqual(uint(totalVoxels)), () => Return());
      const kUint = uint(k);
      const { x, y, z } = decomposeIndexNode(index, kUint);
      const xInt = int(x);
      const yInt = int(y);
      const zInt = int(z);
      const centerSolid = coarseStateBuf
        .element(index)
        .x.toUint()
        .notEqual(uint(0));

      const differingCount = uint(0).toVar();
      FACE_NEIGHBOR_OFFSETS.forEach(([dx, dy, dz]) => {
        const neighborSolid = readCoarseState(
          coarseStateBuf,
          kUint,
          xInt.add(int(dx)),
          yInt.add(int(dy)),
          zInt.add(int(dz))
        ).notEqual(uint(0));
        If(neighborSolid.notEqual(centerSolid), () => {
          differingCount.assign(differingCount.add(uint(1)));
        });
      });

      const isCandidate = differingCount.greaterThanEqual(
        uniforms.minSharpness
      );
      const coverage = select(
        centerSolid,
        uniforms.erosionCoverage,
        uniforms.growthCoverage
      );
      const roll = hash(index.bitXor(uniforms.seed));
      const subdivide = isCandidate.and(roll.lessThan(coverage));
      subdivideFlagBuf
        .element(index)
        .assign(select(subdivide, uint(1), uint(0)));
    })().compute(totalVoxels);
  }

  const clearCandidateCounterKernel = Fn(() => {
    atomicStore(candidateCounterBuf.element(0), uint(0));
  })().compute(1);

  // Compacts flagged voxels (subdivideFlagBuf === 1) into a dense, small
  // (candidateCount-sized) list — the first of the two compaction stages
  // that keep this module's buffers off a dense fine grid (see module
  // comment).
  const compactCandidatesKernel = Fn(() => {
    const index = instanceIndex;
    If(index.greaterThanEqual(uint(totalVoxels)), () => Return());
    If(subdivideFlagBuf.element(index).equal(uint(0)), () => Return());
    const slot = atomicAdd(candidateCounterBuf.element(0), uint(1));
    candidateSlotBuf.element(index).assign(slot.add(uint(1)));
    candidateCoarseIndexBuf.element(slot).assign(index);
  })().compute(totalVoxels);

  // Per candidate coarse voxel (dispatched exactly `candidateCount` wide —
  // built fresh once that count is known post-readback, see dispatch()
  // below), emits its 2x2x2 block of 8 fine fragments into fineStateBuf,
  // sized to candidateCount*8 rather than a dense (2k)³ cube. Each
  // fragment's on/off state comes from counting how many of {the source
  // voxel, its neighbor in the +/-X direction implied by the fragment's
  // octant, same for Y, same for Z} are solid, against a tunable threshold
  // — the paper's §2 rule (max count 4). Material: a solid fragment
  // inherits its source voxel's own state if solid, else whichever
  // directional neighbor contributed the "on" vote (X, then Y, then Z) —
  // the paper's §5 future-work color idea, free here since cells are
  // tri-state.
  function buildEvalDetailKernel(coarseStateBuf, candidateCount, fineStateBuf) {
    return Fn(() => {
      const s = instanceIndex;
      If(s.greaterThanEqual(uint(candidateCount)), () => Return());

      const kUint = uint(k);
      const coarseIndex = candidateCoarseIndexBuf.element(s);
      const { x: cx, y: cy, z: cz } = decomposeIndexNode(coarseIndex, kUint);
      const centerState = coarseStateBuf.element(coarseIndex).x.toUint();
      const cxInt = int(cx);
      const cyInt = int(cy);
      const czInt = int(cz);

      OCTANTS.forEach(([ox, oy, oz]) => {
        const dx = int(ox === 0 ? -1 : 1);
        const dy = int(oy === 0 ? -1 : 1);
        const dz = int(oz === 0 ? -1 : 1);

        const xState = readCoarseState(
          coarseStateBuf,
          kUint,
          cxInt.add(dx),
          cyInt,
          czInt
        );
        const yState = readCoarseState(
          coarseStateBuf,
          kUint,
          cxInt,
          cyInt.add(dy),
          czInt
        );
        const zState = readCoarseState(
          coarseStateBuf,
          kUint,
          cxInt,
          cyInt,
          czInt.add(dz)
        );

        const count = select(centerState.notEqual(uint(0)), uint(1), uint(0))
          .add(select(xState.notEqual(uint(0)), uint(1), uint(0)))
          .add(select(yState.notEqual(uint(0)), uint(1), uint(0)))
          .add(select(zState.notEqual(uint(0)), uint(1), uint(0)));

        const fy = cy.mul(uint(2)).add(uint(oy));
        // Alternates threshold on the FRAGMENT's own altitude parity (not
        // the source voxel's) — matches the paper's §2 example (alternating
        // 3/4 by "least significant bit of the fragment's altitude") to
        // yield strata rather than a uniform look.
        const useHigh = uniforms.altitudeVarianceEnabled
          .equal(uint(1))
          .and(fy.mod(uint(2)).equal(uint(1)));
        const activeThreshold = select(
          useHigh,
          uniforms.thresholdHigh,
          uniforms.threshold
        );
        const solid = count.greaterThanEqual(activeThreshold);

        const fragmentState = select(
          centerState.notEqual(uint(0)),
          centerState,
          select(
            xState.notEqual(uint(0)),
            xState,
            select(yState.notEqual(uint(0)), yState, zState)
          )
        );
        const finalState = select(solid, fragmentState, uint(0));

        const fragSlot = s.mul(uint(8)).add(uint(octantIndexOf(ox, oy, oz)));
        fineStateBuf
          .element(fragSlot)
          .assign(vec2(finalState.toFloat(), float(1)));
      });
    })().compute(Math.max(1, candidateCount));
  }

  // Second compaction stage: decides which fragments are actually exposed
  // (at least one face-neighbor is empty or absent) and worth drawing at
  // all — fully interior fragments (solid on every side) are dropped, same
  // intent as growthCompute.js's own compactVisibleKernel at the coarse
  // level. Neighbor lookups may cross into an adjacent coarse voxel's own
  // fragment block (via candidateSlotBuf) — see checkFaceNeighbor and the
  // module comment for why a non-candidate neighbor counts as empty.
  function buildCompactDetailKernel({
    fragCount,
    fineStateBuf,
    fineExposedCompactedBuf,
    fineExposedCounterBuf,
  }) {
    return Fn(() => {
      const f = instanceIndex;
      If(f.greaterThanEqual(uint(fragCount)), () => Return());

      const state = fineStateBuf.element(f).x.toUint();
      If(state.equal(uint(0)), () => Return());

      const kUint = uint(k);
      const kInt = int(k);
      const s = f.div(uint(8));
      const o = f.mod(uint(8));
      const coarseIndex = candidateCoarseIndexBuf.element(s);
      const { x: cx, y: cy, z: cz } = decomposeIndexNode(coarseIndex, kUint);
      const cxInt = int(cx);
      const cyInt = int(cy);
      const czInt = int(cz);

      const ox = o.mod(uint(2));
      const oy = o.div(uint(2)).mod(uint(2));
      const oz = o.div(uint(4));

      const exposed = uint(0).toVar();
      const sharedArgs = {
        exposed,
        s,
        o,
        kInt,
        fineStateBuf,
        candidateSlotBuf,
      };

      [-1, 1].forEach((direction) => {
        checkFaceNeighbor({
          ...sharedArgs,
          axisLocal: ox,
          axisIntCoord: cxInt,
          axisBit: AXIS_BIT.x,
          direction,
          buildNeighborIndex: (nx) => cellIndexNode(nx, cy, cz, kUint),
        });
        checkFaceNeighbor({
          ...sharedArgs,
          axisLocal: oy,
          axisIntCoord: cyInt,
          axisBit: AXIS_BIT.y,
          direction,
          buildNeighborIndex: (ny) => cellIndexNode(cx, ny, cz, kUint),
        });
        checkFaceNeighbor({
          ...sharedArgs,
          axisLocal: oz,
          axisIntCoord: czInt,
          axisBit: AXIS_BIT.z,
          direction,
          buildNeighborIndex: (nz) => cellIndexNode(cx, cy, nz, kUint),
        });
      });

      If(exposed.equal(uint(0)), () => Return());
      const slot = atomicAdd(fineExposedCounterBuf.element(0), uint(1));
      fineExposedCompactedBuf.element(slot).assign(f);
    })().compute(Math.max(1, fragCount));
  }

  async function dispatch(gl, coarseStateBuf, settings) {
    uniforms.threshold.value = settings.detailThreshold;
    uniforms.thresholdHigh.value = settings.detailThresholdHigh;
    uniforms.altitudeVarianceEnabled.value = settings.detailAltitudeVariance
      ? 1
      : 0;
    uniforms.erosionCoverage.value = settings.erosionCoverage;
    uniforms.growthCoverage.value = settings.growthCoverage;
    uniforms.minSharpness.value = settings.detailMinSharpness;
    uniforms.seed.value = (settings.seed ^ 0x5a17e5c9) >>> 0;

    const markSubdivideKernel = buildMarkSubdivideKernel(coarseStateBuf);
    gl.compute(markSubdivideKernel);
    gl.compute(clearCandidateCounterKernel);
    gl.compute(compactCandidatesKernel);

    const candidateCounterBytes = await gl.getArrayBufferAsync(
      candidateCounterBuf.value
    );
    const candidateCount = new Uint32Array(candidateCounterBytes)[0];
    const fragCount = candidateCount * 8;

    // Only NOW — with the real candidate count in hand — are the fine
    // fragment buffers allocated, sized to what this regenerate actually
    // needs instead of a worst-case dense fine grid. See module comment.
    const fineStateBuf = instancedArray(Math.max(1, fragCount), 'vec2');
    const fineExposedCompactedBuf = instancedArray(
      Math.max(1, fragCount),
      'uint'
    );
    const fineExposedCounterBuf = instancedArray(1, 'uint').toAtomic();

    const evalDetailKernel = buildEvalDetailKernel(
      coarseStateBuf,
      candidateCount,
      fineStateBuf
    );
    gl.compute(evalDetailKernel);

    const clearFineExposedCounterKernel = Fn(() => {
      atomicStore(fineExposedCounterBuf.element(0), uint(0));
    })().compute(1);
    gl.compute(clearFineExposedCounterKernel);

    const compactDetailKernel = buildCompactDetailKernel({
      fragCount,
      fineStateBuf,
      fineExposedCompactedBuf,
      fineExposedCounterBuf,
    });
    gl.compute(compactDetailKernel);

    const fineCounterBytes = await gl.getArrayBufferAsync(
      fineExposedCounterBuf.value
    );
    const fineCount = new Uint32Array(fineCounterBytes)[0];

    return {
      fineCount,
      fineStateBuf,
      fineCompactedIndexBuf: fineExposedCompactedBuf,
    };
  }

  return {
    subdivideFlagBuf,
    candidateCoarseIndexBuf,
    dispatch,
    totalVoxels,
    k,
    fineK,
  };
}
