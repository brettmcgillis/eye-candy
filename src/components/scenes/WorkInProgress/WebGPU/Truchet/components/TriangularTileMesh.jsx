import React, { memo, useEffect, useMemo } from 'react';

import useTileMesh from '../hooks/useTileMesh';
import { buildTriangularGrid } from '../utils/grid';
import { pickRandomTriMotif } from '../utils/retileState';
import {
  TRIANGLE_A,
  TRIANGLE_B,
  buildTriangleGeometry,
} from '../utils/triangleGeometry';
import buildTriangleColorNode from '../utils/triangularMotifs';

function TriangularTileMesh({ config }) {
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
    hexRadius,
    retileRate,
    seed,
    straightTileChance,
    strokeColor,
    strokePitch,
    strokeWidth,
  } = config;

  // Approximate circumradius of the hex pattern, so a circle/square clip
  // shape scales with hexRadius the same way patternExtent does for square.
  const patternExtent = hexRadius * cellSize;

  const geometryA = useMemo(
    () => buildTriangleGeometry(TRIANGLE_A.vertices),
    []
  );
  const geometryB = useMemo(
    () => buildTriangleGeometry(TRIANGLE_B.vertices),
    []
  );
  useEffect(() => {
    return () => {
      geometryA.dispose();
      geometryB.dispose();
    };
  }, [geometryA, geometryB]);

  const grid = useMemo(
    () =>
      buildTriangularGrid({
        cellSize,
        hexRadius,
        seed,
        straightTileChance,
      }),
    [cellSize, hexRadius, seed, straightTileChance]
  );

  const gridA = useMemo(
    () => ({
      count: grid.countA,
      motifIds: grid.motifIdsA,
      positions: grid.positionsA,
    }),
    [grid]
  );
  const gridB = useMemo(
    () => ({
      count: grid.countB,
      motifIds: grid.motifIdsB,
      positions: grid.positionsB,
    }),
    [grid]
  );

  const buildColorNodeA = useMemo(
    () => (uniforms) =>
      buildTriangleColorNode({ ...uniforms, points: TRIANGLE_A.points }),
    []
  );
  const buildColorNodeB = useMemo(
    () => (uniforms) =>
      buildTriangleColorNode({ ...uniforms, points: TRIANGLE_B.points }),
    []
  );

  const meshA = useTileMesh({
    animMode,
    animSpeed,
    animStagger,
    bgColor,
    borderInset,
    buildColorNode: buildColorNodeA,
    cellSize,
    clipShape,
    fillMode,
    fillWidth,
    gridData: gridA,
    patternExtent,
    pickMotif: pickRandomTriMotif,
    retileRate,
    straightTileChance,
    strokeColor,
    strokePitch,
    strokeWidth,
  });
  const meshB = useTileMesh({
    animMode,
    animSpeed,
    animStagger,
    bgColor,
    borderInset,
    buildColorNode: buildColorNodeB,
    cellSize,
    clipShape,
    fillMode,
    fillWidth,
    gridData: gridB,
    patternExtent,
    pickMotif: pickRandomTriMotif,
    retileRate,
    straightTileChance,
    strokeColor,
    strokePitch,
    strokeWidth,
  });

  return (
    <>
      <instancedMesh
        ref={meshA.meshRef}
        args={[geometryA, meshA.material, grid.countA]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={meshB.meshRef}
        args={[geometryB, meshB.material, grid.countB]}
        frustumCulled={false}
      />
    </>
  );
}

export default memo(TriangularTileMesh);
