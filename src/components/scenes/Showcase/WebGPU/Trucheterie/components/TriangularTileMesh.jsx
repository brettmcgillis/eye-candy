import React, { memo, useEffect, useMemo } from 'react';

import useResubdivisionNonce from '../hooks/useResubdivisionNonce';
import useTileMesh from '../hooks/useTileMesh';
import { buildTriangularGrid } from '../utils/grid';
import { pickRandomTriMotif } from '../utils/retileState';
import { subdivideTriangularGrid } from '../utils/subdivision';
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
    gridLineColor,
    gridLineWidth,
    hexRadius,
    lanesEnabled,
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

  const resubdivisionNonce = useResubdivisionNonce({
    enabled: multiscaleEnabled && resubdivideEnabled,
    interval: resubdivideInterval,
  });
  const effectiveSeed = seed + resubdivisionNonce * 100000;

  const grid = useMemo(
    () =>
      multiscaleEnabled
        ? subdivideTriangularGrid({
            cellSize,
            hexRadius,
            lanesEnabled,
            maxGeneration,
            minGeneration,
            seed: effectiveSeed,
            splitProbability,
            straightTileChance,
            weaveEnabled,
          })
        : buildTriangularGrid({
            cellSize,
            hexRadius,
            lanesEnabled,
            seed,
            straightTileChance,
            weaveEnabled,
          }),
    [
      cellSize,
      effectiveSeed,
      hexRadius,
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

  const gridA = useMemo(
    () => ({
      count: grid.countA,
      motifIds: grid.motifIdsA,
      positions: grid.positionsA,
      sizes: grid.sizesA,
    }),
    [grid]
  );
  const gridB = useMemo(
    () => ({
      count: grid.countB,
      motifIds: grid.motifIdsB,
      positions: grid.positionsB,
      sizes: grid.sizesB,
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

  const sharedParams = {
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
    clipRotationDeg: clipRotation,
    clipShape,
    fillMode,
    fillWidth,
    gridLineColor,
    gridLineWidth,
    lanesEnabled,
    patternExtent,
    pickMotif: pickRandomTriMotif,
    retileEnabled,
    retileRate,
    showGridLines,
    straightTileChance,
    strokeColor,
    strokePitch,
    strokeWidth,
    weaveEnabled,
    weaveGapWidth,
  };

  const meshA = useTileMesh({
    ...sharedParams,
    buildColorNode: buildColorNodeA,
    gridData: gridA,
  });
  const meshB = useTileMesh({
    ...sharedParams,
    buildColorNode: buildColorNodeB,
    gridData: gridB,
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
