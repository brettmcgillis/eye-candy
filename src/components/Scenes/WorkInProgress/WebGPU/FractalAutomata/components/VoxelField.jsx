import {
  float,
  instanceIndex,
  positionGeometry,
  select,
  sqrt,
  uint,
  uniform,
  vec3,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useRef, useState } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import createContinuousFieldCompute from '../utils/continuousCompute';
import buildGreedyMeshGeometry from '../utils/greedyMesh';
import { decomposeIndexNode } from '../utils/gridIndex';
import createVoxelFieldCompute from '../utils/growthCompute';
import createPaletteNode from '../utils/paletteNode';
import { createRuleTables } from '../utils/ruleTables';

const REBUILD_DEBOUNCE_MS = 300;
const MAX_DELTA = 0.05;
const CUBE_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
// Some rule/density combinations can die off to (near) nothing. Rather than
// render an empty/near-empty grid, re-roll the seed locally (Leva's `seed`
// control is left untouched) a bounded number of times until the occupied
// count clears this floor, or give up and show whatever the last attempt
// produced.
const MIN_OCCUPIED_VOXELS = 64;
const MAX_REGEN_ATTEMPTS = 5;

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

// Full-buffer readback, hierarchical mode only, once per regenerate — feeds
// utils/greedyMesh.js. Only the state byte matters for meshing (final
// occupancy), not the baked revealTime the InstancedMesh path reads for its
// growth-reveal animation.
async function readStatesForMeshing(gl, stateRevealBuf, totalVoxels) {
  const bytes = await gl.getArrayBufferAsync(stateRevealBuf.value);
  const floats = new Float32Array(bytes);
  const states = new Uint8Array(totalVoxels);
  for (let i = 0; i < totalVoxels; i += 1) {
    states[i] = Math.round(floats[i * 2]);
  }
  return states;
}

// The InstancedMesh path hides cells via a live per-instance scale-gate
// (state visibility, sphere bounds — see the `revealed` computation below),
// but the greedy-meshed static mesh has no per-cell shader logic at all —
// it's real, static, baked geometry. To respect the same two controls, this
// returns a copy with whichever cells they'd hide zeroed out before meshing,
// so buildGreedyMeshGeometry never sees them.
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

// Builds the settled-structure representation: a single merged mesh via
// binary greedy meshing (utils/greedyMesh.js), swapped in once the growth
// animation completes (see the visibility toggle in useFrame below). Real
// geometry/normals/vertex colors — shadows and the scene's LightRig/
// CenterLight/Godrays lighting work exactly as they do for the InstancedMesh
// path, no special-casing needed, because this is still just a THREE.Mesh.
//
// Snapshots paletteStart/Mid/End and cellSpacing at build time — unlike the
// InstancedMesh path, this doesn't stay live-reactive to those controls
// (the geometry/vertex colors are baked once), so palette or spacing tweaks
// made after growth settles won't show until the next regenerate. showState*/
// bounds* are the exception — a dedicated effect below re-bakes and swaps in
// a fresh static mesh whenever those change, since they only filter which
// cells are meshed at all (applyVisibilityAndBoundsFilter), not color/scale.
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
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;
  mesh.visible = false;
  return mesh;
}

function pickStructuralSettings(config) {
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
    // Structural: switching modes changes the whole rendering strategy (see
    // build() below — continuous mode compacts every step instead of once,
    // is allocated at worst-case capacity, and has no static/greedy-meshed
    // representation), so it needs a full rebuild too.
    continuousEnabled: config.continuousEnabled,
    // Also structural: 'life' vs 'cyclic' need entirely different seeding
    // (copy the hierarchical resolve vs. random noise — see
    // utils/continuousCompute.js), and cyclicStates changing would otherwise
    // desync from the palette's maxState (captured once at build time below)
    // if it were live-tunable instead.
    continuousRuleMode: config.continuousRuleMode,
    continuousCyclicStates: config.continuousCyclicStates,
  };
}

