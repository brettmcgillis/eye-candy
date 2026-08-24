import { folder } from 'leva';

// Structural controls: everything that feeds utils/treeGenerator.js and
// utils/forestPlacement.js, so a change here triggers Forest.jsx's debounced
// rebuild rather than a live uniform update. Ranges/defaults for the
// generation params mirror hex-trees.js's own min/max/step comments and
// values exactly (the reference this scene is ported from). forkProbPerGen/
// forkProbPerIter are exposed as direct probabilities rather than the
// source's inverted invForkProbPerGen/invForkProbPerIter sliders (the source
// converts those to direct probabilities in its first two lines anyway) —
// defaults (0.3, 0.13) are the same converted values, so Default reproduces
// the source's behavior exactly.
export default function getStructureControls(p = {}) {
  return folder(
    {
      treeCount: {
        label: 'Tree Count',
        value: p.treeCount ?? 3,
        min: 1,
        max: 24,
        step: 1,
      },
      treeSpacing: {
        label: 'Tree Spacing',
        value: p.treeSpacing ?? 45,
        min: 5,
        max: 150,
        step: 1,
      },
      seed: {
        label: 'Seed',
        value: p.seed ?? 260708,
        min: 0,
        max: 999999,
        step: 1,
      },
      is3D: { label: '3D Mode', value: p.is3D ?? false },
      branchLength: {
        label: 'Length',
        value: p.branchLength ?? 15,
        min: 1,
        max: 100,
        step: 1,
      },
      lengthRatio: {
        label: 'Length Ratio',
        value: p.lengthRatio ?? 0.5,
        min: 0,
        max: 1,
        step: 0.1,
      },
      trunkThickness: {
        label: 'Thickness',
        value: p.trunkThickness ?? 5,
        min: 1,
        max: 10,
        step: 1,
      },
      thicknessRatio: {
        label: 'Thickness Ratio',
        value: p.thicknessRatio ?? 0.6,
        min: 0,
        max: 1,
        step: 0.1,
      },
      radiusScale: {
        label: 'Radius Scale',
        value: p.radiusScale ?? 0.035,
        min: 0.005,
        max: 0.2,
        step: 0.005,
      },
      generationLimit: {
        label: 'Generation Limit',
        value: p.generationLimit ?? 4,
        min: 1,
        max: 20,
        step: 1,
      },
      iterationLimit: {
        label: 'Iteration Limit',
        value: p.iterationLimit ?? 30,
        min: 1,
        max: 30,
        step: 1,
      },
      forkProbPerGen: {
        label: 'Fork Prob / Gen',
        value: p.forkProbPerGen ?? 0.3,
        min: 0,
        max: 0.5,
        step: 0.001,
      },
      forkProbPerIter: {
        label: 'Fork Prob / Iter',
        value: p.forkProbPerIter ?? 0.13,
        min: 0,
        max: 0.5,
        step: 0.01,
      },
      spreadAngle: {
        label: 'Spread Angle',
        value: p.spreadAngle ?? 120,
        min: 0,
        max: 180,
        step: 1,
      },
      initialAngle: {
        label: 'Initial Angle',
        value: p.initialAngle ?? 60,
        min: 0,
        max: 360,
        step: 1,
      },
      pitchAngle: {
        label: 'Pitch Angle (3D)',
        value: p.pitchAngle ?? 35,
        min: 0,
        max: 90,
        step: 1,
      },
      radialSegments: {
        label: 'Radial Segments',
        value: p.radialSegments ?? 8,
        min: 3,
        max: 16,
        step: 1,
      },
    },
    { collapsed: true }
  );
}
