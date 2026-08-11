import { attribute } from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useRef, useState } from 'react';

import { useThree } from '@react-three/fiber';

import createDetailEnhanceCompute, {
  createRecursiveDetailLevel,
  decomposeFragmentCpu,
  decomposeRecursiveFragmentCpu,
} from '../utils/detailEnhanceCompute';
import buildGreedyMeshGeometry from '../utils/greedyMesh';
import createVoxelFieldCompute from '../utils/growthCompute';
import createMaterialStateNodes, {
  hasClearcoat,
  hasTransmission,
  updateMaterialStateUniforms,
} from '../utils/materialStateNode';
import { createRuleTables } from '../utils/ruleTables';

const REBUILD_DEBOUNCE_MS = 300;
const CUBE_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
// Cube geometry data reused as a per-fragment TEMPLATE when baking tiers
// (see bakeTierMesh) — copying an already-correct box's own vertices avoids
// re-deriving face/winding/normal math by hand for a plain, unmerged cube.
const UNIT_CUBE_POSITIONS = CUBE_GEOMETRY.attributes.position.array;
const UNIT_CUBE_NORMALS = CUBE_GEOMETRY.attributes.normal.array;
const UNIT_CUBE_INDICES = CUBE_GEOMETRY.index.array;
const UNIT_CUBE_VERTEX_COUNT = UNIT_CUBE_POSITIONS.length / 3;
const UNIT_CUBE_INDEX_COUNT = UNIT_CUBE_INDICES.length;
// Some rule/density combinations can die off to (near) nothing. Rather than
// render an empty/near-empty grid, re-roll the seed locally (Leva's `seed`
// control is left untouched) a bounded number of times until the occupied
// count clears this floor, or give up and show whatever the last attempt
// produced.
const MIN_OCCUPIED_VOXELS = 64;
const MAX_REGEN_ATTEMPTS = 5;
// One flat debug color per subdivision tier (getDetailEnhanceControls.js's
// `debugTierColors`) — magenta was the original single fine tier's color;
// deeper levels get their own so overlapping tiers are still distinguishable
// at a glance. `subdivisionLevels` caps at 4, so 4 colors is enough.
const TIER_DEBUG_COLORS = ['#ff00ff', '#00ff88', '#ffcc00', '#4d8bff'];
// Recursive subdivision has no inherent convergence guarantee — a candidate
// fans out into up to 8 children, so whenever erosionCoverage * 8 * (the
// fraction of those children that end up solid) exceeds 1, EVERY further
// level adds more instances than the last rather than fewer, however deep
// `subdivisionLevels` asks for. This is a HARD per-tier cap (applied to
// EVERY tier, including level 1, which has no other ceiling on it at all —
// it comes straight out of the base detail-enhance pass) — not just a
// backstop that stops recursion once the running total is over budget, but
// an actual clamp on each tier's own baked instance count, because bakeTierMesh
// allocates real GPU buffers sized off it: at 288 bytes/fragment (the
// largest per-fragment buffer — position/normal/color, 24 verts * 3 floats *
// 4 bytes), 750,000 fragments is ~216MB, safely under WebGPU's default
// 268,435,456-byte (256MB) single-buffer limit — uncapped, a single
// aggressive base-level erosion pass can exceed that limit outright and
// fail GPU buffer creation, not just run slow. Truncates to the first N
// exposed fragments (arbitrary, not a fair/representative sample) rather
// than trying to bake all of them — a guess at a safe ceiling, not a
// measured one; tune it to whatever this scene's actual target hardware can
// carry smoothly.
const MAX_TIER_INSTANCES = 750_000;

async function dispatchWithFloor(field, gl, settings) {
  const attemptSettings = { ...settings };
  let occupiedCount = await field.dispatch(gl, attemptSettings);
  let attempts = 0;
  while (occupiedCount < MIN_OCCUPIED_VOXELS && attempts < MAX_REGEN_ATTEMPTS) {
    attemptSettings.seed = Math.floor(Math.random() * 1_000_000);
    // eslint-disable-next-line no-await-in-loop
    occupiedCount = await field.dispatch(gl, attemptSettings);
    attempts += 1;
  }
  return occupiedCount;
}

// Full-buffer readback, once per regenerate (plus once more whenever
// showState*/bounds*/palette-color change — see the rebake effect below) —
// feeds utils/greedyMesh.js.
async function readStatesForMeshing(gl, stateRevealBuf, totalVoxels) {
  const bytes = await gl.getArrayBufferAsync(stateRevealBuf.value);
  const floats = new Float32Array(bytes);
  const states = new Uint8Array(totalVoxels);
  for (let i = 0; i < totalVoxels; i += 1) {
    states[i] = Math.round(floats[i * 2]);
  }
  return states;
}

// Readback of utils/detailEnhanceCompute.js's subdivideFlagBuf — which
// coarse voxels were chosen for detail (erosion or growth, see that
// module's comment). Used to zero eroded (originally-solid) voxels out of
// the state array before it reaches buildStaticMesh, so the kept/greedy-mesh
// tier and the fine tiers can never both claim the same cell — one array,
// one zeroing pass, not independently-computed tiers that have to agree.
// Only ever driven by LEVEL 1 candidacy — deeper subdivision levels only
// refine fragments level 1 already carved out, never touching the kept mesh
// further.
async function readSubdivideFlags(gl, subdivideFlagBuf, totalVoxels) {
  const bytes = await gl.getArrayBufferAsync(subdivideFlagBuf.value);
  return new Uint32Array(bytes.slice(0, totalVoxels * 4));
}

