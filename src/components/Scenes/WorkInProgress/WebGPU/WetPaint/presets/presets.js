// Preset snapshots. Keys here must match the flat Leva schema built in
// hooks/useSceneControls.js 1:1 (see docs/scene-conventions.md).
export const DEFAULT_PRESET = 'Day';

export const PRESETS = {
  Day: {
    mode: 'paint',
    brushColorR: 0.85,
    brushColorG: 0.15,
    brushColorB: 0.15,
    brushSize: 0.05,
    brushHardness: 0.7,
    brushTexture: 'clean',
    dripChance: 0.12,
    dripLength: 3,
    ambientIntensity: 0.9,
    sunIntensity: 1.2,
    streetlightEmissive: 0,
    spotIntensity: 0,
    streetlightScale: 3,
    skyColor: '#9fd3ff',
    wallWidth: 12,
    wallHeight: 3.2,
    wallSideDepth: 6,
    wallTint: '#9c5a45',
    scatterLayout: 'neat',
    canCount: 6,
    showTrash: false,
    scatterSeed: 1,
  },
  // Dark like UrbanWildlife: near-zero sun/ambient, the streetlight's beam
  // raking across the wall carries the scene (todo item 53).
  Night: {
    mode: 'paint',
    brushColorR: 0.1,
    brushColorG: 0.9,
    brushColorB: 0.9,
    brushSize: 0.06,
    brushHardness: 0.5,
    brushTexture: 'splatter',
    dripChance: 0.25,
    dripLength: 3.5,
    ambientIntensity: 0.06,
    sunIntensity: 0.03,
    streetlightEmissive: 6,
    spotIntensity: 350,
    streetlightScale: 3.6,
    skyColor: '#04070f',
    wallWidth: 12,
    wallHeight: 3.2,
    wallSideDepth: 6,
    wallTint: '#7a5040',
    scatterLayout: 'litter',
    canCount: 14,
    showTrash: true,
    scatterSeed: 2,
  },
};

export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
