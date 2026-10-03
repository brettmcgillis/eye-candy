// Every knob Brutalist's renderers accept, declared once
// (docs/brutalist-pipeline.md). Both scenes' Leva folders are generated from
// it: `section` is the top folder, `group` the folder path inside it, and
// `stages` the scenes that show it (forest, maquette). `when` hides a control
// unless every named key holds one of the listed values. Dependency-free
// `.mjs` so plain Node and Vite's config loader can import it.
import createOptionSchema from '../optionSchema/index.mjs';

export const FAMILIES = ['monolith', 'habitable', 'spomenik'];
export const LAYOUTS = ['slab', 'tower', 'stack'];
export const MOTIFS = ['fan', 'split', 'ring', 'pierced'];
export const LOOKS = ['weathered', 'maquette'];
export const BIOMES = ['conifer', 'deciduous', 'bare', 'mixed'];
export const STAGES = ['forest', 'maquette'];
export const VIEWS = ['approach', 'hero', 'front', 'right', 'back', 'left'];
export const VIDEO_MODES = ['turntable', 'drift'];
export const MAX_TREES = 1600;

// Degrees round the structure from +x toward +z, and elevation above the
// horizon. `approach` stands at eye height out in the trees and looks up.
export const VIEW_AZIMUTHS = {
  approach: 62,
  back: 270,
  front: 90,
  hero: 45,
  left: 180,
  right: 0,
};
export const VIEW_ELEVATIONS = { approach: 0, hero: 14 };
export const VIEW_ELEVATION = 6;

const BOTH = ['forest', 'maquette'];
const FOREST = ['forest'];
const MAQUETTE = ['maquette'];

function spec(type, section, group, label, value, extra = {}) {
  return {
    default: value,
    group,
    help: label,
    label,
    scene: true,
    scope: 'shared',
    section,
    stages: BOTH,
    type,
    ...extra,
  };
}

const num = (section, group, label, value, min, max, step, extra = {}) =>
  spec('number', section, group, label, value, {
    max,
    min,
    placeholder: 'N',
    step,
    ...extra,
  });
const choice = (section, group, label, choices, value, extra = {}) =>
  spec('enum', section, group, label, value, {
    choices,
    help: `${label}: ${choices.join(', ')}`,
    ...extra,
  });
const color = (section, group, label, value, extra = {}) =>
  spec('color', section, group, label, value, extra);

const rolled = (facet, [min, max], item) => ({
  ...item,
  facet,
  roll: { max, min, step: item.step },
});
const inFacet = (facet, item) => ({ ...item, facet });
const forest = (item) => ({ ...item, stages: FOREST });
const maquette = (item) => ({ ...item, stages: MAQUETTE });

const isMonolith = { family: ['monolith'] };
const isHabitable = { family: ['habitable'] };
const isSpomenik = { family: ['spomenik'] };