function subtractSubdivided(states, subdivideFlags) {
  if (!subdivideFlags) return states;
  const kept = new Uint8Array(states);
  for (let i = 0; i < kept.length; i += 1) {
    if (subdivideFlags[i] === 1) kept[i] = 0;
  }
  return kept;
}

// The greedy-meshed static mesh has no per-cell shader logic to gate
// visibility live, so this returns a copy with whichever cells showState*/
// bounds* would hide zeroed out before meshing, so buildGreedyMeshGeometry
// never sees them.
function applyVisibilityAndBoundsFilter(states, k, config) {
  const showByState = {
    1: config.showState1 ?? true,
    2: config.showState2 ?? true,
    3: config.showState3 ?? true,
  };
  const boundsIsSphere = config.boundsShape === 'sphere';
  const half = (k - 1) * 0.5;
  const radius = (config.boundsSphereRadius ?? 1) * half;
  const filtered = new Uint8Array(states);

  for (let z = 0; z < k; z += 1) {
    for (let y = 0; y < k; y += 1) {
      for (let x = 0; x < k; x += 1) {
        const i = x + k * (y + k * z);
        const state = filtered[i];

        if (state === 0) {
          // Already empty — nothing to hide.
        } else if (showByState[state] === false) {
          filtered[i] = 0;
        } else if (boundsIsSphere) {
          const dx = x - half;
          const dy = y - half;
          const dz = z - half;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (distance > radius) {
            filtered[i] = 0;
          }
        }
      }
    }
  }

  return filtered;
}

// Builds the structure's primary representation: a single merged mesh via
// binary greedy meshing (utils/greedyMesh.js) — real geometry/normals/
// vertex colors, so shadows and the scene's LightRig/CenterLight/Godrays
// lighting work exactly as they do for any other mesh, no special-casing.
//
// Colors bake `config.paletteStart/Mid/End` directly as per-state (1/2/3)
// colors — correct for the 'state' colorMode (every shipped preset), which
// only ever samples the palette gradient at exactly those 3 stops; the
// other colorModes (height/distanceFromCore/growthOrder) aren't baked here
// yet and fall back to the same per-state coloring on this mesh — a
// materials-phase item, not attempted here. Re-baked (not just live-
// updated) by a dedicated effect below whenever showState*/bounds*/palette
// colors change, since geometry/vertex-colors are otherwise fixed at build
// time. Material props (utils/materialStateNode.js) branch per-vertex off
// the baked `state` attribute (greedyMesh.js) and DO stay live via
// `materialUniforms`, re-synced by the live-update effect below.
function buildStaticMesh({ states, k, cellSpacing, config }) {
  const paletteColors = {
    1: new THREE.Color(config.paletteStart),
    2: new THREE.Color(config.paletteMid),
    3: new THREE.Color(config.paletteEnd),
  };
  const geometry = buildGreedyMeshGeometry({
    states,
    k,
    cellSpacing,
    paletteColors,
  });

  const stateNode = attribute('state', 'float').round().toUint();
  const materialState = createMaterialStateNodes({ config, stateNode });

  const material = new THREE.MeshPhysicalNodeMaterial({
    side: THREE.DoubleSide,
  });
  material.colorNode = attribute('color', 'vec3');
  material.roughnessNode = materialState.roughnessNode;
  material.metalnessNode = materialState.metalnessNode;
  material.emissiveNode = materialState.emissiveNode;
  if (materialState.clearcoatNode) {
    material.clearcoatNode = materialState.clearcoatNode;
    material.clearcoatRoughnessNode = materialState.clearcoatRoughnessNode;
  }
  if (materialState.transmissionNode) {
    material.transmissionNode = materialState.transmissionNode;
    material.iorNode = materialState.iorNode;
    material.thicknessNode = materialState.thicknessNode;
  }

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  // Real, CPU-computed geometry — Three's own bounding-box computation is
  // accurate here (unlike a shader-positioned InstancedMesh), so frustum
  // culling is safe. Was previously disabled; no reason found for that
  // given this mesh never used a shader positionNode.
  mesh.frustumCulled = true;
  return {
    mesh,
    materialUniforms: materialState.uniforms,
  };
}

function emptyTierMesh() {
  // A minimal, degenerate (zero-area) placeholder rather than a truly
  // empty geometry — mirrors the Math.max(1, ...) fallbacks used elsewhere
  // in this pipeline for the same reason: avoid relying on zero-length
  // GPU buffers being universally well-behaved. mesh.visible=false means
  // it's never actually drawn either way.
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0], 3)
  );
  geometry.setAttribute(
    'normal',
    new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0], 3)
  );
  geometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0], 3)
  );
  geometry.setAttribute(
    'state',
    new THREE.Float32BufferAttribute([0, 0, 0], 1)
  );
  geometry.setIndex([0, 1, 2]);
  const material = new THREE.MeshPhysicalNodeMaterial();
  material.colorNode = attribute('color', 'vec3');
  const mesh = new THREE.Mesh(geometry, material);
  mesh.visible = false;
  // materialUniforms is null (not {}) so updateMaterialStateUniforms's own
  // `if (!uniforms) return;` guard no-ops correctly instead of indexing
  // into a genuinely empty object.
  return { mesh, materialUniforms: null };
}

