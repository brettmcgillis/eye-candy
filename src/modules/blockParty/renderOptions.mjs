// Every knob Block Party's renderers accept, declared once
// (docs/block-party-pipeline.md). The scene's Leva folders are generated from
// it: `section` is the top folder and `group` the folder inside it.
// Dependency-free `.mjs` so plain Node and Vite's config loader can import it.
import createOptionSchema from '../optionSchema/index.mjs';

export const PALETTE_NONE = 'None';
export const COLOR_BY = [
  'district',
  'radial',
  'size',
  'random',
  'x',
  'y',
  'role',
];
export const COLOR_TARGETS = ['towers', 'cards', 'accents', 'all', 'none'];
export const VIEWS = ['front', 'right', 'back', 'left', 'plan'];
export const VIDEO_MODES = ['build', 'rebuild', 'turntable'];

// Azimuth of each named view around the city, in degrees; `plan` looks
// straight down. The reference is `front`.
export const VIEW_AZIMUTHS = {
  back: 225,
  front: 45,
  left: 315,
  plan: 45,
  right: 135,
};

function num(section, group, label, value, min, max, step, extra = {}) {
  return {
    default: value,
    group,
    help: label,
    label,
    max,
    min,
    placeholder: 'N',
    scene: true,
    scope: 'shared',
    section,
    step,
    type: 'number',
    ...extra,
  };
}

function choice(section, group, label, choices, value, extra = {}) {
  return {
    choices,
    default: value,
    group,
    help: `${label}: ${choices.join(', ')}`,
    label,
    scene: true,
    scope: 'shared',
    section,
    type: 'enum',
    ...extra,
  };
}

function flag(section, group, label, value, extra = {}) {
  return {
    default: value,
    group,
    help: label,
    label,
    scene: true,
    scope: 'shared',
    section,
    type: 'boolean',
    ...extra,
  };
}

function color(group, label, value) {
  return {
    default: value,
    group,
    help: label,
    label,
    scene: true,
    scope: 'shared',
    section: 'surface',
    type: 'color',
  };
}

const rolled = (facet, [min, max], spec) => ({
  ...spec,
  facet,
  roll: { max, min, step: spec.step },
});
const inFacet = (facet, spec) => ({ ...spec, facet });

const CITY = {
  seed: rolled(
    'composition',
    [1, 9999],
    num('city', null, 'Seed', 2, 1, 9999, 1, {
      help: 'City seed: the one stream the quadtree, roles and heights draw from',
    })
  ),
  referenceHeight: num('city', null, 'Reference Height', 900, 400, 1600, 10),
  citySize: num('city', null, 'City Size', 12, 2, 40, 0.5),
  honorSeedZoom: flag('city', null, 'Seed Crop', true, {
    help: 'Honour the sketch’s seeded 1-3× zoom, which crops the city',
  }),
};

const COMPOSITION = {
  towerAreaDivisor: rolled(
    'composition',
    [18, 50],
    num('composition', 'Role Mix', 'Tower Cutoff', 30, 10, 80, 1)
  ),
  landAreaDivisor: rolled(
    'composition',
    [5, 14],
    num('composition', 'Role Mix', 'Plaza Cutoff', 9, 3, 30, 0.5)
  ),
  stairAreaDivisor: rolled(
    'composition',
    [4, 12],
    num('composition', 'Role Mix', 'Stair Cutoff', 8, 2, 30, 0.5)
  ),
  pitEvery: rolled(
    'composition',
    [0, 6],
    num('composition', 'Role Mix', 'Pit Every Nth', 3, 0, 12, 1)
  ),
  neonChance: rolled(
    'composition',
    [0, 0.35],
    num('composition', 'Role Mix', 'Neon Chance', 0.1, 0, 1, 0.01)
  ),
  densityFalloff: rolled(
    'composition',
    [1, 4],
    num('composition', 'Density', 'Falloff', 2, 0.25, 8, 0.05)
  ),
  edgeRadius: rolled(
    'composition',
    [0.8, 1.42],
    num('composition', 'Density', 'Edge Radius', 1, 0.2, 1.42, 0.01)
  ),
  splitJitter: rolled(
    'composition',
    [0.2, 0.9],
    num('composition', 'Subdivision', 'Split Jitter', 0.5, 0, 1, 0.01)
  ),
  subdivisionDepth: rolled(
    'composition',
    [2, 3],
    num('composition', 'Subdivision', 'Depth', 2, 1, 4, 1)
  ),
  streetGap: rolled(
    'composition',
    [1, 8],
    num('composition', null, 'Street Gap', 4, 0, 20, 0.5)
  ),
  glowMode: inFacet(
    'composition',
    choice(
      'composition',
      null,
      'Glow Districts',
      ['reference', 'all', 'none', 'random'],
      'reference'
    )
  ),
};