// Owns the CA compute pipeline (regenerates on structural control changes),
// the growth-over-time reveal, and the InstancedMesh that renders it. In the
// default hierarchical mode, the mesh is sized to the compacted (occupied +
// surface-exposed) cell count — not the full k³ grid — via a one-time async
// readback after generation; see utils/growthCompute.js's compaction notes
// for why that's safe to do only once per regenerate rather than every
// frame. In continuous CA mode (config.continuousEnabled —
// utils/continuousCompute.js) the mesh is allocated at worst-case (full k³)
// capacity but recompacts to just the live cells after every step, with
// InstancedMesh.count trimmed each frame from an async live-count readback
// (see useFrame below) — occupancy keeps changing forever, so this recompacts
// continuously rather than once.
function VoxelField({ config, replayGrowthToken }) {
  const { gl } = useThree();
  const fieldRef = useRef(null);
  const growthProgressRef = useRef(null);
  const continuousAccumulatorRef = useRef(0);
  // Both meshes are mounted at once (inside the group set as renderObject);
  // useFrame below toggles which is `.visible` every frame based on growth
  // progress, rather than swapping React state, to avoid a re-render per
  // frame. staticMesh stays null in continuous mode.
  const meshesRef = useRef({ instancedMesh: null, staticMesh: null });
  const [renderObject, setRenderObject] = useState(null);

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
    // continuousEnabled was missing here too (pre-existing gap: toggling it
    // alone wouldn't retrigger this debounce, so the rebuild only happened
    // to pick up the new value incidentally, if some other structural
    // control was also touched) — fixed alongside the two new continuous
    // settings, since it's the same class of "structural continuous-mode
    // setting must retrigger a rebuild" issue.
    config.continuousEnabled,
    config.continuousRuleMode,
    config.continuousCyclicStates,
  ]);

  useEffect(() => {
    let cancelled = false;
    let builtInstancedMaterial = null;
    let builtStaticMesh = null;

    async function build() {
      const ruleTables = createRuleTables(structural);
      const field = createVoxelFieldCompute({
        level: structural.level,
        ruleTables,
      });

      // Runs full CA generation + one-time compaction; resolves once the
      // occupied-cell count is read back from the GPU (see
      // utils/growthCompute.js's compaction notes). Retries with a locally
      // re-rolled seed if generation comes back empty/near-empty.
      const occupiedCount = await dispatchWithFloor(field, gl, structural);
      if (cancelled) return;

      // Continuous CA (utils/continuousCompute.js) seeds itself from this
      // hierarchical resolve, then keeps stepping and recompacting on its
      // own forever, independent of this field's own (one-time) compaction.
      const continuous = structural.continuousEnabled
        ? createContinuousFieldCompute({
            level: structural.level,
            sourceStateBuf: field.stateRevealBuf,
            ruleMode: structural.continuousRuleMode,
            cyclicStates: structural.continuousCyclicStates,
            seed: structural.seed,
          })
        : null;
      if (continuous) {
        continuous.seed(gl);
      }

      // Greedy-meshed static representation of the settled structure — only
      // for the one-shot hierarchical mode (continuous CA never settles, so
      // there's nothing to bake). A second async point, so a cancellation
      // check follows it too.
      let staticMesh = null;
      if (!continuous) {
        const states = await readStatesForMeshing(
          gl,
          field.stateRevealBuf,
          field.totalVoxels
        );
        if (cancelled) return;
        const filteredStates = applyVisibilityAndBoundsFilter(
          states,
          field.k,
          config
        );
        staticMesh = buildStaticMesh({
          states: filteredStates,
          k: field.k,
          cellSpacing: config.cellSpacing,
          config,
        });
        builtStaticMesh = staticMesh;
      }

      const activeStateBuf = continuous
        ? continuous.stateBuf
        : field.stateRevealBuf;

      // Must mirror originalIndex's branching above exactly — createPaletteNode
      // derives its own internal index from whatever compactedIndexBuf is
      // passed here, independent of the position/scale computation below.
      // Cyclic mode never populates continuous.compactedIndexBuf (compaction
      // is skipped entirely — see continuousCompute.js), so passing it
      // unconditionally would leave every instance reading the same
      // (always-zero) cell for color, regardless of its actual position.
      let paletteCompactedIndexBuf;
      if (continuous && continuous.isCyclic) {
        paletteCompactedIndexBuf = null;
      } else if (continuous) {
        paletteCompactedIndexBuf = continuous.compactedIndexBuf;
      } else {
        paletteCompactedIndexBuf = field.compactedIndexBuf;
      }

      const palette = createPaletteNode({
        stateRevealBuf: activeStateBuf,
        compactedIndexBuf: paletteCompactedIndexBuf,
        k: field.k,
        // 3 for hierarchical/Life-style states (1/2/3); Cyclic CA's own
        // cycle length otherwise, so the 'state' color mode's gradient
        // spreads across however many states are actually in play.
        maxState: continuous ? continuous.maxState : 3,
      });
      // Fixed/Megalith-style presets ship with growthEnabled false from the
      // start — rather than freeze at 0 (an empty scene, since useFrame's
      // advance is also gated behind growthEnabled and would never run),
      // start already fully revealed. Toggling growthEnabled later via
      // ButtonOverlay's pause button is unaffected — that's a live pause of
      // wherever progress currently is, not this initial-value decision.
      const growthProgress = uniform(config.growthEnabled ? 0 : 1);
      const cellSpacing = uniform(config.cellSpacing);
      const cellScale = uniform(config.cellScale);

      const kMax = Math.max(1, field.k - 1);
      const half = kMax * 0.5;
      // Hierarchical mode compacts once per regenerate; continuous 'life'
      // mode recompacts every step (both utils/*Compute.js). Cyclic CA skips
      // compaction entirely (see continuousCompute.js — every cell is
      // always occupied, so compaction has nothing to cull) and reads
      // instanceIndex directly, 1:1 with the grid.
      let originalIndex;
      if (continuous && continuous.isCyclic) {
        originalIndex = instanceIndex;
      } else if (continuous) {
        originalIndex = continuous.compactedIndexBuf.element(instanceIndex);
      } else {
        originalIndex = field.compactedIndexBuf.element(instanceIndex);
      }
      const { x, y, z } = decomposeIndexNode(originalIndex, uint(field.k));
      const cellPosition = vec3(
        x.toFloat().sub(half),
        y.toFloat().sub(half),
        z.toFloat().sub(half)
      ).mul(cellSpacing);

      // Continuous cells always bake revealTime 0 (see continuousCompute.js),
      // so this same growthProgress-gated check reveals them the instant
      // they're alive, regardless of growthProgress's value — no branching
      // needed here for continuous vs. hierarchical mode.
      const cell = activeStateBuf.element(originalIndex);
      let revealed = cell.x
        .greaterThan(0.5)
        .and(growthProgress.greaterThanEqual(cell.y));

      // Cyclic-only, purely cosmetic (see getContinuousControls.js): when
      // enabled, hides whichever cell currently sits at the cycle's last
      // phase, so the mode reads as sparse instead of a solid block. Doesn't
      // touch compaction/storage — cyclicQuiescentPhaseEnabled is a live,
      // non-structural uniform (see the live-update effect below).
      const cyclicQuiescentPhaseEnabled = uniform(
        continuous &&
          continuous.isCyclic &&
          config.continuousCyclicQuiescentPhase
          ? 1
          : 0,
        'uint'
      );
      if (continuous && continuous.isCyclic) {
        const isLastPhase = cell.x.toUint().equal(uint(continuous.maxState));
        revealed = revealed.and(
          cyclicQuiescentPhaseEnabled.equal(uint(0)).or(isLastPhase.not())
        );
      }

      // Per-state visibility (getPaletteControls.js) — only gates the core
      // 3-state system; Cyclic CA's states beyond 3 fall through the final
      // `select` branch and stay unaffected, live-tunable (see the
      // live-update effect below).
      const showState1 = uniform(config.showState1 ? 1 : 0, 'uint');
      const showState2 = uniform(config.showState2 ? 1 : 0, 'uint');
      const showState3 = uniform(config.showState3 ? 1 : 0, 'uint');
      const cellStateUint = cell.x.toUint();
      const stateVisible = select(
        cellStateUint.equal(uint(1)),
        showState1,
        select(
          cellStateUint.equal(uint(2)),
          showState2,
          select(cellStateUint.equal(uint(3)), showState3, uint(1))
        )
      );
      revealed = revealed.and(stateVisible.notEqual(uint(0)));

      // Sphere bounds (getVoxelFieldControls.js) — render-time cutoff only;
      // the structure still generates/grows across the full cube, this just
      // hides cells beyond boundsSphereRadius (in half-cube-widths, so 1.0
      // is the sphere inscribed in the cube) at draw time. Live-tunable, no
      // regenerate needed — same distance-from-center math as
      // paletteNode.js's distanceFromCore color mode, computed separately
      // here since that one normalizes to the cube's circumscribed sphere
      // for color purposes, not a cutoff radius.
      const boundsIsSphere = uniform(
        config.boundsShape === 'sphere' ? 1 : 0,
        'uint'
      );
      const boundsSphereRadius = uniform(config.boundsSphereRadius ?? 1);
      const centerDx = x.toFloat().sub(half);
      const centerDy = y.toFloat().sub(half);
      const centerDz = z.toFloat().sub(half);
      const distanceFromCenter = sqrt(
        centerDx
          .mul(centerDx)
          .add(centerDy.mul(centerDy))
          .add(centerDz.mul(centerDz))
      );
      const withinSphere = distanceFromCenter.lessThanEqual(
        boundsSphereRadius.mul(half)
      );
      revealed = revealed.and(boundsIsSphere.equal(uint(0)).or(withinSphere));

      const scale = select(revealed, cellScale, float(0));

      // roughness matches ~/dev/examples/260708_AutomataChunks's own
      // materialRoughness default (0.92) — a matte, mostly-diffuse surface.
      const material = new THREE.MeshStandardNodeMaterial({
        roughness: 0.92,
        metalness: 0.05,
      });
      material.positionNode = positionGeometry.mul(scale).add(cellPosition);
      material.colorNode = palette.colorNode;

      if (cancelled) {
        material.dispose();
        return;
      }
      builtInstancedMaterial = material;

      // Worst-case allocation (the true live count isn't known until each
      // mode's compaction pass runs) — continuous mode's InstancedMesh.count
      // is then updated every frame from continuous.liveCountState (see
      // useFrame below); hierarchical mode's count is fixed at this
      // regenerate's compacted occupied+exposed count and never changes
      // again until the next regenerate.
      const instanceCount = continuous
        ? continuous.totalVoxels
        : Math.max(1, occupiedCount);
      const instancedMesh = new THREE.InstancedMesh(
        CUBE_GEOMETRY,
        material,
        instanceCount
      );
      instancedMesh.frustumCulled = false;
      instancedMesh.castShadow = true;
      instancedMesh.receiveShadow = true;

      const group = new THREE.Group();
      group.add(instancedMesh);
      if (staticMesh) group.add(staticMesh);

      continuousAccumulatorRef.current = 0;
      fieldRef.current = {
        field,
        continuous,
        palette,
        cellSpacing,
        cellScale,
        cyclicQuiescentPhaseEnabled,
        showState1,
        showState2,
        showState3,
        boundsIsSphere,
        boundsSphereRadius,
      };
      growthProgressRef.current = growthProgress;
      meshesRef.current = { instancedMesh, staticMesh };
      setRenderObject(group);
    }

    build();

    return () => {
      cancelled = true;
      if (builtInstancedMaterial) {
        builtInstancedMaterial.dispose();
      }
      if (builtStaticMesh) {
        builtStaticMesh.geometry.dispose();
        builtStaticMesh.material.dispose();
      }
      fieldRef.current = null;
      growthProgressRef.current = null;
      meshesRef.current = { instancedMesh: null, staticMesh: null };
    };
  }, [structural, gl]);

  // Non-structural knobs update live without a full regenerate. Also re-runs
  // on every `renderObject` change (i.e. after each rebuild/regenerate) —
  // otherwise a fresh palette starts from createPaletteNode's hardcoded
  // defaults instead of the current preset's colors until some palette
  // control is nudged.
  useEffect(() => {
    if (!fieldRef.current) return;
    fieldRef.current.cellSpacing.value = config.cellSpacing;
    fieldRef.current.cellScale.value = config.cellScale;
    fieldRef.current.cyclicQuiescentPhaseEnabled.value =
      fieldRef.current.continuous &&
      fieldRef.current.continuous.isCyclic &&
      config.continuousCyclicQuiescentPhase
        ? 1
        : 0;
    fieldRef.current.showState1.value = config.showState1 ? 1 : 0;
    fieldRef.current.showState2.value = config.showState2 ? 1 : 0;
    fieldRef.current.showState3.value = config.showState3 ? 1 : 0;
    fieldRef.current.boundsIsSphere.value =
      config.boundsShape === 'sphere' ? 1 : 0;
    fieldRef.current.boundsSphereRadius.value = config.boundsSphereRadius ?? 1;
    const { palette } = fieldRef.current;
    palette.uniforms.paletteStart.value = new THREE.Color(config.paletteStart);
    palette.uniforms.paletteMid.value = new THREE.Color(config.paletteMid);
    palette.uniforms.paletteEnd.value = new THREE.Color(config.paletteEnd);
    palette.uniforms.paletteMidpoint.value = config.paletteMidpoint;
    palette.uniforms.colorMode.value =
      palette.colorModeToInt[config.colorMode] ?? 0;
  }, [
    renderObject,
    config.cellSpacing,
    config.cellScale,
    config.continuousCyclicQuiescentPhase,
    config.showState1,
    config.showState2,
    config.showState3,
    config.boundsShape,
    config.boundsSphereRadius,
    config.paletteStart,
    config.paletteMid,
    config.paletteEnd,
    config.paletteMidpoint,
    config.colorMode,
  ]);

  // The greedy-meshed static mesh (hierarchical mode only) is real, baked
  // geometry with no per-cell shader logic — unlike the InstancedMesh path's
  // live scale-gate above, it can't react to showState*/bounds* on its own.
  // Whenever those change, re-read the already-generated CA state (no full
  // regenerate — the structure itself hasn't changed, just which cells of it
  // should show) and re-bake a fresh static mesh, swapping it into the group
  // in place.
  useEffect(() => {
    let cancelled = false;

    async function rebuildStaticMesh() {
      if (!fieldRef.current || fieldRef.current.continuous) return;
      const { field } = fieldRef.current;

      const states = await readStatesForMeshing(
        gl,
        field.stateRevealBuf,
        field.totalVoxels
      );
      if (cancelled) return;
      const filteredStates = applyVisibilityAndBoundsFilter(
        states,
        field.k,
        config
      );
      const nextStaticMesh = buildStaticMesh({
        states: filteredStates,
        k: field.k,
        cellSpacing: config.cellSpacing,
        config,
      });
      if (cancelled) {
        nextStaticMesh.geometry.dispose();
        nextStaticMesh.material.dispose();
        return;
      }

      const previous = meshesRef.current.staticMesh;
      nextStaticMesh.visible = previous ? previous.visible : false;

      if (renderObject) {
        if (previous) renderObject.remove(previous);
        renderObject.add(nextStaticMesh);
      }
      if (previous) {
        previous.geometry.dispose();
        previous.material.dispose();
      }
      meshesRef.current = { ...meshesRef.current, staticMesh: nextStaticMesh };
    }

    rebuildStaticMesh();

    return () => {
      cancelled = true;
    };
  }, [
    gl,
    renderObject,
    config.showState1,
    config.showState2,
    config.showState3,
    config.boundsShape,
    config.boundsSphereRadius,
  ]);

  // "Replay Growth" (ButtonOverlay) resets the reveal animation without
  // regenerating topology — same baked revealTimes, restarts from 0. In
  // continuous mode there's no revealTime to replay, so it instead re-seeds
  // the simulation back to its just-generated starting structure.
  useEffect(() => {
    if (!fieldRef.current) return;
    if (fieldRef.current.continuous) {
      fieldRef.current.continuous.seed(gl);
      continuousAccumulatorRef.current = 0;
      return;
    }
    if (growthProgressRef.current) {
      growthProgressRef.current.value = 0;
    }
  }, [replayGrowthToken, gl]);

  useFrame((_state, rawDelta) => {
    if (!fieldRef.current) return;
    const { continuous } = fieldRef.current;

    if (config.growthEnabled) {
      const delta = Math.min(Math.max(rawDelta, 1e-4), MAX_DELTA);
      if (continuous) {
        const interval = 1 / Math.max(0.1, config.continuousStepsPerSecond);
        continuousAccumulatorRef.current += delta;
        if (continuousAccumulatorRef.current >= interval) {
          continuousAccumulatorRef.current -= interval;
          continuous.step(gl, {
            surviveMin: config.continuousSurviveMin,
            surviveMax: config.continuousSurviveMax,
            birthMin: config.continuousBirthMin,
            birthMax: config.continuousBirthMax,
            cyclicThreshold: config.continuousCyclicThreshold,
          });
        }
      } else if (growthProgressRef.current) {
        const next =
          growthProgressRef.current.value +
          delta / Math.max(0.1, config.growthDurationSeconds);
        growthProgressRef.current.value = Math.min(1, next);
      }
    }

    // Continuous mode's InstancedMesh is allocated at worst-case (full k^3)
    // capacity. Cyclic CA always draws the full count (every cell is always
    // occupied — no compaction to shrink from, see continuousCompute.js).
    // 'life' mode's .count only shrinks to the compacted live count once
    // continuous.isLiveCountFresh() confirms that count corresponds to the
    // MOST RECENT recompaction — otherwise a just-grown region (already in
    // compactedIndexBuf, since recompaction is synchronous every step) would
    // get excluded by a stale, too-small count until its readback catches
    // up. Falling back to the worst case in that window never hides real
    // data — it just briefly draws some already-scale-gated-invisible
    // instances.
    const { instancedMesh, staticMesh } = meshesRef.current;
    if (continuous && instancedMesh) {
      if (continuous.isCyclic) {
        instancedMesh.count = continuous.totalVoxels;
      } else {
        instancedMesh.count = continuous.isLiveCountFresh()
          ? Math.max(1, continuous.liveCountState.current)
          : continuous.totalVoxels;
      }
    }

    // Swap to the greedy-meshed static mesh once growth settles. Runs
    // unconditionally (not gated behind growthEnabled above) so pausing
    // mid-growth, or "Replay Growth" resetting progress back to 0, both
    // resolve to the right mesh without any extra bookkeeping — this just
    // reads whatever growthProgress currently is.
    if (staticMesh && growthProgressRef.current) {
      const isComplete = growthProgressRef.current.value >= 1;
      if (instancedMesh) instancedMesh.visible = !isComplete;
      staticMesh.visible = isComplete;
    }
  });

  if (!renderObject) {
    return null;
  }

  return <primitive object={renderObject} />;
}

export default memo(VoxelField);