// Bakes ONE subdivision tier into a static mesh — same architecture as
// buildStaticMesh (baked position/vertex-color, material props stay live
// via uniforms branching off a baked `state` attribute), applied to a
// tier's sparse fragment list (read back from the GPU) instead of a dense
// CA grid. Replaces this scene's earlier live-InstancedMesh tier design,
// which ran the full palette-gradient + material-branching shader graph on
// EVERY vertex of EVERY fragment, every frame — the actual cost driving
// high subdivision-level instance counts into "extremely slow," not
// primarily triangle count. This still emits a full 6-face cube per
// surviving fragment (same triangle count the InstancedMesh drew) —
// face-culling/merging across neighboring fragments is a further, separate
// optimization on top of this one, not yet done.
//
// showState*/bounds filtering (buildStaticMesh's counterpart:
// applyVisibilityAndBoundsFilter) happens inline here per-fragment, since
// tier data is a sparse list, not a dense grid to pre-filter in one pass.
// `debugTierColors` is baked in too (bypassing the palette with a flat
// per-tier color), which is why it now triggers a rebake rather than a
// live uniform flip. `gridK` is this tier's own fine-grid resolution
// (detailField.fineK * 2^tierIndex), used for the bounds-sphere center/
// radius the same way the old live shader did.
async function bakeTierMesh({
  gl,
  stateBuf,
  exposedIndexBuf,
  exposedCount,
  decodeFragment,
  gridK,
  cellSpacingValue,
  cellScaleValue,
  config,
  debugColorHex,
}) {
  if (exposedCount <= 0) return emptyTierMesh();

  const [stateBytes, exposedBytes] = await Promise.all([
    gl.getArrayBufferAsync(stateBuf.value),
    gl.getArrayBufferAsync(exposedIndexBuf.value),
  ]);
  const stateFloats = new Float32Array(stateBytes);
  const exposedSlots = new Uint32Array(exposedBytes);

  const paletteColors = {
    1: new THREE.Color(config.paletteStart),
    2: new THREE.Color(config.paletteMid),
    3: new THREE.Color(config.paletteEnd),
  };
  const debugColor = new THREE.Color(debugColorHex);
  const useDebugColor = !!config.debugTierColors;

  const showByState = {
    1: config.showState1 ?? true,
    2: config.showState2 ?? true,
    3: config.showState3 ?? true,
  };
  const boundsIsSphere = config.boundsShape === 'sphere';
  const half = Math.max(1, gridK - 1) * 0.5;
  const radius = (config.boundsSphereRadius ?? 1) * half;

  const positions = new Float32Array(exposedCount * UNIT_CUBE_VERTEX_COUNT * 3);
  const normals = new Float32Array(exposedCount * UNIT_CUBE_VERTEX_COUNT * 3);
  const colors = new Float32Array(exposedCount * UNIT_CUBE_VERTEX_COUNT * 3);
  const states = new Float32Array(exposedCount * UNIT_CUBE_VERTEX_COUNT);
  const indices = new Uint32Array(exposedCount * UNIT_CUBE_INDEX_COUNT);

  let written = 0;
  for (let f = 0; f < exposedCount; f += 1) {
    const fragSlot = exposedSlots[f];
    const state = Math.round(stateFloats[fragSlot * 2]);
    const passesStateFilter = state !== 0 && showByState[state] !== false;

    const [fx, fy, fz] = passesStateFilter
      ? decodeFragment(fragSlot)
      : [0, 0, 0];
    const withinBounds =
      !boundsIsSphere ||
      Math.sqrt((fx - half) ** 2 + (fy - half) ** 2 + (fz - half) ** 2) <=
        radius;

    if (passesStateFilter && withinBounds) {
      const px = (fx - half) * cellSpacingValue;
      const py = (fy - half) * cellSpacingValue;
      const pz = (fz - half) * cellSpacingValue;
      const color = useDebugColor
        ? debugColor
        : (paletteColors[state] ?? paletteColors[1]);

      const vertexBase = written * UNIT_CUBE_VERTEX_COUNT;
      for (let v = 0; v < UNIT_CUBE_VERTEX_COUNT; v += 1) {
        const srcIdx = v * 3;
        const dstIdx = (vertexBase + v) * 3;
        positions[dstIdx] = UNIT_CUBE_POSITIONS[srcIdx] * cellScaleValue + px;
        positions[dstIdx + 1] =
          UNIT_CUBE_POSITIONS[srcIdx + 1] * cellScaleValue + py;
        positions[dstIdx + 2] =
          UNIT_CUBE_POSITIONS[srcIdx + 2] * cellScaleValue + pz;
        normals[dstIdx] = UNIT_CUBE_NORMALS[srcIdx];
        normals[dstIdx + 1] = UNIT_CUBE_NORMALS[srcIdx + 1];
        normals[dstIdx + 2] = UNIT_CUBE_NORMALS[srcIdx + 2];
        colors[dstIdx] = color.r;
        colors[dstIdx + 1] = color.g;
        colors[dstIdx + 2] = color.b;
        states[vertexBase + v] = state;
      }

      const indexBase = written * UNIT_CUBE_INDEX_COUNT;
      for (let ii = 0; ii < UNIT_CUBE_INDEX_COUNT; ii += 1) {
        indices[indexBase + ii] = vertexBase + UNIT_CUBE_INDICES[ii];
      }

      written += 1;
    }
  }

  if (written === 0) return emptyTierMesh();

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(
      positions.subarray(0, written * UNIT_CUBE_VERTEX_COUNT * 3),
      3
    )
  );
  geometry.setAttribute(
    'normal',
    new THREE.Float32BufferAttribute(
      normals.subarray(0, written * UNIT_CUBE_VERTEX_COUNT * 3),
      3
    )
  );
  geometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(
      colors.subarray(0, written * UNIT_CUBE_VERTEX_COUNT * 3),
      3
    )
  );
  geometry.setAttribute(
    'state',
    new THREE.Float32BufferAttribute(
      states.subarray(0, written * UNIT_CUBE_VERTEX_COUNT),
      1
    )
  );
  geometry.setIndex(
    new THREE.Uint32BufferAttribute(
      indices.subarray(0, written * UNIT_CUBE_INDEX_COUNT),
      1
    )
  );

  const stateNode = attribute('state', 'float').round().toUint();
  const materialState = createMaterialStateNodes({ config, stateNode });
  const material = new THREE.MeshPhysicalNodeMaterial({
    side: THREE.DoubleSide,
  });
  material.colorNode = attribute('color', 'vec3');
  material.roughnessNode = materialState.roughnessNode;
  material.metalnessNode = materialState.metalnessNode;
  material.emissiveNode = materialState.emissiveNode;
  if (materialState.clearcoatNode) {
    material.clearcoatNode = materialState.clearcoatNode;
    material.clearcoatRoughnessNode = materialState.clearcoatRoughnessNode;
  }
  if (materialState.transmissionNode) {
    material.transmissionNode = materialState.transmissionNode;
    material.iorNode = materialState.iorNode;
    material.thicknessNode = materialState.thicknessNode;
  }

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = true;

  return { mesh, materialUniforms: materialState.uniforms };
}