const FORM = {
  family: inFacet(
    'form',
    choice('form', null, 'Family', FAMILIES, 'monolith', {
      optionLabels: {
        habitable: 'Habitable',
        monolith: 'Monolith',
        spomenik: 'Spomenik',
      },
    })
  ),
  formSeed: rolled(
    'form',
    [0, 9999],
    num('form', null, 'Seed', 7, 0, 9999, 1, {
      help: 'Form seed: every choice the grammar makes',
    })
  ),
  structureHeight: rolled(
    'form',
    [60, 150],
    num('form', 'Massing', 'Height', 100, 20, 400, 1, {
      help: 'Height of the tallest mass in metres',
    })
  ),
  footprint: rolled(
    'form',
    [40, 90],
    num('form', 'Massing', 'Footprint', 64, 15, 220, 1, {
      help: 'Width of the main mass in metres',
    })
  ),
  aspect: rolled(
    'form',
    [0.4, 1],
    num('form', 'Massing', 'Depth Ratio', 0.7, 0.2, 1, 0.01, {
      help: 'Depth of the main mass as a share of its width',
    })
  ),
  complexity: rolled(
    'form',
    [0.3, 0.9],
    num('form', 'Massing', 'Complexity', 0.6, 0, 1, 0.01, {
      help: 'How many operations the grammar applies',
    })
  ),
  openings: rolled(
    'form',
    [0.05, 0.7],
    num('form', 'Detail', 'Openings', 0.35, 0, 1, 0.01, {
      help: 'Window density',
    })
  ),
  humanDetail: num('form', 'Detail', 'Human Scale', 1, 0, 1, 0.01, {
    help: 'Doors, steps and drain spouts: the details the eye measures by',
  }),
  litWindows: num('form', 'Detail', 'Lit Windows', 0, 0, 12, 1, {
    help: 'Windows with a light on behind them',
  }),
  tiers: rolled(
    'form',
    [1, 4],
    num('form', 'Monolith', 'Tiers', 3, 1, 6, 1, { when: isMonolith })
  ),
  overhang: rolled(
    'form',
    [0, 1],
    num('form', 'Monolith', 'Overhang', 0.5, 0, 1, 0.01, {
      help: 'Chance a tier cantilevers out instead of stepping back',
      when: isMonolith,
    })
  ),
  fins: rolled(
    'form',
    [0, 1],
    num('form', 'Monolith', 'Fins', 0.5, 0, 1, 0.01, {
      help: 'Chance a face carries a row of vertical fins',
      when: isMonolith,
    })
  ),
  slots: rolled(
    'form',
    [0, 1],
    num('form', 'Monolith', 'Slots', 0.4, 0, 1, 0.01, {
      help: 'Chance a tier is undercut by a deep horizontal slot',
      when: isMonolith,
    })
  ),
  cores: rolled(
    'form',
    [0, 3],
    num('form', 'Monolith', 'Cores', 1, 0, 4, 1, {
      help: 'Windowless service shafts against the main mass',
      when: isMonolith,
    })
  ),
  layout: inFacet(
    'form',
    choice('form', 'Habitable', 'Layout', LAYOUTS, 'slab', {
      optionLabels: { slab: 'Slab', stack: 'Stacked Units', tower: 'Tower' },
      when: isHabitable,
    })
  ),
  floorHeight: num('form', 'Habitable', 'Floor Height', 3.2, 2.6, 5, 0.1, {
    when: isHabitable,
  }),
  balconyDepth: rolled(
    'form',
    [0.8, 3],
    num('form', 'Habitable', 'Balcony Depth', 1.8, 0, 5, 0.1, {
      when: isHabitable,
    })
  ),
  pilotis: rolled(
    'form',
    [0, 14],
    num('form', 'Habitable', 'Pilotis', 0, 0, 24, 0.5, {
      help: 'Height of the open column storey the block stands on',
      when: isHabitable,
    })
  ),
  motif: inFacet(
    'form',
    choice('form', 'Spomenik', 'Motif', MOTIFS, 'fan', {
      optionLabels: {
        fan: 'Fan',
        pierced: 'Pierced Block',
        ring: 'Ring',
        split: 'Split Stone',
      },
      when: isSpomenik,
    })
  ),
  blades: rolled(
    'form',
    [4, 12],
    num('form', 'Spomenik', 'Blades', 7, 2, 24, 1, { when: isSpomenik })
  ),
  taper: rolled(
    'form',
    [0.2, 0.9],
    num('form', 'Spomenik', 'Taper', 0.6, 0, 1, 0.01, { when: isSpomenik })
  ),
  lean: rolled(
    'form',
    [0, 25],
    num('form', 'Spomenik', 'Lean', 10, 0, 40, 0.5, {
      help: 'Degrees the blades lean inward',
      when: isSpomenik,
    })
  ),
  plaza: rolled(
    'form',
    [0, 1],
    num('form', 'Spomenik', 'Plaza', 0.6, 0, 1, 0.01, {
      help: 'Stepped plaza the monument stands on',
      when: isSpomenik,
    })
  ),
};

