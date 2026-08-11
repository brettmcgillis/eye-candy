import * as THREE from 'three/webgpu';

import React, { memo, useEffect, useMemo } from 'react';

import useTileMesh from '../hooks/useTileMesh';
import { buildSquareGrid } from '../utils/grid';
import buildTruchetColorNode from '../utils/motifShader';
import { pickRandomMotif } from '../utils/retileState';

function SquareTileMesh({ config }) {
  const {
    animMode,
    animSpeed,
    animStagger,
    bgColor,
    borderInset,
    cellSize,
    clipShape,
    fillMode,
    fillWidth,
    gridCols,
    gridRows,
    retileRate,
    seed,
    straightTileChance,
    strokeColor,
    strokePitch,
    strokeWidth,
  } = config;

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const grid = useMemo(
    () =>
      buildSquareGrid({
        cellSize,
        cols: gridCols,
        rows: gridRows,
        seed,
        straightTileChance,
      }),
    [cellSize, gridCols, gridRows, seed, straightTileChance]
  );

  // Half-width of the shorter grid axis, so a circle/square clip shape
  // never exceeds the tiled area on its narrower dimension.
  const patternExtent = Math.min(gridCols, gridRows) * cellSize * 0.5;

  const { material, meshRef } = useTileMesh({
    animMode,
    animSpeed,
    animStagger,
    bgColor,
    borderInset,
    buildColorNode: buildTruchetColorNode,
    cellSize,
    clipShape,
    fillMode,
    fillWidth,
    gridData: grid,
    patternExtent,
    pickMotif: pickRandomMotif,
    retileRate,
    straightTileChance,
    strokeColor,
    strokePitch,
    strokeWidth,
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