// Runs the full detail-enhance pipeline for a regenerate: level 1
// (createDetailEnhanceCompute, dense-grid-addressed) plus
// `subdivisionLevels - 1` further recursive passes (createRecursiveDetailLevel,
// each addressed via the previous level's own fragment slots — see
// detailEnhanceCompute.js's module comment). Also reads back the small
// coarse-index/parent-slot buffers each tier's CPU-side coordinate decode
// needs (decomposeFragmentCpu/decomposeRecursiveFragmentCpu) — bounded by
// candidate counts, not fragment counts, so cheap regardless of level.
// Returns detailField (needed for subdivideFlagBuf downstream) plus one
// entry per tier that actually produced fragments: { stateBuf,
// exposedIndexBuf, count, decodeFragment }, ready to hand straight to
// bakeTierMesh. Stops early if a level comes back with nothing exposed —
// nothing for the next level to subdivide.
async function runDetailEnhance(gl, field, structural) {
  const coarseK = field.k;
  const detailField = createDetailEnhanceCompute({ k: coarseK });
  const level1Result = await detailField.dispatch(
    gl,
    field.stateRevealBuf,
    structural
  );

  const candidateCoarseIndexBytes = await gl.getArrayBufferAsync(
    detailField.candidateCoarseIndexBuf.value
  );
  const candidateCoarseIndexArray = new Uint32Array(candidateCoarseIndexBytes);

  const tiers = [
    {
      stateBuf: level1Result.fineStateBuf,
      exposedIndexBuf: level1Result.fineCompactedIndexBuf,
      // Clamped — level 1 has no other ceiling on its own count at all (it
      // comes straight out of the base detail-enhance pass), so aggressive
      // enough Erosion Coverage/Min Sharpness alone can exceed WebGPU's
      // hard single-buffer limit before recursion even starts. See
      // MAX_TIER_INSTANCES.
      count: Math.min(level1Result.fineCount, MAX_TIER_INSTANCES),
      parentSlotArraysChain: [],
      decodeFragment: (slot) =>
        decomposeFragmentCpu(slot, candidateCoarseIndexArray, coarseK),
    },
  ];

  const levels = Math.max(1, Math.min(4, structural.subdivisionLevels || 1));
  const boost = structural.subdivisionCoverageBoost ?? 1;
  let totalInstances = tiers[0].count;
  for (let levelIndex = 2; levelIndex <= levels; levelIndex += 1) {
    const prevTier = tiers[tiers.length - 1];
    if (prevTier.count === 0) break;
    if (totalInstances >= MAX_TIER_INSTANCES) {
      // eslint-disable-next-line no-console
      console.warn(
        `[detailEnhance] stopped at level ${levelIndex - 1} of ${levels} — ` +
          `${totalInstances} tier instances already at/over the ` +
          `${MAX_TIER_INSTANCES} safety budget (see MAX_TIER_INSTANCES). ` +
          'Lower Erosion Coverage or raise Threshold so subdivision ' +
          'actually shrinks per level instead of growing it.'
      );
      break;
    }
    const recursiveLevel = createRecursiveDetailLevel();
    // Compounds coverage up at each deeper level (boost=1 reproduces the
    // flat shared-coverage behavior) — counteracts how much material
    // naturally survives each split (see subdivisionCoverageBoost's comment
    // in getDetailEnhanceControls.js), so a fixed coverage value doesn't
    // read as "erosion stops going deeper."
    const levelSettings = {
      ...structural,
      erosionCoverage: Math.min(
        1,
        structural.erosionCoverage * boost ** (levelIndex - 1)
      ),
    };
    // eslint-disable-next-line no-await-in-loop
    const result = await recursiveLevel.dispatch(gl, {
      parentStateBuf: prevTier.stateBuf,
      parentExposedIndexBuf: prevTier.exposedIndexBuf,
      parentExposedCount: prevTier.count,
      seed: structural.seed,
      seedSalt: levelIndex * 0x1000193,
      settings: levelSettings,
    });
    // eslint-disable-next-line no-await-in-loop
    const parentSlotBytes = await gl.getArrayBufferAsync(
      result.candidateParentSlotBuf.value
    );
    const parentSlotArray = new Uint32Array(parentSlotBytes);
    const parentSlotArraysChain = [
      parentSlotArray,
      ...prevTier.parentSlotArraysChain,
    ];
    // Clamped for the same reason level 1 is — see MAX_TIER_INSTANCES.
    const clampedCount = Math.min(result.fineCount, MAX_TIER_INSTANCES);
    tiers.push({
      stateBuf: result.fineStateBuf,
      exposedIndexBuf: result.fineExposedCompactedBuf,
      count: clampedCount,
      parentSlotArraysChain,
      decodeFragment: (slot) =>
        decomposeRecursiveFragmentCpu(
          slot,
          parentSlotArraysChain,
          candidateCoarseIndexArray,
          coarseK
        ),
    });
    totalInstances += clampedCount;
  }

  return { detailField, tiers };
}