const SURFACE = {
  look: choice('surface', null, 'Look', LOOKS, 'weathered', {
    optionLabels: { maquette: 'Plaster Maquette', weathered: 'Weathered' },
  }),
  concreteColor: inFacet(
    'weather',
    color('surface', 'Concrete', 'Color', '#8f8b83')
  ),
  concreteVariation: rolled(
    'weather',
    [0.2, 0.8],
    num('surface', 'Concrete', 'Variation', 0.5, 0, 1, 0.01, {
      help: 'Pour-to-pour tone changes',
    })
  ),
  boardForm: rolled(
    'weather',
    [0.2, 1],
    num('surface', 'Concrete', 'Board Form', 0.6, 0, 1, 0.01, {
      help: 'Strength of the timber shuttering grain',
    })
  ),
  boardWidth: num('surface', 'Concrete', 'Board Width', 0.15, 0.05, 0.4, 0.01, {
    help: 'Shuttering board width in metres',
  }),
  pourLift: num('surface', 'Concrete', 'Pour Lift', 1.5, 0.5, 4, 0.05, {
    help: 'Height of one pour in metres; each leaves a cold joint',
  }),
  tieHoles: rolled(
    'weather',
    [0, 1],
    num('surface', 'Concrete', 'Tie Holes', 0.6, 0, 1, 0.01)
  ),
  age: rolled(
    'weather',
    [0.4, 1],
    num('surface', 'Weathering', 'Age', 0.7, 0, 1, 0.01, {
      help: 'Overall grime',
    })
  ),
  streaks: rolled(
    'weather',
    [0.3, 1],
    num('surface', 'Weathering', 'Rain Streaks', 0.7, 0, 1, 0.01)
  ),
  streakLength: rolled(
    'weather',
    [8, 40],
    num('surface', 'Weathering', 'Streak Length', 20, 2, 80, 0.5, {
      help: 'How far below a top edge the streaks reach, in metres',
    })
  ),
  efflorescence: rolled(
    'weather',
    [0, 0.6],
    num('surface', 'Weathering', 'Efflorescence', 0.25, 0, 1, 0.01, {
      help: 'White salt bloom below joints',
    })
  ),
  rust: rolled(
    'weather',
    [0, 0.6],
    num('surface', 'Weathering', 'Rust Bleed', 0.25, 0, 1, 0.01, {
      help: 'Orange runs from the tie holes',
    })
  ),
  splash: rolled(
    'weather',
    [0.3, 1],
    num('surface', 'Weathering', 'Splash Band', 0.6, 0, 1, 0.01, {
      help: 'Dirt thrown up the walls by rain hitting the ground',
    })
  ),
  grimeColor: inFacet(
    'weather',
    color('surface', 'Weathering', 'Grime', '#2c2822')
  ),
  moss: rolled(
    'weather',
    [0.2, 0.9],
    num('surface', 'Moss', 'Amount', 0.5, 0, 1, 0.01)
  ),
  mossClimb: rolled(
    'weather',
    [2, 20],
    num('surface', 'Moss', 'Climb', 8, 0, 60, 0.5, {
      help: 'How far up the walls moss reaches from the ground, in metres',
    })
  ),
  mossColor: inFacet('weather', color('surface', 'Moss', 'Color', '#4b5a2a')),
  maquetteColor: color('surface', 'Maquette', 'Plaster', '#e6e2da', {
    when: { look: ['maquette'] },
  }),
  windowColor: color('surface', 'Windows', 'Void', '#07080a'),
  litColor: color('surface', 'Windows', 'Lit Color', '#ffcf8a'),
  litIntensity: num('surface', 'Windows', 'Lit Intensity', 8, 0, 60, 0.1),
};