const FORM = {
  towerHeightScale: rolled(
    'form',
    [0.5, 2],
    num('form', 'Towers', 'Height Scale', 1, 0, 4, 0.05)
  ),
  towerMinHeight: rolled(
    'form',
    [0, 60],
    num('form', 'Towers', 'Min Height', 20, 0, 200, 1)
  ),
  towerHeightRange: rolled(
    'form',
    [120, 600],
    num('form', 'Towers', 'Height Range', 300, 0, 1000, 5)
  ),
  towerHeightCurve: rolled(
    'form',
    [0.6, 3],
    num('form', 'Towers', 'Height Curve', 1, 0.1, 6, 0.05)
  ),
  towerCenterBias: rolled(
    'form',
    [-0.4, 0.8],
    num('form', 'Towers', 'Centre Bias', 0, -1, 1, 0.01)
  ),
  minTowerFootprint: num('form', 'Towers', 'Min Width', 6, 1, 24, 0.5),
  plazaLift: rolled(
    'form',
    [0.5, 3],
    num('form', 'Cards', 'Float', 1, 0, 6, 0.05)
  ),
  cardFloatJitter: rolled(
    'form',
    [0, 0.6],
    num('form', 'Cards', 'Float Jitter', 0, 0, 1, 0.01)
  ),
  cardThickness: num('form', 'Cards', 'Thickness', 0.6, 0.1, 12, 0.1),
  cardStack: rolled('form', [1, 3], num('form', 'Cards', 'Stack', 1, 1, 3, 1)),
  cardStackGap: num('form', 'Cards', 'Stack Gap', 8, 1, 60, 0.5),
  neonThickness: num('form', 'Cards', 'Pad Thickness', 0.5, 0.1, 12, 0.1),
  pitStyle: inFacet(
    'form',
    choice('form', 'Pits', 'Style', ['shaft', 'terraced'], 'shaft')
  ),
  pitLayers: rolled(
    'form',
    [4, 16],
    num('form', 'Pits', 'Layers', 10, 1, 30, 1)
  ),
  pitLayerDepth: num('form', 'Pits', 'Layer Depth', 10, 1, 40, 0.5),
  pitTerraceInset: num('form', 'Pits', 'Terrace Inset', 3, 0.5, 20, 0.5),
  stairDirection: inFacet(
    'composition',
    choice(
      'form',
      'Stairs',
      'Direction',
      ['random', 'forward', 'backward', 'alternate'],
      'random'
    )
  ),
  stairDrop: rolled(
    'form',
    [2, 8],
    num('form', 'Stairs', 'Drop', 4, 0.25, 20, 0.25)
  ),
  stairTaperScale: num('form', 'Stairs', 'Taper', 0, 0, 4, 0.05),
  stairTaperWall: flag('form', 'Stairs', 'Taper Wall', false),
  pedestalShape: inFacet(
    'composition',
    choice('form', null, 'Pedestal Shape', ['square', 'circle'], 'square')
  ),
  pedestalDepth: num('form', null, 'Pedestal Depth', 160, 0, 1200, 5),
};

const MOTION = {
  buildIn: flag('motion', 'Build', 'Build In', true),
  buildSeconds: num('motion', 'Build', 'Build Seconds', 8, 0.5, 30, 0.5),
  revealBand: num('motion', 'Build', 'Reveal Band', 0.3, 0.02, 1, 0.01),
  easing: choice(
    'motion',
    'Build',
    'Easing',
    ['smooth', 'linear', 'expo', 'back'],
    'smooth'
  ),
  overshoot: num('motion', 'Build', 'Overshoot', 1.7, 0, 4, 0.05),
  emergeStyle: choice(
    'motion',
    'Build',
    'Emerge Style',
    ['rise', 'unfold'],
    'rise'
  ),
  rollingRebuild: flag('motion', 'Rebuild', 'Rolling Rebuild', true),
  rebuildSeconds: num('motion', 'Rebuild', 'Every', 6, 1, 60, 0.5),
  rebuildOrder: choice(
    'motion',
    'Rebuild',
    'Order',
    ['sequential', 'random', 'spiral'],
    'sequential'
  ),
  cardBob: num('motion', 'Idle', 'Card Bob', 0, 0, 20, 0.1),
  cardBobRate: num('motion', 'Idle', 'Bob Rate', 0.6, 0, 4, 0.05),
  towerBreathe: num('motion', 'Idle', 'Tower Breathe', 0, 0, 0.5, 0.005),
  towerBreatheRate: num('motion', 'Idle', 'Breathe Rate', 0.5, 0, 4, 0.05),
  neonFlicker: num('motion', 'Idle', 'Neon Flicker', 0, 0, 1, 0.01),
  neonFlickerRate: num('motion', 'Idle', 'Flicker Rate', 8, 0.5, 30, 0.5),
  pulseRate: num('motion', 'Idle', 'Pulse Rate', 1.1, 0, 6, 0.05),
  pulseDepth: num('motion', 'Idle', 'Pulse Depth', 0.35, 0, 1, 0.01),
};

