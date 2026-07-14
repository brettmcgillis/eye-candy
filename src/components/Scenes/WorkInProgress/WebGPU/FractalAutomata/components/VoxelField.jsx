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
// the growth-over-time reveal, and the InstancedMesh that renders it — a
// fixed-count mesh masking unrevealed/empty cells to zero scale rather than
// GPU-compacting a variable instance count (see utils/growthCompute.js).
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const ruleTables = createRuleTables(structural);
    const field = createVoxelFieldCompute({
      level: structural.level,
      ruleTables,
    });
    const palette = createPaletteNode({
      stateRevealBuf: field.stateRevealBuf,
      k: field.k,
    });
    const growthProgress = uniform(0);
    const cellSpacing = uniform(config.cellSpacing);
    const cellScale = uniform(config.cellScale);

    const kMax = Math.max(1, field.k - 1);
    const half = kMax * 0.5;
    const { x, y, z } = decomposeIndexNode(instanceIndex, uint(field.k));
    const cellPosition = vec3(
      x.toFloat().sub(half),
      y.toFloat().sub(half),
      z.toFloat().sub(half)
    ).mul(cellSpacing);

    const cell = field.stateRevealBuf.element(instanceIndex);
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

    const mesh = new THREE.InstancedMesh(
      CUBE_GEOMETRY,
      material,
      field.totalVoxels
    );
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    field.dispatch(gl, structural);

    fieldRef.current = { field, palette, cellSpacing, cellScale };
    growthProgressRef.current = growthProgress;
    setRenderObject(mesh);

    return () => {
      material.dispose();
      fieldRef.current = null;
      growthProgressRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structural, gl]);

  // Non-structural knobs update live without a full regenerate.
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
