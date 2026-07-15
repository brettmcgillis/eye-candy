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
  };
}

// Owns the CA compute pipeline (regenerates on structural control changes),
// the growth-over-time reveal, and the InstancedMesh that renders it. The
// mesh is sized to the compacted (occupied-only) cell count — not the full
// k³ grid — via a one-time async readback after generation; see
// utils/growthCompute.js's compaction notes for why this is safe to do only
// once per regenerate rather than every frame.
function VoxelField({ config, replayGrowthToken }) {
  const { gl } = useThree();
  const fieldRef = useRef(null);
  const growthProgressRef = useRef(null);
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
    let builtMaterial = null;

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

      const palette = createPaletteNode({
        stateRevealBuf: field.stateRevealBuf,
        compactedIndexBuf: field.compactedIndexBuf,
        k: field.k,
      });
      const growthProgress = uniform(0);
      const cellSpacing = uniform(config.cellSpacing);
      const cellScale = uniform(config.cellScale);

      const kMax = Math.max(1, field.k - 1);
      const half = kMax * 0.5;
      const originalIndex = field.compactedIndexBuf.element(instanceIndex);
      const { x, y, z } = decomposeIndexNode(originalIndex, uint(field.k));
      const cellPosition = vec3(
        x.toFloat().sub(half),
        y.toFloat().sub(half),
        z.toFloat().sub(half)
      ).mul(cellSpacing);

      const cell = field.stateRevealBuf.element(originalIndex);
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
      builtMaterial = material;

      // Compacted count, not field.totalVoxels — the whole point of the
      // compaction pass is to only draw/shade cells that are ever occupied.
      const mesh = new THREE.InstancedMesh(
        CUBE_GEOMETRY,
        material,
        Math.max(1, occupiedCount)
      );
      mesh.frustumCulled = false;
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      fieldRef.current = { field, palette, cellSpacing, cellScale };
      growthProgressRef.current = growthProgress;
      setRenderObject(mesh);
    }

    build();

    return () => {
      cancelled = true;
      if (builtMaterial) {
        builtMaterial.dispose();
      }
      fieldRef.current = null;
      growthProgressRef.current = null;
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
  // regenerating topology — same baked revealTimes, restarts from 0.
  useEffect(() => {
    if (growthProgressRef.current) {
      growthProgressRef.current.value = 0;
    }
  }, [replayGrowthToken]);

  useFrame((_state, rawDelta) => {
    if (!growthProgressRef.current) return;
    if (!config.growthEnabled) return;
    const delta = Math.min(Math.max(rawDelta, 1e-4), MAX_DELTA);
    const next =
      growthProgressRef.current.value +
      delta / Math.max(0.1, config.growthDurationSeconds);
    growthProgressRef.current.value = Math.min(1, next);
  });

  if (!renderObject) {
    return null;
  }

  return <primitive object={renderObject} />;
}

export default memo(VoxelField);