const SURFACE = {
  backgroundColor: {
    ...color(null, 'Background', '#ffffff'),
    help: 'Scene background. Never taken from the palette, so the plinth always stands off it',
  },
  groundColor: color('Paper', 'Ground', '#fcfcfc'),
  cardColor: color('Paper', 'Floating Card', '#fcfcfc'),
  cardEdgeColor: color('Paper', 'Card Edge', '#fcfcfc'),
  pedestalColor: color('Paper', 'Pedestal', '#fcfcfc'),
  groundPattern: choice(
    'surface',
    'Ground Pattern',
    'Pattern',
    ['crosshatch', 'dots', 'grid', 'none'],
    'none'
  ),
  patternColor: color('Ground Pattern', 'Colour', '#d8d8d8'),
  patternScale: num('surface', 'Ground Pattern', 'Scale', 16, 2, 120, 0.5),
  patternWidth: num(
    'surface',
    'Ground Pattern',
    'Width',
    0.12,
    0.01,
    0.5,
    0.005
  ),
  patternStrength: num(
    'surface',
    'Ground Pattern',
    'Strength',
    0.6,
    0,
    1,
    0.01
  ),
  towerBlend: choice('surface', 'Towers', 'Blend', ['glow', 'ink'], 'ink'),
  towerColor: color('Towers', 'Tower Top', '#000000'),
  towerBaseColor: color('Towers', 'Tower Base', '#000000'),
  towerBanding: num('surface', 'Towers', 'Banding', 0, 0, 60, 1),
  towerBandStrength: num(
    'surface',
    'Towers',
    'Band Strength',
    0.25,
    0,
    1,
    0.01
  ),
  towerInk: num('surface', 'Towers', 'Opacity', 1, 0, 3, 0.01),
  towerShadows: flag('surface', 'Towers', 'Shadows', true),
  pitRimColor: color('Pits', 'Rim', '#bfbfbf'),
  pitColor: color('Pits', 'Wall', '#050505'),
  pitStrataColor: color('Pits', 'Strata', '#3a3a3a'),
  pitStrataStrength: num('surface', 'Pits', 'Strata Strength', 0.5, 0, 1, 0.01),
  pitFloorColor: color('Pits', 'Floor', '#000000'),
  pitLineWidth: num('surface', 'Pits', 'Line Width', 0.12, 0.01, 0.5, 0.01),
  ringColor: color('Glow Pits', 'Rings', '#00aaff'),
  ringIntensity: num(
    'surface',
    'Glow Pits',
    'Ring Intensity',
    1.8,
    0,
    12,
    0.05
  ),
  glowFloorColor: color('Glow Pits', 'Floor', '#3c3c44'),
  wellWallColor: color('Stairs', 'Well Wall', '#d6d6d6'),
  wellFloorColor: color('Stairs', 'Well Floor', '#050505'),
  wellFalloff: num('surface', 'Stairs', 'Wall Falloff', 0.7, 0, 1, 0.01),
  stairHighColor: color('Stairs', 'Top Step', '#c8c8c8'),
  stairLowColor: color('Stairs', 'Deep Step', '#050505'),
  stairAlphaStep: num(
    'surface',
    'Stairs',
    'Step Darken',
    0.15,
    0.01,
    0.5,
    0.01
  ),
  riserShade: num('surface', 'Stairs', 'Riser Shade', 0.8, 0, 1, 0.01),
  neonMagentaColor: color('Neon', 'Magenta Slot', '#ff0066'),
  neonCyanColor: color('Neon', 'Cyan Slot', '#00ffcc'),
  neonAmberColor: color('Neon', 'Amber Slot', '#ffcc00'),
  neonIntensity: num('surface', 'Neon', 'Intensity', 1.15, 0, 8, 0.05),
};

