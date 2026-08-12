// Preset snapshots for the scene. Keys here must match the Leva schema built
// in useSceneControls 1:1 — no reshaping between a preset and the controls it
// applies (see docs/scene-conventions.md, "Controls & presets").
export const DEFAULT_PRESET = 'Square Ink';

export const PRESETS = {
  'Square Ink': {
    animMode: 'ySpin',
    animSpeed: 0.9,
    animStagger: 0.6,
    bgColor: '#f5f2ea',
    borderColor: '#141414',
    borderInset: 0,
    borderThickness: 0.05,
    borderVisible: false,
    cellSize: 0.5,
    clipCornerRadius: 0.3,
    clipRotation: 0,
    clipShape: 'none',
    fillMode: 'line',
    fillWidth: 0.16,
    gridCols: 12,
    gridLineColor: '#999999',
    gridLineWidth: 0.01,
    gridMode: 'square',
    gridRows: 12,
    hexRadius: 6,
    layerBiasAmount: 0.15,
    planeRotation: 0,
    retileRate: 4,
    sceneBgColor: '#f5f2ea',
    seed: 1,
    showGridLines: false,
    straightTileChance: 0.15,
    strokeColor: '#141414',
    strokePitch: 0.14,
    strokeWidth: 0.04,
    weaveEnabled: false,
    weaveGapWidth: 0.06,
  },
};

// Companion fn to usePresetsFolder. Given the snapshot for the preset being
// applied, return the control values to set.
export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
