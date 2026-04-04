// Fluid config shared across both color variants.
// All debugXxx flags are false — the squares are rendered as scene geometry.
const SHARED_FLUID = {
  paused: false,
  pressureRelax: 0.84,
  pressureIterations: 14,
  vorticity: 54,
  velocityDissipation: 0.4,
  densityDissipation: 1.6,
  splatRadius: 0.0005,
  autoSplatRadius: 0.0005,
  stationarySplatRadius: 0.0005,
  randomSplatRadius: 0.0022,
  splatForce: 4200,
  dyeStrength: 0.25,
  inputMode: 'pointer',
  autoSplat: false,
  autoSplatStrength: 0.03,
  autoSplatDyeStrength: 2.5,
  autoSplatForce: 950,
  autoSplatRate: 100,
  autoSplatRange: 1,
  autoSplatBurst: 4,
  autoSplatCount: 2,
  autoSplatStarts: [
    { x: 0.5, y: 0.4 },
    { x: 0.5, y: 0.5 },
  ],
  randomSplatStrength: 1,
  randomSplatDyeStrength: 1.71,
  randomSplatForce: 4200,
  stationarySplatsEnabled: true,
  stationarySplatStrength: 0.51,
  stationarySplatDyeStrength: 0.51,
  stationarySplatForce: 4200,
  stationarySplatDirectionStrength: 0.0005,
  stationarySplatDirectionAngle: 270,
  // Positions are in height-normalised design UV space:
  //   x=0.5, y=0.5 → screen center; ±0.07 in x ≈ ±7% of viewport height.
  // WatercolorSquares.jsx converts these to fluid UV via designToFluidUV
  // (aspect-corrected) before passing to the fluid simulation, while
  // WatercolorMarkerLayer uses them directly with uvToConstrainedWorld
  // (height-scaled on both axes).
  // Positions use height-normalised design UV:
  //   x=0.5 / y=0.5 → screen centre; ±0.13 in x ≈ ±13 % of viewport height.
  // Classic argyle geometry: column separation = 0.13, row half-step = 0.075.
  // Outlined splats (s=0.12) → tip-to-tip = 0.17 h > 0.15 separation → slight
  // overlap creates the argyle crossing lines.
  // Filled markers (s=0.09) → tip-to-tip = 0.127 h < 0.15 → sit inside cells.
  stationarySplatCount: 10,
  stationarySplats: [
    // Centre column – 4 fluid emitters
    { x: 0.5, y: 0.275 },
    { x: 0.5, y: 0.425 },
    { x: 0.5, y: 0.575 },
    { x: 0.5, y: 0.725 },
    // Left column – 3 fluid emitters (argyle half-step offset)
    { x: 0.37, y: 0.35 },
    { x: 0.37, y: 0.5 },
    { x: 0.37, y: 0.65 },
    // Right column – 3 fluid emitters (argyle half-step offset)
    { x: 0.63, y: 0.35 },
    { x: 0.63, y: 0.5 },
    { x: 0.63, y: 0.65 },
  ],
  stationaryDebugMarkersEnabled: true,
  stationaryDebugMarkerCount: 7,
  stationaryDebugMarkers: [
    // Filled diamonds sit at midpoints between the outlined splats.
    // Centre col splats are at y=0.275/0.425/0.575/0.725 → midpoints 0.350/0.500/0.650
    // Side col splats are at y=0.350/0.500/0.650 → midpoints 0.425/0.575
    { x: 0.5, y: 0.35 }, // centre upper-mid
    { x: 0.5, y: 0.5 }, // centre middle
    { x: 0.5, y: 0.65 }, // centre lower-mid
    { x: 0.37, y: 0.425 }, // left upper-mid
    { x: 0.37, y: 0.575 }, // left lower-mid
    { x: 0.63, y: 0.425 }, // right upper-mid
    { x: 0.63, y: 0.575 }, // right lower-mid
  ],
  shading: true,
  bgA: '#4b4b4b',
  bgB: '#797979',
  bloom: true,
  bloomResolution: 0.2,
  bloomIterations: 4,
  bloomIntensity: 0.5,
  bloomThreshold: 0.62,
  bloomSoftKnee: 0.7,
  sunrays: true,
  sunraysResolution: 0.16,
  sunraysWeight: 0.9,
  colorful: true,
  colorUpdateSpeed: 20,
  colorCycleSpeed: 0.55,
  dithering: false,
  ditherStrength: 2.85,
  ditherScale: 1,
  debugCursor: false,
  debugAutoSplat: false,
  debugStationarySplat: false,
  debugRandomBurst: false,
  // Geometry marker appearance — debugXxx fields drive the marker layer.
  // The shader debug flags stay false so the display shader does not render
  // its own marker pass.
  debugStationarySplatColor: '#000000',
  debugStationarySplatWidth: 0.12,
  debugStationarySplatHeight: 0.12,
  debugStationarySplatLineWeight: 2,
  debugStationarySplatFill: false,
  debugStationarySplatRotation: 0,
  debugStationaryMarkerColor: '#000000',
  debugStationaryMarkerWidth: 0.09,
  debugStationaryMarkerHeight: 0.09,
  debugStationaryMarkerLineWeight: 2,
  debugStationaryMarkerFill: true,
  debugStationaryMarkerRotation: 0,
};

export const WATERCOLOR_SQUARES_PRESETS = {
  'Warm Red': {
    ...SHARED_FLUID,
    colorA: '#ff0000',
    colorB: '#ff0000',
    colorC: '#7b0000',
    brightness: 1.76,
    contrast: 1.09,
    saturation: 1.64,
    blendMode: 0,
  },
  Blue: {
    ...SHARED_FLUID,
    colorA: '#0033ff',
    colorB: '#0033ff',
    colorC: '#001a7b',
    brightness: 1.76,
    contrast: 1.09,
    saturation: 1.64,
    blendMode: 0,
  },
};

export const PRESET_NAMES = Object.keys(WATERCOLOR_SQUARES_PRESETS);
export const DEFAULT_PRESET = 'Warm Red';