const PALETTE = {
  palette: {
    default: PALETTE_NONE,
    facet: 'palette',
    group: null,
    help: `gradients.json palette name; ${PALETTE_NONE} keeps the authored surface colours`,
    label: 'Palette',
    placeholder: 'NAME',
    scene: true,
    scope: 'shared',
    section: 'palette',
    type: 'string',
  },
  paletteSurfaces: rolled(
    'palette',
    [0.6, 1],
    num('palette', null, 'Surface Mix', 1, 0, 1, 0.01, {
      help: 'How far the surfaces move from their authored colours to the palette’s roles (lightest stop = paper, darkest = ink)',
    })
  ),
  colorBy: inFacet(
    'palette',
    choice('palette', 'Cells', 'Colour By', COLOR_BY, 'district', {
      help: `Where a cell sits on the palette: ${COLOR_BY.join(', ')}`,
    })
  ),
  colorTarget: inFacet(
    'palette',
    choice('palette', 'Cells', 'Colour Target', COLOR_TARGETS, 'towers', {
      help: `What takes a per-cell palette colour: ${COLOR_TARGETS.join(', ')}`,
    })
  ),
  cellStrength: rolled(
    'palette',
    [0.5, 1],
    num('palette', 'Cells', 'Cell Strength', 1, 0, 1, 0.01)
  ),
  paletteShift: rolled(
    'palette',
    [-0.5, 0.5],
    num('palette', 'Cells', 'Shift', 0, -1, 1, 0.01)
  ),
  paletteRepeat: rolled(
    'palette',
    [0.5, 2],
    num('palette', 'Cells', 'Repeat', 1, 0.25, 4, 0.05)
  ),
  paletteReverse: inFacet(
    'palette',
    flag('palette', 'Cells', 'Reverse', false)
  ),
  paletteExact: inFacet(
    'palette',
    flag('palette', 'Cells', 'Exact Stops', true, {
      help: 'Snap cells to palette stops (one pen per stop) instead of blending',
    })
  ),
};

// Owned by the lighting and post rigs, which build their own Leva controls;
// declared here so a preset and a headless render carry them. Defaults are
// blockPartyRender's lighting.js and post.js.
const rig = (spec) => ({
  ...spec,
  group: null,
  rig: true,
  scene: true,
  scope: 'shared',
  section: 'post',
});
const RIG = {
  lightAmbientIntensity: rig({
    default: 1.68,
    help: 'Ambient light; ambient + sun = π lands the paper colour exactly',
    label: 'Ambient',
    max: 10,
    min: 0,
    step: 0.01,
    type: 'number',
  }),
  lightSunIntensity: rig({
    default: 1.46,
    help: 'Overhead sun that casts the card shadows',
    label: 'Sun',
    max: 10,
    min: 0,
    step: 0.01,
    type: 'number',
  }),
  postInkColor: rig({
    default: '#000000',
    help: 'Ink outline colour',
    label: 'Ink colour',
    type: 'color',
  }),
  postInkStrength: rig({
    default: 0.25,
    help: 'Ink outline strength',
    label: 'Ink',
    max: 1,
    min: 0,
    step: 0.01,
    type: 'number',
  }),
  postBloomStrength: rig({
    default: 0.35,
    help: 'Bloom strength',
    label: 'Bloom',
    max: 3,
    min: 0,
    step: 0.01,
    type: 'number',
  }),
  postBloomThreshold: rig({
    default: 0.85,
    help: 'Bloom threshold',
    label: 'Bloom threshold',
    max: 1,
    min: 0,
    step: 0.01,
    type: 'number',
  }),
  postGrainAmount: rig({
    default: 0.063,
    help: 'Film grain; 16/255 is the sketch’s own',
    label: 'Grain',
    max: 0.4,
    min: 0,
    step: 0.005,
    type: 'number',
  }),
};

