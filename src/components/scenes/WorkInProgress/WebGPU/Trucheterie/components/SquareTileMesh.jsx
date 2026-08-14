import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo } from 'react';

import useResubdivisionNonce from '../hooks/useResubdivisionNonce';
import useTileMesh from '../hooks/useTileMesh';
import { buildSquareGrid } from '../utils/grid';
import buildTruchetColorNode from '../utils/motifShader';
import { pickRandomMotif } from '../utils/retileState';
import { subdivideSquareGrid } from '../utils/subdivision';

function SquareTileMesh({ config }) {
  const {
    animMode,
    animSpeed,
    animStagger,
    bgColor,
    borderColor,
    borderInset,
    borderThickness,
    borderVisible,
    cellSize,
    clipCornerRadius,
    clipRotation,
    clipShape,
    fillMode,
    fillWidth,
    gridCols,
    gridLineColor,
    gridLineWidth,
    gridRows,
    lanesEnabled,
    layerBiasAmount,
    maxGeneration,
    minGeneration,
    multiscaleEnabled,
    resubdivideEnabled,
    resubdivideInterval,
    retileEnabled,
    retileRate,
    seed,
    showGridLines,
    splitProbability,
    straightTileChance,
    strokeColor,
    strokePitch,
    strokeWidth,
    weaveEnabled,
    weaveGapWidth,
  } = config;

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const resubdivisionNonce = useResubdivisionNonce({
    enabled: multiscaleEnabled && resubdivideEnabled,
    interval: resubdivideInterval,
  });
  const effectiveSeed = seed + resubdivisionNonce * 100000;

  const grid = useMemo(
    () =>
      multiscaleEnabled
        ? subdivideSquareGrid({
            cellSize,
            cols: gridCols,
            lanesEnabled,
            maxGeneration,
            minGeneration,
            rows: gridRows,
            seed: effectiveSeed,
            splitProbability,
            straightTileChance,
            weaveEnabled,
          })
        : buildSquareGrid({
            cellSize,
            cols: gridCols,
            lanesEnabled,
            rows: gridRows,
            seed,
            straightTileChance,
            weaveEnabled,
          }),
    [
      cellSize,
      effectiveSeed,
      gridCols,
      gridRows,
      lanesEnabled,
      maxGeneration,
      minGeneration,
      multiscaleEnabled,
      seed,
      splitProbability,
      straightTileChance,
      weaveEnabled,
    ]
  );

  // Half-width of the shorter grid axis, so a circle/square clip shape
  // never exceeds the tiled area on its narrower dimension.
  const patternExtent = Math.min(gridCols, gridRows) * cellSize * 0.5;

  const { material, meshRef } = useTileMesh({
    animMode,
    animSpeed,
    animStagger,
    bgColor,
    borderColor,
    borderInset,
    borderThickness,
    borderVisible,
    buildColorNode: buildTruchetColorNode,
    cellSize,
    clipCornerRadius,
    clipRotationDeg: clipRotation,
    clipShape,
    fillMode,
    fillWidth,
    gridData: grid,
    gridLineColor,
    gridLineWidth,
    lanesEnabled,
    layerBiasAmount,
    patternExtent,
    pickMotif: pickRandomMotif,
    retileEnabled,
    retileRate,
    showGridLines,
    straightTileChance,
    strokeColor,
    strokePitch,
    strokeWidth,
    weaveEnabled,
    weaveGapWidth,
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, grid.count]}
      frustumCulled={false}
    />
  );
}

export default memo(SquareTileMesh);
