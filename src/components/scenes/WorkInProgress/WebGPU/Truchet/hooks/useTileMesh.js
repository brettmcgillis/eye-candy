import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { useEffect, useMemo, useRef } from 'react';

import { CLIP_SHAPE } from '../utils/clipMask';
import useRetileScheduler from './useRetileScheduler';

const FILL_MODE_CODE = { line: 0, solid: 1 };

// Shared per-mesh setup for one InstancedMesh of tiles: uniforms, the
// DoubleSide unlit material (colorNode supplied by the caller), the initial
// baseline instance matrices/motif attribute, and the retile scheduler.
// Reused as-is by both SquareTileMesh (one call) and TriangularTileMesh
// (two calls, one per triangle type) — only `geometry`, `buildColorNode`,
// `gridData` and `pickMotif` differ between grid modes.
export default function useTileMesh({
  animMode,
  animSpeed,
  animStagger,
  bgColor,
  borderInset,
  buildColorNode,
  cellSize,
  clipShape,
  fillMode,
  fillWidth,
  gridData,
  patternExtent,
  pickMotif,
  retileRate,
  straightTileChance,
  strokeColor,
  strokePitch,
  strokeWidth,
}) {
  const meshRef = useRef(null);

  const uniformsRef = useRef(null);
  if (!uniformsRef.current) {
    uniformsRef.current = {
      bgColorU: uniform(new THREE.Color(bgColor)),
      borderInsetU: uniform(borderInset),
      clipShapeU: uniform(
        CLIP_SHAPE[clipShape.toUpperCase()] ?? CLIP_SHAPE.NONE
      ),
      fillModeU: uniform(FILL_MODE_CODE[fillMode] ?? 0),
      fillWidthU: uniform(fillWidth),
      patternExtentU: uniform(patternExtent),
      pitchU: uniform(strokePitch),
      strokeColorU: uniform(new THREE.Color(strokeColor)),
      strokeWidthU: uniform(strokeWidth),
    };
  }

  useEffect(() => {
    const u = uniformsRef.current;
    u.bgColorU.value.set(bgColor);
    u.borderInsetU.value = borderInset;
    u.clipShapeU.value = CLIP_SHAPE[clipShape.toUpperCase()] ?? CLIP_SHAPE.NONE;
    u.fillModeU.value = FILL_MODE_CODE[fillMode] ?? 0;
    u.fillWidthU.value = fillWidth;
    u.patternExtentU.value = patternExtent;
    u.pitchU.value = strokePitch;
    u.strokeColorU.value.set(strokeColor);
    u.strokeWidthU.value = strokeWidth;
  }, [
    bgColor,
    borderInset,
    clipShape,
    fillMode,
    fillWidth,
    patternExtent,
    strokeColor,
    strokePitch,
    strokeWidth,
  ]);

  const material = useMemo(() => {
    const mat = new THREE.MeshBasicNodeMaterial();
    // DoubleSide: ySpin rotates a tile a full 180°, so by the second half of
    // the flip the camera is looking at what was the back face. The color
    // node corrects the UV by frontFacing so that face reads un-mirrored.
    mat.side = THREE.DoubleSide;
    mat.colorNode = buildColorNode(uniformsRef.current);
    return mat;
  }, [buildColorNode]);
  useEffect(() => () => material.dispose(), [material]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    mesh.geometry.setAttribute(
      'instanceMotif',
      new THREE.InstancedBufferAttribute(gridData.motifIds, 1, false)
    );

    const dummy = new THREE.Object3D();
    for (let i = 0; i < gridData.count; i += 1) {
      dummy.position.set(
        gridData.positions[i * 3 + 0],
        gridData.positions[i * 3 + 1],
        gridData.positions[i * 3 + 2]
      );
      dummy.scale.setScalar(cellSize);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.count = gridData.count;
  }, [gridData, cellSize]);

  useRetileScheduler({
    animMode,
    animSpeed,
    animStagger,
    cellSize,
    grid: gridData,
    meshRef,
    pickMotif,
    retileRate,
    straightTileChance,
  });

  return { material, meshRef };
}