const RENDER = {
  batch: {
    default: null,
    help: 'Batch seed: names the generations (batch, batch-1…) and seeds the facet rolls. Omit for a random one',
    label: 'Batch seed',
    nullable: true,
    placeholder: 'WORD',
    scope: 'shared',
    section: 'output',
    text: true,
    type: 'seed',
  },
  out: {
    cliOnly: true,
    default: 'output/block-party',
    help: 'Output directory (stills) or file (video)',
    placeholder: 'PATH',
    scope: 'shared',
    section: 'output',
    type: 'string',
  },
  width: {
    default: 1080,
    help: 'Width',
    label: 'Width',
    max: 8192,
    min: 64,
    placeholder: 'PX',
    scope: 'shared',
    section: 'output',
    step: 2,
    type: 'number',
  },
  height: {
    default: 1350,
    help: 'Height',
    label: 'Height',
    max: 8192,
    min: 64,
    placeholder: 'PX',
    scope: 'shared',
    section: 'output',
    step: 2,
    type: 'number',
  },
  pixelRatio: {
    choices: [1, 2, 3, 4],
    default: 2,
    help: 'Renders at width×ratio by height×ratio',
    label: 'Pixel ratio',
    max: 4,
    min: 1,
    scope: 'shared',
    section: 'output',
    type: 'number',
  },
  count: {
    default: 1,
    help: 'How many cities to roll',
    label: 'Count',
    max: 200,
    min: 1,
    placeholder: 'N',
    scope: 'shared',
    section: 'output',
    step: 1,
    type: 'number',
  },
  png: {
    default: false,
    help: 'Write PNG files',
    label: 'PNG',
    scope: 'still',
    section: 'output',
    type: 'boolean',
  },
  webp: {
    default: true,
    help: 'Write lossless WebP files',
    label: 'WebP',
    scope: 'still',
    section: 'output',
    type: 'boolean',
  },
  svg: {
    default: false,
    help: 'Write a plottable SVG per view: cell, card and tower edges, pit strata and stacked tower rings, one pen per colour',
    label: 'SVG',
    scope: 'still',
    section: 'output',
    type: 'boolean',
  },
  views: {
    default: 'front',
    help: `Comma-separated views: ${VIEWS.join(', ')}`,
    label: 'Views',
    placeholder: 'LIST',
    scope: 'still',
    section: 'output',
    type: 'string',
  },
  svgOcclusion: {
    default: true,
    help: 'Drop line work hidden behind nearer geometry (uses a depth pass)',
    label: 'SVG hidden lines',
    scope: 'still',
    section: 'svg',
    type: 'boolean',
  },
  svgStroke: {
    default: 0.6,
    help: 'Stroke width in output px; 0 draws hairlines',
    label: 'SVG stroke',
    max: 8,
    min: 0,
    placeholder: 'PX',
    scope: 'still',
    section: 'svg',
    step: 0.1,
    type: 'number',
  },

  margin: {
    default: 0.06,
    help: 'Space around the pedestal, as a share of the frame',
    label: 'Fit margin',
    max: 0.5,
    min: 0,
    scope: 'shared',
    section: 'render',
    step: 0.01,
    type: 'number',
  },
  samples: {
    choices: [0, 4],
    default: 4,
    help: 'MSAA samples',
    label: 'MSAA',
    max: 4,
    min: 0,
    scope: 'shared',
    section: 'render',
    type: 'number',
  },
  shadows: {
    default: true,
    help: 'Sun shadow map (the cards’ grey bands)',
    label: 'Shadows',
    scope: 'shared',
    section: 'render',
    type: 'boolean',
  },

  keep: {
    default: '',
    help: 'Comma-separated facets to hold while the rest roll: composition, form, palette',
    label: 'Hold facets',
    placeholder: 'LIST',
    scope: 'shared',
    section: 'roll',
    type: 'string',
  },
  base: {
    cliOnly: true,
    default: null,
    help: 'A city config (or props.json path) the roll starts from',
    nullable: true,
    placeholder: 'JSON',
    scope: 'shared',
    section: 'roll',
    type: 'json',
  },
  palettes: {
    array: true,
    cliOnly: true,
    default: null,
    help: 'Palette names the palette roll picks from (the CLI fills this from gradients.json)',
    nullable: true,
    placeholder: 'JSON',
    scope: 'shared',
    section: 'roll',
    type: 'json',
  },

  mode: {
    choices: VIDEO_MODES,
    default: 'build',
    help: 'build: the city emerges from the centre out, then holds; rebuild: districts recede and re-emerge one at a time; turntable: orbit a settled city',
    label: 'Mode',
    scope: 'video',
    section: 'video',
    type: 'enum',
  },
  view: {
    choices: VIEWS,
    default: 'front',
    help: 'Camera view for the clip',
    label: 'View',
    scope: 'video',
    section: 'video',
    type: 'enum',
  },
  fps: {
    choices: [24, 30, 60],
    default: 30,
    help: 'Frames per second',
    label: 'FPS',
    max: 60,
    min: 24,
    scope: 'video',
    section: 'video',
    type: 'number',
  },
  hold: {
    default: 12,
    help: 'Seconds held after the build (build), or seconds per city (rebuild, turntable)',
    label: 'Hold',
    max: 300,
    min: 0,
    placeholder: 'S',
    scope: 'video',
    section: 'video',
    step: 0.5,
    type: 'number',
  },
  turns: {
    default: 1,
    help: 'Turntable revolutions per city',
    label: 'Turns',
    max: 10,
    min: 0.25,
    placeholder: 'N',
    scope: 'video',
    section: 'video',
    step: 0.25,
    type: 'number',
  },
  orbit: {
    default: 0,
    help: 'Degrees the camera drifts around a build or rebuild clip',
    label: 'Orbit drift',
    max: 360,
    min: -360,
    placeholder: 'DEG',
    scope: 'video',
    section: 'video',
    step: 5,
    type: 'number',
  },
};

