import { Vector3 } from 'three';

import React, { memo, useEffect, useState } from 'react';

import buildForestPlacements from '../utils/forestPlacement';
import createSeededRandom from '../utils/seededRandom';
import generateTree from '../utils/treeGenerator';
import BranchField from './BranchField';
import CircleField from './CircleField';

const REBUILD_DEBOUNCE_MS = 200;

// The subset of controls that actually change the generated structure —
// everything else (palette, circle color/opacity, radiusScale,
// radialSegments) is a live prop passed straight to BranchField/CircleField,
// mirroring FractalAutomata/components/VoxelField.jsx's structural/live
// split so a palette edit never regenerates the forest.
function pickStructural(config) {
  return {
    treeCount: config.treeCount,
    treeSpacing: config.treeSpacing,
    seed: config.seed,
    is3D: config.is3D,
    branchLength: config.branchLength,
    lengthRatio: config.lengthRatio,
    trunkThickness: config.trunkThickness,
    thicknessRatio: config.thicknessRatio,
    generationLimit: config.generationLimit,
    iterationLimit: config.iterationLimit,
    forkProbPerGen: config.forkProbPerGen,
    forkProbPerIter: config.forkProbPerIter,
    spreadAngle: config.spreadAngle,
    initialAngle: config.initialAngle,
    pitchAngle: config.pitchAngle,
    circleProbability: config.circleProbability,
    circleRadiusMin: config.circleRadiusMin,
    circleRadiusMax: config.circleRadiusMax,
  };
}

function rotateY(vector, angleRad) {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return new Vector3(
    vector.x * cos + vector.z * sin,
    vector.y,
    vector.z * cos - vector.x * sin
  );
}

// Generates every tree in the forest (utils/forestPlacement.js for per-tree
// seed/position, utils/treeGenerator.js for the actual structure) and
// flattens them into world-space branch/circle arrays — each tree is
// generated in its own local space, then rotated (placement.yaw, world Y
// axis — scatter variety, harmless in both 2D and 3D since it only spins
// the whole tree, never tilts its generation plane) and translated into the
// forest.
function buildForest(structural) {
  const placements = buildForestPlacements({
    seed: structural.seed,
    treeCount: structural.treeCount,
    spacing: structural.treeSpacing,
    is3D: structural.is3D,
  });

  const settings = {
    length: structural.branchLength,
    lengthRatio: structural.lengthRatio,
    thickness: structural.trunkThickness,
    thicknessRatio: structural.thicknessRatio,
    generationLimit: structural.generationLimit,
    iterationLimit: structural.iterationLimit,
    forkProbPerGen: structural.forkProbPerGen,
    forkProbPerIter: structural.forkProbPerIter,
    circleProb: structural.circleProbability,
    circleRadiusMin: structural.circleRadiusMin,
    circleRadiusMax: structural.circleRadiusMax,
    spreadAngle: structural.spreadAngle,
    initialAngle: structural.initialAngle,
    pitchAngle: structural.pitchAngle,
    is3D: structural.is3D,
  };

  const branches = [];
  const circles = [];

  placements.forEach((placement) => {
    const random = createSeededRandom(placement.treeSeed);
    const tree = generateTree({
      settings,
      random,
      treeIndex: placement.treeIndex,
    });
    const yaw = (placement.yaw * Math.PI) / 180;
    const offset = new Vector3(
      placement.position[0],
      placement.position[1],
      placement.position[2]
    );

    tree.branches.forEach((branch) => {
      branches.push({
        ...branch,
        start: rotateY(branch.start, yaw).add(offset),
        end: rotateY(branch.end, yaw).add(offset),
      });
    });
    tree.circles.forEach((circle) => {
      circles.push({
        ...circle,
        center: rotateY(circle.center, yaw).add(offset),
        normal: rotateY(circle.normal, yaw),
      });
    });
  });

  return { branches, circles };
}

function Forest({ config }) {
  const [structural, setStructural] = useState(() => pickStructural(config));

  useEffect(() => {
    const id = setTimeout(() => {
      const next = pickStructural(config);
      setStructural((prev) =>
        JSON.stringify(prev) === JSON.stringify(next) ? prev : next
      );
    }, REBUILD_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [
    config.treeCount,
    config.treeSpacing,
    config.seed,
    config.is3D,
    config.branchLength,
    config.lengthRatio,
    config.trunkThickness,
    config.thicknessRatio,
    config.generationLimit,
    config.iterationLimit,
    config.forkProbPerGen,
    config.forkProbPerIter,
    config.spreadAngle,
    config.initialAngle,
    config.pitchAngle,
    config.circleProbability,
    config.circleRadiusMin,
    config.circleRadiusMax,
  ]);

  const [forest, setForest] = useState(() => buildForest(structural));
  useEffect(() => {
    setForest(buildForest(structural));
  }, [structural]);

  return (
    <>
      <BranchField
        branches={forest.branches}
        radialSegments={config.radialSegments}
        radiusScale={config.radiusScale}
        unlit={!config.is3D}
        colorMode={config.colorMode}
        paletteStart={config.paletteStart}
        paletteMid={config.paletteMid}
        paletteEnd={config.paletteEnd}
        paletteMidpoint={config.paletteMidpoint}
      />
      <CircleField
        circles={forest.circles}
        circleColor={config.circleColor}
        circleOpacity={config.circleOpacity}
      />
    </>
  );
}

export default memo(Forest);