const SITE = {
  siteSeed: rolled(
    'site',
    [0, 9999],
    forest(num('site', null, 'Seed', 3, 0, 9999, 1, { help: 'Site seed' }))
  ),
  clearing: rolled(
    'site',
    [15, 80],
    forest(
      num('site', 'Clearing', 'Clearing', 40, 0, 300, 1, {
        help: 'Gap between the walls and the treeline, in metres',
      })
    )
  ),
  encroach: rolled(
    'site',
    [0, 0.7],
    forest(
      num('site', 'Clearing', 'Encroach', 0.25, 0, 1, 0.01, {
        help: 'Trees pressing against the walls and saplings on the ledges',
      })
    )
  ),
  burial: rolled(
    'site',
    [0, 0.5],
    forest(
      num('site', 'Clearing', 'Burial', 0, 0, 1, 0.01, {
        help: 'A hillside swallowing one side, as a share of the height',
      })
    )
  ),
  burialAngle: rolled(
    'site',
    [0, 360],
    forest(
      num('site', 'Clearing', 'Burial Bearing', 200, 0, 360, 1, {
        help: 'Direction the hillside rises toward, in degrees',
      })
    )
  ),
  biome: inFacet(
    'site',
    forest(
      choice('site', 'Forest', 'Biome', BIOMES, 'conifer', {
        optionLabels: {
          bare: 'Bare',
          conifer: 'Conifer',
          deciduous: 'Deciduous',
          mixed: 'Mixed',
        },
      })
    )
  ),
  treeDensity: rolled(
    'site',
    [0.4, 1],
    forest(num('site', 'Forest', 'Density', 0.7, 0, 1, 0.01))
  ),
  treeHeight: rolled(
    'site',
    [18, 30],
    forest(
      num('site', 'Forest', 'Tree Height', 24, 6, 45, 0.5, {
        help: 'Mean tree height in metres: the yardstick for the structure',
      })
    )
  ),
  forestRadius: forest(
    num('site', 'Forest', 'Radius', 420, 80, 1200, 10, {
      help: 'How far the forest reaches, in metres',
    })
  ),
  hills: rolled(
    'site',
    [0, 1],
    forest(
      num('site', 'Ground', 'Hills', 0.5, 0, 1, 0.01, {
        help: 'Rolling ground beyond the clearing',
      })
    )
  ),
  groundColor: inFacet(
    'site',
    forest(color('site', 'Ground', 'Color', '#353628'))
  ),
  foliageColor: inFacet(
    'site',
    forest(color('site', 'Forest', 'Foliage', '#26301e'))
  ),
  barkColor: inFacet(
    'site',
    forest(color('site', 'Forest', 'Bark', '#2c2620'))
  ),
};

const ATMOSPHERE = {
  skyZenith: inFacet(
    'mood',
    forest(color('atmosphere', 'Sky', 'Zenith', '#7d858b'))
  ),
  skyHorizon: inFacet(
    'mood',
    forest(color('atmosphere', 'Sky', 'Horizon', '#b7bbb8'))
  ),
  sunGlowColor: inFacet(
    'mood',
    forest(color('atmosphere', 'Sky', 'Sun Glow', '#d9d6cc'))
  ),
  sunGlow: rolled(
    'mood',
    [0, 0.6],
    forest(num('atmosphere', 'Sky', 'Glow', 0.2, 0, 2, 0.01))
  ),
  fogColor: inFacet(
    'mood',
    forest(color('atmosphere', 'Fog', 'Color', '#a9aeab'))
  ),
  fogDensity: rolled(
    'mood',
    [0.002, 0.008],
    forest(
      num('atmosphere', 'Fog', 'Density', 0.004, 0, 0.08, 0.0005, {
        help: 'Fog per metre at the ground',
      })
    )
  ),
  fogHeight: rolled(
    'mood',
    [15, 90],
    forest(
      num('atmosphere', 'Fog', 'Height', 45, 2, 300, 1, {
        help: 'Metres over which the fog thins by e',
      })
    )
  ),
  hazeDistance: rolled(
    'mood',
    [700, 1600],
    forest(
      num('atmosphere', 'Fog', 'Haze Distance', 1100, 50, 4000, 10, {
        help: 'Distance at which the long-range haze closes in, in metres',
      })
    )
  ),
  fogNoise: rolled(
    'mood',
    [0.2, 0.8],
    forest(
      num('atmosphere', 'Fog', 'Patchiness', 0.5, 0, 1, 0.01, {
        help: 'Banks and gaps in the ground fog',
      })
    )
  ),
  fogDrift: forest(
    num('atmosphere', 'Fog', 'Drift', 1.5, 0, 10, 0.1, {
      help: 'Metres per second the fog banks drift',
    })
  ),
  exposure: forest(num('atmosphere', null, 'Exposure', 1, 0.1, 4, 0.01)),
};

