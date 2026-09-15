// Keys here match the Leva schema built in useSceneControls 1:1 — no reshaping
// between a preset and the controls it applies (docs/scene-conventions.md,
// "Controls & presets"). Every preset is a complete snapshot so whichever one
// is active can seed the schema on first mount.
export const DEFAULT_PRESET = 'Circuitry';

// Line counts are small on purpose. A line has to keep clear of everything
// already drawn, its own earlier passes included, so it can only spiral in on
// itself or switch back alongside where it came from if there are few enough of
// them that each has room to develop.
const BASE = {
  axisAngle: 90,
  axisCell: 40,
  axisWander: 1.4,
  axisWeight: 0.5,
  border: 'None',
  borderMargin: 0.05,
  borderWidth: 1.5,
  clearance: 4,
  curlEvolve: 0.04,
  curlScale: 1,
  curlWeight: 0.35,
  emitInward: 0,
  feedRate: 0.055,
  fieldContrast: 3,
  fieldResolution: 1280,
  flowCost: 0.6,
  groundColor: '#07060a',
  killRate: 0.062,
  lifeSteps: 4000,
  lineColor: '#e8e3d5',
  lineSoftness: 0.08,
  lineThreshold: 0.25,
  lineWidth: 0.7,
  palette: 'Anamnisar',
  paletteExact: false,
  paletteMix: 1,
  paletteShift: 0,
  reactionResolution: 256,
  reactionWeight: 0.35,
  renderScale: 1,
  seed: 1,
  shape: 'Circle',
  shapeOffsetX: 0,
  shapeOffsetY: 0,
  shapeRotation: 0,
  shapeSize: 0.3,
  stagger: 400,
  stepLength: 3,
  stepScale: 14,
  stepsPerFrame: 3,
  turnCost: 2.5,
  walkerCount: 220,
  wobble: 0.15,
};

export const PRESETS = {
  // Coloured lines on a dark ground, straight strongly preferred, so a line
  // runs until it meets something and then takes the smallest turn past it.
  Circuitry: { ...BASE },

  // Wide clearance and very few lines, so each one has room to spiral in on
  // its own track rather than being stopped by a neighbour first.
  Spirals: {
    ...BASE,
    axisWeight: 0.2,
    clearance: 9,
    curlWeight: 0.15,
    flowCost: 0.2,
    reactionWeight: 0.12,
    stepLength: 5,
    turnCost: 6,
    walkerCount: 40,
    wobble: 0.02,
  },

  // Black on paper inside a frame, with the fields quiet enough that the walk
  // itself is doing the drawing.
  Plotter: {
    ...BASE,
    axisWeight: 0.6,
    border: 'Box',
    clearance: 5,
    groundColor: '#e8e3d5',
    lineColor: '#12100e',
    palette: 'None',
    paletteMix: 0,
    stepLength: 4,
    turnCost: 4,
    walkerCount: 140,
  },

  // Curl dominant and turning cheap, so lines take long shallow arcs and the
  // switchbacks come out as scallops rather than square corners.
  Currents: {
    ...BASE,
    axisWeight: 0.1,
    clearance: 6,
    curlScale: 1.8,
    curlWeight: 1,
    flowCost: 2.4,
    palette: 'Rose Water',
    reactionWeight: 0.2,
    stepLength: 3,
    turnCost: 0.6,
    walkerCount: 300,
  },

  // Points on a circle facing inward, filling the shape from its rim.
  Implosion: {
    ...BASE,
    border: 'Circle',
    clearance: 5,
    emitInward: 1,
    palette: 'Hazel',
    shape: 'Circle',
    shapeSize: 0.72,
    stagger: 900,
    turnCost: 4,
    walkerCount: 260,
  },
};

// Companion fn to usePresetsFolder. Given the snapshot for the preset being
// applied, return the control values to set.
export function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}