// Bakes every tier in `tiers` in parallel (each does its own independent GPU
// readback) into meshes ready to add to the scene, using tier index i's own
// resolution: cellSpacing/cellScale divided by 2^(i+1) (each level doubles
// the resolution again), gridK = detailField.fineK * 2^i.
function bakeAllTiers({ gl, tiers, detailField, config }) {
  return Promise.all(
    tiers.map((tier, i) => {
      const divisor = 2 ** (i + 1);
      return bakeTierMesh({
        gl,
        stateBuf: tier.stateBuf,
        exposedIndexBuf: tier.exposedIndexBuf,
        exposedCount: tier.count,
        decodeFragment: tier.decodeFragment,
        gridK: detailField.fineK * 2 ** i,
        cellSpacingValue: config.cellSpacing / divisor,
        cellScaleValue: config.cellScale / divisor,
        config,
        debugColorHex:
          TIER_DEBUG_COLORS[i] ??
          TIER_DEBUG_COLORS[TIER_DEBUG_COLORS.length - 1],
      });
    })
  );
}

// The subset of structural settings that actually change the underlying CA
// structure (utils/growthCompute.js) — used to key the field cache in
// build() below, so a detail-enhance-only change (erosion/growth/threshold/
// subdivision/material toggles) can reuse the already-generated field
// instead of re-running the most expensive step in the whole pipeline for a
// result that would come out byte-identical.
function pickCaSettings(config) {
  return {
    level: config.level,
    seed: config.seed,
    baseFill: config.baseFill,
    ruleMode: config.ruleMode,
    density: config.density,
    beta: config.beta,
    magnetism: config.magnetism,
    flipChance: config.flipChance,
    removeStrays: config.removeStrays,
    growthJitter: config.growthJitter,
  };
}

function pickStructuralSettings(config) {
  return {
    ...pickCaSettings(config),
    // Structural: voxel detail enhancement (utils/detailEnhanceCompute.js)
    // re-runs its own compute + fine compaction pass(es) against this
    // build's settled coarse buffer, so any of these retriggers a rebuild
    // the same way level/seed/density etc. do — but NOT the CA itself (see
    // pickCaSettings/the field cache in build() below): only these settings
    // changing reuses the existing field instead of regenerating it.
    detailEnhanceEnabled: config.detailEnhanceEnabled,
    subdivisionLevels: config.subdivisionLevels,
    subdivisionCoverageBoost: config.subdivisionCoverageBoost,
    detailThreshold: config.detailThreshold,
    detailAltitudeVariance: config.detailAltitudeVariance,
    detailThresholdHigh: config.detailThresholdHigh,
    detailMinSharpness: config.detailMinSharpness,
    erosionCoverage: config.erosionCoverage,
    growthCoverage: config.growthCoverage,
    // Also structural: clearcoat/transmission each add a lighting-model term
    // in MeshPhysicalNodeMaterial only when their *Node is non-null (see
    // utils/materialStateNode.js) — crossing the on/off boundary needs a
    // material rebuild, but the numeric amount while already-enabled doesn't
    // (that's a live uniform, see the live-update effect below).
    hasClearcoat: hasClearcoat(config),
    hasTransmission: hasTransmission(config),
  };
}

