import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';

import { CLIP_SHAPE } from '../utils/clipMask';
import useRetileScheduler from './useRetileScheduler';

const FILL_MODE_CODE = { line: 0, solid: 1 };

function clipShapeCode(clipShape) {
  return CLIP_SHAPE[clipShape.toUpperCase()] ?? CLIP_SHAPE.NONE;
}

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
  borderColor,
  borderInset,
  borderThickness,
  borderVisible,
  buildColorNode,
  cellSize,
  clipCornerRadius,
  clipRotationDeg,
  clipShape,
  fillMode,
  fillWidth,
  gridData,
  gridLineColor,
  gridLineWidth,
  patternExtent,
  pickMotif,
  retileRate,
  showGridLines,
  straightTileChance,
  strokeColor,
  strokePitch,
  strokeWidth,
  weaveEnabled,
  weaveGapWidth,
}) {
  const meshRef = useRef(null);

  const uniformsRef = useRef(null);
  if (!uniformsRef.current) {
    uniformsRef.current = {
      bgColorU: uniform(new THREE.Color(bgColor)),
      borderColorU: uniform(new THREE.Color(borderColor)),
      borderInsetU: uniform(borderInset),
      borderThicknessU: uniform(borderThickness),
      borderVisibleU: uniform(borderVisible ? 1 : 0),
      clipCornerRadiusU: uniform(clipCornerRadius),
      clipRotationU: uniform(THREE.MathUtils.degToRad(clipRotationDeg)),
      clipShapeU: uniform(clipShapeCode(clipShape)),
      fillModeU: uniform(FILL_MODE_CODE[fillMode] ?? 0),
      fillWidthU: uniform(fillWidth),
      gridLineColorU: uniform(new THREE.Color(gridLineColor)),
      gridLineWidthU: uniform(gridLineWidth),
      patternExtentU: uniform(patternExtent),
      pitchU: uniform(strokePitch),
      showGridLinesU: uniform(showGridLines ? 1 : 0),
      strokeColorU: uniform(new THREE.Color(strokeColor)),
      strokeWidthU: uniform(strokeWidth),
      weaveGapWidthU: uniform(weaveGapWidth),
    };
  }

  useEffect(() => {
    const u = uniformsRef.current;
    u.bgColorU.value.set(bgColor);
    u.borderColorU.value.set(borderColor);
    u.borderInsetU.value = borderInset;
    u.borderThicknessU.value = borderThickness;
    u.borderVisibleU.value = borderVisible ? 1 : 0;
    u.clipCornerRadiusU.value = clipCornerRadius;
    u.clipRotationU.value = THREE.MathUtils.degToRad(clipRotationDeg);
    u.clipShapeU.value = clipShapeCode(clipShape);
    u.fillModeU.value = FILL_MODE_CODE[fillMode] ?? 0;
    u.fillWidthU.value = fillWidth;
    u.gridLineColorU.value.set(gridLineColor);
    u.gridLineWidthU.value = gridLineWidth;
    u.patternExtentU.value = patternExtent;
    u.pitchU.value = strokePitch;
    u.showGridLinesU.value = showGridLines ? 1 : 0;
    u.strokeColorU.value.set(strokeColor);
    u.strokeWidthU.value = strokeWidth;
    u.weaveGapWidthU.value = weaveGapWidth;
  }, [
    bgColor,
    borderColor,
    borderInset,
    borderThickness,
    borderVisible,
    clipCornerRadius,
    clipRotationDeg,
    clipShape,
    fillMode,
    fillWidth,
    gridLineColor,
    gridLineWidth,
    patternExtent,
    showGridLines,
    strokeColor,
    strokePitch,
    strokeWidth,
    weaveGapWidth,
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

  // useLayoutEffect, not useEffect: this must run before R3F's next render
  // paints the mesh, or the very first frame after a fresh mount (every
  // grid-mode switch mounts a brand-new InstancedMesh) can render with the
  // instanceMatrix/instanceMotif buffers still at their just-allocated,
  // all-zero default rather than this setup's data.
  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Reuse the existing attribute object when the instance count hasn't
    // changed (e.g. only `seed`/`straightTileChance` changed) instead of
    // always swapping in a brand-new InstancedBufferAttribute — mutating
    // the same object's array + needsUpdate is the pattern that reliably
    // reaches the GPU here (it's what useRetileScheduler's own per-frame
    // motif swaps already do); replacing the attribute object outright only
    // reliably takes effect when the mesh itself is also rebuilt (e.g. a
    // grid-size change recreates the InstancedMesh via its `args`).
    const existing = mesh.geometry.getAttribute('instanceMotif');
    if (existing && existing.array.length === gridData.motifIds.length) {
      existing.array.set(gridData.motifIds);
      existing.needsUpdate = true;
    } else {
      mesh.geometry.setAttribute(
        'instanceMotif',
        new THREE.InstancedBufferAttribute(gridData.motifIds, 1, false)
      );
    }

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
    weaveEnabled,
  });

  return { material, meshRef };
}
