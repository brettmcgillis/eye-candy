// Fluid config shared across both color variants.
// All debugXxx flags are false — the squares are rendered as scene geometry.
const SHARED_FLUID = {
  brightness: 1.76,
  contrast: 1.09,
  saturation: 1.64,
  blendMode: 0,
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
  stationarySplatStrength: 0.5,
  stationarySplatDyeStrength: 1.5,
  stationarySplatForce: 6000,
  stationarySplatDirectionStrength: 0.001,
  stationarySplatDirectionAngle: 270,
  // Positions are in height-normalised design UV space:
  //   x=0.5, y=0.5 → screen centre.
  // WatercolorSquares.jsx converts these to fluid UV via designToFluidUV
  // (aspect-corrected) before passing to the fluid simulation, while
  // WatercolorMarkerLayer uses them directly with uvToConstrainedWorld
  // (height-scaled on both axes).
  //
  // Argyle grid geometry — d = size / √2 ≈ 0.085.
  // Equal column separation and row half-step (d) ensures diagonal neighbours
  // have |Δx| = |Δy| so diamond edges are collinear, forming a clean grid.
  // Row step (same column) = 2d = 0.17.
  // Outlined splats (s=0.12) → tip-to-tip = s√2 ≈ 0.17 = 2d → edges meet.
  // Filled markers (s=0.10) → tip-to-tip ≈ 0.14 < 2d → sit inside cells.
  stationarySplatCount: 10,
  stationarySplats: [
    // Centre column – 4 fluid emitters (y = 0.5 ± d, 0.5 ± 3d)
    { x: 0.5, y: 0.245 },
    { x: 0.5, y: 0.415 },
    { x: 0.5, y: 0.585 },
    { x: 0.5, y: 0.755 },
    // Left column – 3 fluid emitters (y = 0.5 − 2d, 0.5, 0.5 + 2d)
    { x: 0.415, y: 0.33 },
    { x: 0.415, y: 0.5 },
    { x: 0.415, y: 0.67 },
    // Right column – 3 fluid emitters
    { x: 0.585, y: 0.33 },
    { x: 0.585, y: 0.5 },
    { x: 0.585, y: 0.67 },
  ],
  stationaryDebugMarkersEnabled: true,
  stationaryDebugMarkerCount: 7,
  stationaryDebugMarkers: [
    // Filled diamonds at midpoints between outlined splats.
    { x: 0.5, y: 0.33 },
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: 0.67 },
    { x: 0.415, y: 0.415 },
    { x: 0.415, y: 0.585 },
    { x: 0.585, y: 0.415 },
    { x: 0.585, y: 0.585 },
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
  debugStationarySplatWidth: 0.105,
  debugStationarySplatHeight: 0.105,
  debugStationarySplatLineWeight: 2,
  debugStationarySplatFill: false,
  debugStationarySplatRotation: 0,
  debugStationaryMarkerColor: '#000000',
  debugStationaryMarkerWidth: 0.1,
  debugStationaryMarkerHeight: 0.1,
  debugStationaryMarkerLineWeight: 2,
  debugStationaryMarkerFill: true,
  debugStationaryMarkerRotation: 0,
};

export const WATERCOLOR_SQUARES_PRESETS = {
  Red: {
    ...SHARED_FLUID,
    colorA: '#ff0000',
    colorB: '#ff0000',
    colorC: '#7b0000',
  },
  Blue: {
    ...SHARED_FLUID,
    colorA: '#0033ff',
    colorB: '#0033ff',
    colorC: '#001a7b',
  },
};

export const PRESET_NAMES = Object.keys(WATERCOLOR_SQUARES_PRESETS);
export const DEFAULT_PRESET = 'Red';