const STUDIO = {
  studioBackground: maquette(color('studio', null, 'Background', '#3a3a3a')),
  studioFloor: maquette(color('studio', 'Room', 'Floor Edge', '#3a3a3a')),
  studioPool: maquette(color('studio', 'Room', 'Floor Pool', '#4a4a48')),
  studioWallLow: maquette(color('studio', 'Room', 'Wall Low', '#3a3a3a')),
  studioWallHigh: maquette(color('studio', 'Room', 'Wall High', '#1a1a1a')),
  studioGradientStart: maquette(
    num('studio', 'Room', 'Gradient Start', 0, 0, 1, 0.01)
  ),
  studioGradientEnd: maquette(
    num('studio', 'Room', 'Gradient End', 0.8, 0, 1, 0.01)
  ),
  studioFogNear: maquette(num('studio', 'Room', 'Fog Near', 14, 0, 40, 0.5)),
  studioFogFar: maquette(num('studio', 'Room', 'Fog Far', 50, 1, 80, 0.5)),
  plinthColor: maquette(color('studio', 'Plinth', 'Color', '#d8d4cc')),
  plinthHeight: maquette(num('studio', 'Plinth', 'Height', 0.9, 0.1, 3, 0.01)),
  plinthMargin: maquette(
    num('studio', 'Plinth', 'Margin', 0.18, 0, 1, 0.01, {
      help: 'Plinth top beyond the model, as a share of its footprint',
    })
  ),
  modelHeight: maquette(
    num('studio', 'Plinth', 'Model Height', 2.4, 0.5, 8, 0.05, {
      help: 'Height of the model in scene units',
    })
  ),
};

// Owned by the lighting and post rigs, which build their own Leva controls;
// declared here so a preset and a headless render carry them. Defaults are
// brutalistRender's lighting.js and post.js.
const rig = (stages, item) => ({
  facet: 'mood',
  group: null,
  rig: true,
  scene: true,
  scope: 'shared',
  section: 'post',
  stages,
  ...item,
});
const rigColor = (stages, key, value, label) => ({
  [key]: rig(stages, { default: value, help: label, label, type: 'color' }),
});
const rigNumber = (stages, key, value, label, [min, max, step], roll) => ({
  [key]: rig(stages, {
    default: value,
    help: label,
    label,
    max,
    min,
    step,
    type: 'number',
    ...(roll ? { roll: { max: roll[1], min: roll[0], step } } : {}),
  }),
});

const RIG = {
  ...rigColor(FOREST, 'lightSunColor', '#e4e2da', 'Sun colour'),
  ...rigNumber(
    FOREST,
    'lightSunIntensity',
    0.6,
    'Sun intensity',
    [0, 10, 0.01],
    [0.2, 1.6]
  ),
  ...rigNumber(
    FOREST,
    'lightSunAzimuth',
    -120,
    'Sun azimuth',
    [-360, 360, 1],
    [-180, 180]
  ),
  ...rigNumber(
    FOREST,
    'lightSunElevation',
    35,
    'Sun elevation',
    [-90, 90, 1],
    [4, 60]
  ),
  ...rigColor(FOREST, 'lightSkySkyColor', '#b9bfc2', 'Sky fill'),
  ...rigColor(FOREST, 'lightSkyGroundColor', '#3b3a30', 'Ground bounce'),
  ...rigNumber(
    FOREST,
    'lightSkyIntensity',
    1.2,
    'Sky fill intensity',
    [0, 10, 0.01],
    [0.6, 1.8]
  ),
  ...rigColor(MAQUETTE, 'lightKeyColor', '#eef1f6', 'Key colour'),
  ...rigNumber(
    MAQUETTE,
    'lightKeyIntensity',
    140,
    'Key intensity',
    [0, 600, 1]
  ),
  ...rigColor(MAQUETTE, 'lightFillSkyColor', '#c7d0dc', 'Fill sky'),
  ...rigColor(MAQUETTE, 'lightFillGroundColor', '#16181c', 'Fill ground'),
  ...rigNumber(
    MAQUETTE,
    'lightFillIntensity',
    0.5,
    'Fill intensity',
    [0, 10, 0.01]
  ),
  postGrainEnabled: rig(BOTH, {
    default: false,
    help: 'Film grain',
    label: 'Grain',
    type: 'boolean',
  }),
  postGradeEnabled: rig(BOTH, {
    default: false,
    help: 'Tint, vignette and letterbox',
    label: 'Grade',
    type: 'boolean',
  }),
};