export const RENDER_OPTIONS = {
  ...CITY,
  ...COMPOSITION,
  ...FORM,
  ...MOTION,
  ...SURFACE,
  ...PALETTE,
  ...RIG,
  ...RENDER,
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': {
    count: 1,
    height: 1920,
    out: 'output/block-party.mp4',
  },
  workbench: { count: 6 },
};

export function resolveViews(list, fail = (message) => new Error(message)) {
  const views = String(list)
    .split(',')
    .map((view) => view.trim())
    .filter(Boolean);
  const unknown = views.filter((view) => !VIEWS.includes(view));
  if (views.length === 0 || unknown.length > 0) {
    throw fail(`views must name only ${VIEWS.join(', ')}.`);
  }
  return views;
}

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  sectionLabels: {
    city: 'city',
    composition: 'composition',
    form: 'form',
    motion: 'motion',
    output: 'output',
    palette: 'palette',
    post: 'light & post',
    render: 'render',
    roll: 'rolling',
    surface: 'surface',
    svg: 'svg',
    video: 'video',
  },
  surfaceDefaults: SURFACE_DEFAULTS,
  validate(kind, options, fail) {
    if (kind === 'still' && !options.png && !options.webp && !options.svg) {
      throw fail('Select at least one output format: PNG, WebP or SVG.');
    }
    const longest = Math.max(options.width, options.height);
    if (longest * options.pixelRatio > 8192) {
      throw fail(
        `width×pixelRatio must stay within 8192; the longest side would be ${longest * options.pixelRatio}.`
      );
    }
    if (kind === 'still') resolveViews(options.views, fail);
  },
});

export const {
  defaultsFor,
  facets,
  keysInFacet,
  normalizeOptions,
  optionsFor,
  sectionsFor,
  usageFor,
} = schema;

const keysWhere = (test) =>
  Object.entries(RENDER_OPTIONS)
    .filter(([, spec]) => test(spec))
    .map(([key]) => key);

export const SCENE_KEYS = keysWhere((spec) => spec.scene);
export const LEVA_KEYS = keysWhere((spec) => spec.scene && !spec.rig);
// The surfaces a palette can colour; the background stays authored.
export const COLOR_KEYS = keysWhere(
  (spec) => spec.section === 'surface' && spec.type === 'color'
).filter((key) => key !== 'backgroundColor');
// A composition key regenerates the city; a form key only re-lays its
// instances. Pedestal depth is neither: it only resizes the plinth.
const MODEL_FORM_KEYS = ['pedestalShape', 'stairDirection'];
export const COMPOSITION_KEYS = [
  ...keysWhere((spec) => spec.section === 'composition'),
  ...MODEL_FORM_KEYS,
];
export const FORM_KEYS = keysWhere((spec) => spec.section === 'form').filter(
  (key) => ![...MODEL_FORM_KEYS, 'pedestalDepth'].includes(key)
);

export const sceneDefaults = () =>
  Object.fromEntries(
    SCENE_KEYS.map((key) => [key, RENDER_OPTIONS[key].default])
  );

export function configFrom(source) {
  const flat = source?.preset ?? source ?? {};
  return Object.fromEntries(
    SCENE_KEYS.filter((key) => flat[key] != null).map((key) => [key, flat[key]])
  );
}

export const optionsFromConfig = (config = {}) => configFrom(config);

export function presetFromConfig(config = {}) {
  const defaults = sceneDefaults();
  return Object.fromEntries(
    Object.entries(config).filter(
      ([name, value]) =>
        name in defaults && value != null && value !== defaults[name]
    )
  );
}
