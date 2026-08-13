// Preset snapshots for the scene. Keys here must match the Leva schema built
// in useSceneControls 1:1 — no reshaping between a preset and the controls it
// applies (see docs/scene-conventions.md, "Controls & presets"). Values here
// match components/getStructureControls.js / getPaletteControls.js /
// getCircleControls.js's own defaults exactly — angles (spreadAngle 120,
// initialAngle 60) and the generation params reproduce hex-trees.js's own
// values, per the reference this scene is ported from.
export const DEFAULT_PRESET = 'Default';

export const PRESETS = {
  Default: {
    treeCount: 3,
    treeSpacing: 45,
    seed: 260708,
    is3D: false,
    branchLength: 15,
    lengthRatio: 0.5,
    trunkThickness: 5,
    thicknessRatio: 0.6,
    radiusScale: 0.035,
    generationLimit: 4,
    iterationLimit: 30,
    forkProbPerGen: 0.3,
    forkProbPerIter: 0.13,
    spreadAngle: 120,
    initialAngle: 60,
    pitchAngle: 35,
    radialSegments: 8,
    colorMode: 'depth',
    paletteStart: '#2a5d34',
    paletteMid: '#8a9b3f',
    paletteEnd: '#e8d27a',
    paletteMidpoint: 0.5,
    circleProbability: 0.1,
    circleColor: '#f2e9d8',
    circleRadiusMin: 0.6,
    circleRadiusMax: 1.8,
    circleOpacity: 0.85,
  },
};

// Companion fn to usePresetsFolder. Given the snapshot for the preset being
// applied, return the control values to set. This scene has no derived
// values, so it applies the snapshot verbatim.
export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
