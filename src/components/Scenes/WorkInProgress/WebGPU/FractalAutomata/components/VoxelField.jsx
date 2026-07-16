import {
  float,
  instanceIndex,
  positionGeometry,
  select,
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
// made after growth settles won't show until the next regenerate.
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
    // build() below — continuous mode can't use compaction, so it renders a
    // differently-sized InstancedMesh), so it needs a full rebuild too.
    continuousEnabled: config.continuousEnabled,
  };
}

// Owns the CA compute pipeline (regenerates on structural control changes),
// the growth-over-time reveal, and the InstancedMesh that renders it. In the
// default hierarchical mode, the mesh is sized to the compacted (occupied-
// only) cell count — not the full k³ grid — via a one-time async readback
// after generation; see utils/growthCompute.js's compaction notes for why
// that's safe to do only once per regenerate rather than every frame. In
// continuous CA mode (config.continuousEnabled — utils/continuousCompute.js)
// the mesh instead renders the full k³ grid every frame, since occupancy
// keeps changing as the simulation steps forever.
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
      // hierarchical resolve, then keeps stepping on its own forever — it
      // can't use the compaction trick above (occupancy keeps changing), so
      // it renders the full k^3 grid directly by instanceIndex instead.
      const continuous = structural.continuousEnabled
        ? createContinuousFieldCompute({
            level: structural.level,
            sourceStateBuf: field.stateRevealBuf,
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
        staticMesh = buildStaticMesh({
          states,
          k: field.k,
          cellSpacing: config.cellSpacing,
          config,
        });
        builtStaticMesh = staticMesh;
      }

      const activeStateBuf = continuous
        ? continuous.stateBuf
        : field.stateRevealBuf;

      const palette = createPaletteNode({
        stateRevealBuf: activeStateBuf,
        compactedIndexBuf: continuous ? null : field.compactedIndexBuf,
        k: field.k,
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
      const originalIndex = continuous
        ? instanceIndex
        : field.compactedIndexBuf.element(instanceIndex);
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
      const revealed = cell.x
        .greaterThan(0.5)
        .and(growthProgress.greaterThanEqual(cell.y));
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

      // Compacted count in hierarchical mode (the whole point of the
      // compaction pass is to only draw/shade cells that are ever occupied
      // AND ever surface-exposed during growth — see growthCompute.js's
      // compactVisibleKernel — not the full k^3 grid; the full k^3 grid in
      // continuous mode, since occupancy keeps changing every step.
      const instanceCount = continuous
        ? field.totalVoxels
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
      fieldRef.current = { field, continuous, palette, cellSpacing, cellScale };
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
    config.paletteStart,
    config.paletteMid,
    config.paletteEnd,
    config.paletteMidpoint,
    config.colorMode,
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
          });
        }
      } else if (growthProgressRef.current) {
        const next =
          growthProgressRef.current.value +
          delta / Math.max(0.1, config.growthDurationSeconds);
        growthProgressRef.current.value = Math.min(1, next);
      }
    }

    // Swap to the greedy-meshed static mesh once growth settles. Runs
    // unconditionally (not gated behind growthEnabled above) so pausing
    // mid-growth, or "Replay Growth" resetting progress back to 0, both
    // resolve to the right mesh without any extra bookkeeping — this just
    // reads whatever growthProgress currently is.
    const { instancedMesh, staticMesh } = meshesRef.current;
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