// Owns the CA compute pipeline (regenerates on structural control changes)
// and the meshes that render it: buildStaticMesh's greedy-meshed geometry
// always, plus one baked mesh per subdivision level (bakeTierMesh,
// config.subdivisionLevels 1-4) alongside it when
// config.detailEnhanceEnabled is on. The structure always resolves
// instantly — the old timed growth-reveal animation and continuous/cyclic
// CA were both removed (slow, and read as uneven/not organic) — so there's
// no per-frame work at all, all meshes are built once per regenerate (or
// rebaked on the narrower showState*/bounds*/palette/debug triggers below)
// and stay as-is otherwise.
function VoxelField({ config }) {
  const { gl } = useThree();
  const fieldRef = useRef(null);
  // tierMeshes (voxel detail enhance's subdivision tiers — see build()
  // below) is only populated when config.detailEnhanceEnabled is on, and
  // always coexists WITH staticMesh in that case (not instead of it) —
  // staticMesh renders the kept/untouched majority, the tiers render only
  // the flagged fine fragments at progressively finer scales.
  const meshesRef = useRef({ staticMesh: null, tierMeshes: [] });
  // Disposable resources belonging to whatever `renderObject` currently
  // holds — NOT torn down by the build effect's own cleanup (see the build
  // effect below for why: that cleanup fires synchronously the instant
  // `structural` changes, well before the NEXT build finishes and replaces
  // `renderObject`, so disposing here-and-now would corrupt whatever's
  // still on screen for the entire rebuild window). Disposed only once a
  // later build actually replaces it, or on true unmount (see the
  // dedicated cleanup-only effect below).
  const activeResourcesRef = useRef(null);
  // The CA field (utils/growthCompute.js) from the most recent build,
  // keyed by its CA-relevant settings (pickCaSettings) — NOT reset by the
  // build effect's own cleanup (unlike fieldRef, which IS), specifically so
  // it survives across a detail-enhance-only regenerate. Reused directly
  // when the new build's CA settings match, skipping dispatchWithFloor
  // (the single most expensive step here) entirely for a result that would
  // come out byte-identical anyway.
  const cachedCaRef = useRef(null);
  const [renderObject, setRenderObject] = useState(null);
  // Mirrors `renderObject`, kept for the rebake effect below to read
  // WITHOUT depending on `renderObject` itself — see that effect for why:
  // depending on it would re-trigger a full rebake immediately after every
  // regenerate, on top of the bake build() just did, since a fresh
  // renderObject is created on every regenerate too.
  const renderObjectRef = useRef(null);

  const [structural, setStructural] = useState(() =>
    pickStructuralSettings(config)
  );
  useEffect(() => {
    const id = setTimeout(() => {
      const next = pickStructuralSettings(config);
      setStructural((prev) =>
        JSON.stringify(prev) === JSON.stringify(next) ? prev : next
      );
    }, REBUILD_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [
    config.level,
    config.seed,
    config.baseFill,
    config.ruleMode,
    config.density,
    config.beta,
    config.magnetism,
    config.flipChance,
    config.removeStrays,
    config.growthJitter,
    config.detailEnhanceEnabled,
    config.subdivisionLevels,
    config.subdivisionCoverageBoost,
    config.detailThreshold,
    config.detailAltitudeVariance,
    config.detailThresholdHigh,
    config.detailMinSharpness,
    config.erosionCoverage,
    config.growthCoverage,
    // Only trigger the structural rebuild when clearcoat/transmission cross
    // the zero boundary (pickStructuralSettings derives the actual booleans
    // from these) — the material rebuild is what picks up the new nodes.
    config.state1Clearcoat,
    config.state2Clearcoat,
    config.state3Clearcoat,
    config.state1Transmission,
    config.state2Transmission,
    config.state3Transmission,
  ]);

  useEffect(() => {
    let cancelled = false;
    // Set true only once this build's group has actually replaced
    // renderObject — distinguishes "this build finished and is now on
    // screen" (disposal of its resources is someone ELSE's job, later —
    // see activeResourcesRef) from "this build was abandoned mid-flight
    // because structural changed again" (its cleanup below must dispose
    // whatever it already created, since nothing else ever will).
    let becameActive = false;
    let builtStaticMesh = null;
    let builtTierMeshes = [];

    async function build() {
      const caKey = JSON.stringify(pickCaSettings(structural));
      let field;
      if (cachedCaRef.current && cachedCaRef.current.key === caKey) {
        // Only detail-enhance/material settings changed — level/seed/
        // density/etc are identical to the last build's, so the CA would
        // resolve to the exact same occupied cells again. Reuse it instead
        // of re-running the whole generation for a byte-identical result.
        ({ field } = cachedCaRef.current);
      } else {
        field = createVoxelFieldCompute({
          level: structural.level,
          ruleTables: createRuleTables(structural),
        });
        // Runs full CA generation + one-time compaction; resolves once the
        // occupied-cell count is read back from the GPU (see
        // utils/growthCompute.js's compaction notes). Retries with a
        // locally re-rolled seed if generation comes back empty/near-empty.
        await dispatchWithFloor(field, gl, structural);
        if (cancelled) return;
        cachedCaRef.current = { key: caKey, field };
      }

      // Decides which coarse voxels get eroded (originally solid) or grown
      // (originally empty) at level 1, then recurses up to
      // structural.subdivisionLevels deep on each level's own surviving
      // fragments — see runDetailEnhance and detailEnhanceCompute.js's
      // module comment. Reads back which level-1 voxels were flagged, to
      // zero the ERODED ones out of the kept mesh's own state array before
      // it's meshed below, so the kept mesh and the fine tiers partition one
      // shared array and can never both claim a cell.
      let detailField = null;
      let tiersData = [];
      if (structural.detailEnhanceEnabled) {
        const detailResult = await runDetailEnhance(gl, field, structural);
        detailField = detailResult.detailField;
        tiersData = detailResult.tiers;
        if (cancelled) return;
      }

      const states = await readStatesForMeshing(
        gl,
        field.stateRevealBuf,
        field.totalVoxels
      );
      if (cancelled) return;

      let subdivideFlags = null;
      if (detailField) {
        subdivideFlags = await readSubdivideFlags(
          gl,
          detailField.subdivideFlagBuf,
          field.totalVoxels
        );
        if (cancelled) return;
      }

      const keptStates = subtractSubdivided(states, subdivideFlags);
      const filteredStates = applyVisibilityAndBoundsFilter(
        keptStates,
        field.k,
        config
      );
      const builtStatic = buildStaticMesh({
        states: filteredStates,
        k: field.k,
        cellSpacing: config.cellSpacing,
        config,
      });
      const staticMesh = builtStatic.mesh;
      const staticMaterialUniforms = builtStatic.materialUniforms;
      builtStaticMesh = staticMesh;

      const tierMeshesBuilt = tiersData.length
        ? await bakeAllTiers({ gl, tiers: tiersData, detailField, config })
        : [];
      if (cancelled) {
        staticMesh.geometry.dispose();
        staticMesh.material.dispose();
        tierMeshesBuilt.forEach((t) => {
          t.mesh.geometry.dispose();
          t.mesh.material.dispose();
        });
        return;
      }
      builtTierMeshes = tierMeshesBuilt.map((t) => t.mesh);

      // NOT a BundleGroup — tried that, reverted. Its pre-recorded GPU
      // command buffer isn't re-validated on replay, and this component
      // disposes the PREVIOUS build's geometry/material synchronously right
      // after setRenderObject, before React/R3F have necessarily swapped
      // the <primitive> in the scene graph (R3F's render loop runs on its
      // own rAF schedule, independent of React's commit). A plain Group's
      // regular per-frame render path seems to tolerate that race; a
      // replayed bundle referencing an already-destroyed buffer is a hard
      // WebGPU validation error instead.
      const group = new THREE.Group();
      group.add(staticMesh);
      builtTierMeshes.forEach((mesh) => group.add(mesh));

      fieldRef.current = {
        field,
        staticMaterialUniforms,
        detailField,
        tiersData,
        tierMaterialUniformsList: tierMeshesBuilt.map(
          (t) => t.materialUniforms
        ),
        subdivideFlags,
      };
      meshesRef.current = { staticMesh, tierMeshes: builtTierMeshes };
      becameActive = true;
      renderObjectRef.current = group;
      setRenderObject(group);

      // Only NOW — after this build's group has replaced renderObject — is
      // it safe to dispose the PREVIOUS build's resources. Disposing them
      // any earlier (e.g. in this effect's own cleanup, which fires the
      // instant `structural` changes rather than when the replacement is
      // actually ready) would free GPU resources still referenced by
      // whatever's currently mounted and rendering.
      const previousActive = activeResourcesRef.current;
      activeResourcesRef.current = {
        staticMesh,
        tierMeshes: builtTierMeshes,
      };
      if (previousActive) {
        if (previousActive.staticMesh) {
          previousActive.staticMesh.geometry.dispose();
          previousActive.staticMesh.material.dispose();
        }
        previousActive.tierMeshes.forEach((mesh) => {
          mesh.geometry.dispose();
          mesh.material.dispose();
        });
      }
    }

    build();

    return () => {
      cancelled = true;
      // This build was abandoned before ever being shown (structural
      // changed again while it was still in flight) — nothing else will
      // ever dispose what it already created, so do it here.
      if (!becameActive) {
        if (builtStaticMesh) {
          builtStaticMesh.geometry.dispose();
          builtStaticMesh.material.dispose();
        }
        builtTierMeshes.forEach((mesh) => {
          mesh.geometry.dispose();
          mesh.material.dispose();
        });
      }
      fieldRef.current = null;
      meshesRef.current = { staticMesh: null, tierMeshes: [] };
    };
  }, [structural, gl]);

  // Disposes whatever's CURRENTLY active only on true component unmount —
  // empty deps array, so this never fires on a regenerate (that's handled
  // by the build effect above, which hands disposal forward to the NEXT
  // build rather than doing it here). Without this, the last-active
  // build's resources would leak when the scene itself unmounts.
  useEffect(
    () => () => {
      const active = activeResourcesRef.current;
      if (!active) return;
      if (active.staticMesh) {
        active.staticMesh.geometry.dispose();
        active.staticMesh.material.dispose();
      }
      active.tierMeshes.forEach((mesh) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
    },
    []
  );

  // Non-structural knobs update live without a full regenerate. Position/
  // color/visibility are all BAKED now (both the kept mesh and every
  // subdivision tier) — only material props (roughness/metalness/emissive/
  // clearcoat/transmission, utils/materialStateNode.js) stay live via
  // uniforms, branching off each mesh's own baked `state` attribute.
  useEffect(() => {
    if (!fieldRef.current) return;
    updateMaterialStateUniforms(
      fieldRef.current.staticMaterialUniforms,
      config
    );
    fieldRef.current.tierMaterialUniformsList.forEach((uniforms) => {
      updateMaterialStateUniforms(uniforms, config);
    });
  }, [
    config.state1Roughness,
    config.state1Metalness,
    config.state1EmissiveColor,
    config.state1EmissiveIntensity,
    config.state1Clearcoat,
    config.state1ClearcoatRoughness,
    config.state1Transmission,
    config.state1Ior,
    config.state1Thickness,
    config.state2Roughness,
    config.state2Metalness,
    config.state2EmissiveColor,
    config.state2EmissiveIntensity,
    config.state2Clearcoat,
    config.state2ClearcoatRoughness,
    config.state2Transmission,
    config.state2Ior,
    config.state2Thickness,
    config.state3Roughness,
    config.state3Metalness,
    config.state3EmissiveColor,
    config.state3EmissiveIntensity,
    config.state3Clearcoat,
    config.state3ClearcoatRoughness,
    config.state3Transmission,
    config.state3Ior,
    config.state3Thickness,
  ]);

  // Both the kept mesh and every subdivision tier are real, baked geometry
  // with no per-cell shader logic — none of them can react to showState*/
  // bounds*/palette colors/debug-tier-colors on their own. Whenever those
  // change, re-read the already-generated CA/detail-enhance state (no full
  // regenerate — the structure itself hasn't changed) and rebake fresh
  // meshes, swapping them into the group in place. Deliberately does NOT
  // fire on every regenerate too (see the deps list below) — build() above
  // already bakes with the current config the first time; re-running this
  // right after would just rebake everything a second time for no reason.
  useEffect(() => {
    let cancelled = false;

    async function rebuildMeshes() {
      if (!fieldRef.current) return;
      const { field, subdivideFlags, detailField, tiersData } =
        fieldRef.current;

      const states = await readStatesForMeshing(
        gl,
        field.stateRevealBuf,
        field.totalVoxels
      );
      if (cancelled) return;
      // Detail-enhance mode (subdivideFlags non-null) still needs eroded
      // voxels zeroed out of the kept mesh here too, same as the initial
      // build — otherwise a showState*/bounds-triggered rebake would bring
      // back cells the fine tiers already own.
      const keptStates = subtractSubdivided(states, subdivideFlags);
      const filteredStates = applyVisibilityAndBoundsFilter(
        keptStates,
        field.k,
        config
      );
      const builtStatic = buildStaticMesh({
        states: filteredStates,
        k: field.k,
        cellSpacing: config.cellSpacing,
        config,
      });
      const nextStaticMesh = builtStatic.mesh;

      const nextTierMeshesBuilt =
        tiersData && tiersData.length
          ? await bakeAllTiers({ gl, tiers: tiersData, detailField, config })
          : [];

      if (cancelled) {
        nextStaticMesh.geometry.dispose();
        nextStaticMesh.material.dispose();
        nextTierMeshesBuilt.forEach((t) => {
          t.mesh.geometry.dispose();
          t.mesh.material.dispose();
        });
        return;
      }

      const previousStatic = meshesRef.current.staticMesh;
      const previousTiers = meshesRef.current.tierMeshes;
      const nextTierMeshes = nextTierMeshesBuilt.map((t) => t.mesh);
      const target = renderObjectRef.current;
      if (target) {
        if (previousStatic) target.remove(previousStatic);
        previousTiers.forEach((mesh) => target.remove(mesh));
        target.add(nextStaticMesh);
        nextTierMeshes.forEach((mesh) => target.add(mesh));
      }
      if (previousStatic) {
        previousStatic.geometry.dispose();
        previousStatic.material.dispose();
      }
      previousTiers.forEach((mesh) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });

      meshesRef.current = {
        staticMesh: nextStaticMesh,
        tierMeshes: nextTierMeshes,
      };
      // Keep activeResourcesRef in sync too — the build effect's own
      // disposal handoff (see there) reads these from here to dispose the
      // PREVIOUS regenerate's resources; if this rebake didn't update it,
      // that handoff would target already-disposed meshes instead of the
      // ones actually on screen.
      if (activeResourcesRef.current) {
        activeResourcesRef.current = {
          staticMesh: nextStaticMesh,
          tierMeshes: nextTierMeshes,
        };
      }
      // Re-point live material updates (the effect above) at the freshly
      // rebaked meshes' uniforms — the old ones belong to disposed materials.
      if (fieldRef.current) {
        fieldRef.current.staticMaterialUniforms = builtStatic.materialUniforms;
        fieldRef.current.tierMaterialUniformsList = nextTierMeshesBuilt.map(
          (t) => t.materialUniforms
        );
      }
    }

    rebuildMeshes();

    return () => {
      cancelled = true;
    };
  }, [
    // renderObject is deliberately NOT a dependency — see this effect's
    // intro comment. renderObjectRef (always current) is read inside
    // instead, so a fresh renderObject from a regenerate doesn't retrigger
    // this effect and double-bake everything build() just baked.
    gl,
    config.showState1,
    config.showState2,
    config.showState3,
    config.boundsShape,
    config.boundsSphereRadius,
    config.paletteStart,
    config.paletteMid,
    config.paletteEnd,
    config.debugTierColors,
  ]);

  if (!renderObject) {
    return null;
  }

  return <primitive object={renderObject} />;
}

export default memo(VoxelField);