const output = (item) => ({ scope: 'shared', section: 'output', ...item });
const still = (item) => ({ scope: 'still', section: 'output', ...item });
const video = (item) => ({ scope: 'video', section: 'video', ...item });
const render = (item) => ({ scope: 'shared', section: 'render', ...item });

const RENDER = {
  stage: render({
    choices: STAGES,
    default: 'forest',
    help: 'forest: the structure at full size among trees; maquette: a model on a plinth in the studio',
    label: 'Stage',
    type: 'enum',
  }),
  batch: output({
    default: null,
    help: 'Batch seed: names the generations (batch, batch-1…) and seeds the facet rolls. Omit for a random one',
    label: 'Batch seed',
    nullable: true,
    placeholder: 'WORD',
    text: true,
    type: 'seed',
  }),
  out: output({
    cliOnly: true,
    default: 'output/brutalist',
    help: 'Output directory (stills) or file (video)',
    placeholder: 'PATH',
    type: 'string',
  }),
  width: output({
    default: 1080,
    help: 'Width',
    label: 'Width',
    max: 8192,
    min: 64,
    placeholder: 'PX',
    step: 2,
    type: 'number',
  }),
  height: output({
    default: 1350,
    help: 'Height',
    label: 'Height',
    max: 8192,
    min: 64,
    placeholder: 'PX',
    step: 2,
    type: 'number',
  }),
  pixelRatio: output({
    choices: [1, 2, 3, 4],
    default: 2,
    help: 'Renders at width×ratio by height×ratio',
    label: 'Pixel ratio',
    max: 4,
    min: 1,
    type: 'number',
  }),
  count: output({
    default: 1,
    help: 'How many structures to roll',
    label: 'Count',
    max: 200,
    min: 1,
    placeholder: 'N',
    step: 1,
    type: 'number',
  }),
  png: still({
    default: false,
    help: 'Write PNG files',
    label: 'PNG',
    type: 'boolean',
  }),
  webp: still({
    default: true,
    help: 'Write lossless WebP files',
    label: 'WebP',
    type: 'boolean',
  }),
  svg: still({
    default: false,
    help: 'Write a plottable SVG per view: every mass and opening edge, hidden lines removed',
    label: 'SVG',
    type: 'boolean',
  }),
  views: still({
    default: 'approach',
    help: `Comma-separated views: ${VIEWS.join(', ')}`,
    label: 'Views',
    placeholder: 'LIST',
    type: 'string',
  }),
  svgOcclusion: {
    default: true,
    help: 'Drop line work hidden behind nearer masses (uses a depth pass)',
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
  fov: render({
    default: 28,
    help: 'Vertical field of view in degrees; a long lens sells the scale',
    label: 'Field of view',
    max: 90,
    min: 8,
    step: 1,
    type: 'number',
  }),
  margin: render({
    default: 0.08,
    help: 'Space around the structure, as a share of the frame (framed views)',
    label: 'Fit margin',
    max: 0.5,
    min: 0,
    step: 0.01,
    type: 'number',
  }),
  samples: render({
    choices: [0, 4],
    default: 4,
    help: 'MSAA samples',
    label: 'MSAA',
    max: 4,
    min: 0,
    type: 'number',
  }),
  shadows: render({
    default: true,
    help: 'Key light shadow map',
    label: 'Shadows',
    type: 'boolean',
  }),
  keep: {
    default: '',
    help: 'Comma-separated facets to hold while the rest roll: form, weather, site, mood',
    label: 'Hold facets',
    placeholder: 'LIST',
    scope: 'shared',
    section: 'roll',
    type: 'string',
  },
  base: {
    cliOnly: true,
    default: null,
    help: 'A structure config (or props.json path) the roll starts from',
    nullable: true,
    placeholder: 'JSON',
    scope: 'shared',
    section: 'roll',
    type: 'json',
  },
  mode: video({
    choices: VIDEO_MODES,
    default: 'drift',
    help: 'drift: a slow dolly up the old road toward it; turntable: orbit it (best from a framed view such as hero)',
    label: 'Mode',
    type: 'enum',
  }),
  view: video({
    choices: VIEWS,
    default: 'approach',
    help: 'Camera view the clip starts from',
    label: 'View',
    type: 'enum',
  }),
  fps: video({
    choices: [24, 30, 60],
    default: 30,
    help: 'Frames per second',
    label: 'FPS',
    max: 60,
    min: 24,
    type: 'number',
  }),
  hold: video({
    default: 8,
    help: 'Seconds per structure',
    label: 'Hold',
    max: 300,
    min: 0.5,
    placeholder: 'S',
    step: 0.5,
    type: 'number',
  }),
  turns: video({
    default: 0.25,
    help: 'Turntable revolutions per structure',
    label: 'Turns',
    max: 10,
    min: 0.05,
    placeholder: 'N',
    step: 0.05,
    type: 'number',
  }),
};

export const RENDER_OPTIONS = {
  ...FORM,
  ...SURFACE,
  ...SITE,
  ...ATMOSPHERE,
  ...STUDIO,
  ...RIG,
  ...RENDER,
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': { count: 1, height: 1920, out: 'output/brutalist.mp4' },
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
    atmosphere: 'atmosphere',
    form: 'form',
    output: 'output',
    post: 'light & post',
    render: 'render',
    roll: 'rolling',
    site: 'site',
    studio: 'studio',
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
    .filter(([, item]) => test(item))
    .map(([key]) => key);

export const SCENE_KEYS = keysWhere((item) => item.scene);
export const levaKeysFor = (stage) =>
  keysWhere((item) => item.scene && !item.rig && item.stages.includes(stage));

// The keys that change the structure; every other form key is a surface.
export const FORM_KEYS = keysInFacet('form').concat([
  'humanDetail',
  'litWindows',
]);

// The keys that change the site (terrain and trees) on top of the form.
export const SITE_KEYS = [
  'siteSeed',
  'clearing',
  'encroach',
  'burial',
  'burialAngle',
  'biome',
  'treeDensity',
  'treeHeight',
  'forestRadius',
  'hills',
];

export const sceneDefaults = () =>
  Object.fromEntries(
    SCENE_KEYS.map((key) => [key, RENDER_OPTIONS[key].default])
  );

// A stage's preset base: only the keys that stage's Leva shows (rig keys
// included), so a preset never carries a key its scene cannot set.
export const stageDefaults = (stage) =>
  Object.fromEntries(
    SCENE_KEYS.filter((key) => RENDER_OPTIONS[key].stages.includes(stage)).map(
      (key) => [key, RENDER_OPTIONS[key].default]
    )
  );

export function configFrom(source) {
  const flat = source?.preset ?? source ?? {};
  return Object.fromEntries(
    SCENE_KEYS.filter((key) => flat[key] != null).map((key) => [key, flat[key]])
  );
}

export const optionsFromConfig = (config = {}) => configFrom(config);

// A generation as a scene snapshot: only that stage's keys, and only those
// that differ from its defaults.
export function snapshotForStage(config, stage) {
  const defaults = stageDefaults(stage);
  return Object.fromEntries(
    Object.entries(config).filter(
      ([name, value]) =>
        name in defaults && value != null && value !== defaults[name]
    )
  );
}

export function presetFromConfig(config = {}) {
  const defaults = sceneDefaults();
  return Object.fromEntries(
    Object.entries(config).filter(
      ([name, value]) =>
        name in defaults && value != null && value !== defaults[name]
    )
  );
}
