import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';

import * as THREE from 'three/webgpu';

import { buildBlobField } from '@modules/trucheterieBlob';
import {
  applyFieldToMesh,
  createBlobMaterial,
  createBlobUniforms,
  createLaneTextures,
  disposeLaneTextures,
  fillLaneTextures,
  penGeometry,
  syncBlobUniforms,
} from '@modules/trucheterieBlobRender';

// Standalone from useTileMesh: the blob field has no motif enum, no retile
// animation and no per-tile background, so it shares no instance attributes
// or uniforms with the square/triangular grids. The mesh/material assembly
// below is shared with the headless TrucheterieCLI renderer through
// @modules/trucheterieBlobRender — see docs/flora-pipeline.md.
function BlobFieldMesh({ config }) {
  const {
    bgColor,
    blobCanvasSize,
    blobConnectivity,
    blobDistribution,
    blobGridSize,
    blobHoles,
    blobMeatballs,
    blobMonoColor,
    blobMonochrome,
    blobOneFill,
    blobPathsPerUnit,
    blobSeed,
    blobLaneMode,
    blobPalette,
    blobPaletteExact,
    blobPaletteShuffle,
    blobSizeFunction,
    strokeColor,
  } = config;

  const meshRef = useRef(null);
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const field = useMemo(
    () =>
      buildBlobField({
        canvasSize: blobCanvasSize,
        connectivity: blobConnectivity,
        distributionCount: blobDistribution,
        gridSize: blobGridSize,
        holes: blobHoles,
        meatballs: blobMeatballs,
        oneFill: blobOneFill,
        seed: blobSeed,
        sizeFunction: blobSizeFunction,
      }),
    [
      blobCanvasSize,
      blobConnectivity,
      blobDistribution,
      blobGridSize,
      blobHoles,
      blobMeatballs,
      blobOneFill,
      blobSeed,
      blobSizeFunction,
    ]
  );

  const laneTextures = useMemo(() => createLaneTextures(), []);
  useEffect(() => () => disposeLaneTextures(laneTextures), [laneTextures]);

  const laneInfo = useMemo(
    () =>
      fillLaneTextures(laneTextures, field.cells, {
        exact: blobPaletteExact,
        fallback: bgColor,
        mode: blobLaneMode,
        monoColor: blobMonoColor,
        monochrome: blobMonochrome,
        palette: blobPalette,
        pathDiv: blobPathsPerUnit,
        seed: blobSeed,
        shuffleSeed: blobPaletteShuffle,
      }),
    [
      bgColor,
      blobLaneMode,
      blobMonoColor,
      blobMonochrome,
      blobPalette,
      blobPaletteExact,
      blobPaletteShuffle,
      blobPathsPerUnit,
      blobSeed,
      field,
      laneTextures,
    ]
  );

  const uniformsRef = useRef(null);
  if (!uniformsRef.current) {
    uniformsRef.current = createBlobUniforms(strokeColor);
  }

  useEffect(() => {
    syncBlobUniforms(uniformsRef.current, {
      blobCanvasSize,
      config,
      field,
      laneInfo,
    });
  }, [blobCanvasSize, config, field, laneInfo]);

  const material = useMemo(
    () => createBlobMaterial(uniformsRef.current, laneTextures),
    [laneTextures]
  );
  useEffect(() => () => material.dispose(), [material]);

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { quadMargin } = penGeometry(blobGridSize);
    applyFieldToMesh(mesh, field, quadMargin);
  }, [blobGridSize, field]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, Math.max(field.count, 1)]}
      frustumCulled={false}
    />
  );
}

export default memo(BlobFieldMesh);
