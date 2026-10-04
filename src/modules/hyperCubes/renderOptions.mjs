// Every knob HyperCubes' renderers accept, declared once
// (docs/hyper-cubes-pipeline.md). The scene's Leva folders are generated
// from it: `section` is the top folder and `group` the folder path inside it.
// `when` hides a control unless every named key holds one of the listed
// values. Dependency-free `.mjs` so plain Node and Vite's config loader can
// import it.
import createOptionSchema from '../optionSchema/index.mjs';

export const STRUCTURES = ['rect', 'octree'];
export const CELL_SHAPES = ['cube', 'sphere', 'mixed'];
export const FRAME_MODES = ['all', 'solid', 'none'];
export const STUDIOS = ['crimson', 'mono', 'none'];
export const ROLES = ['emissive', 'accent', 'dark', 'light', 'glass'];
export const VIEWS = ['hero', 'front', 'right', 'back', 'left', 'top'];
export const VIDEO_MODES = ['grow', 'morph', 'turntable'];
export const PROJECTIONS = ['orthographic', 'perspective'];
export const MAX_CELLS = 60000;

// Degrees round the domain from +x toward +z. `hero` is both references'
// camera: (5, 3, 5) and (10, 6, 10) share its bearing and elevation.
export const VIEW_AZIMUTHS = {
  back: 270,
  front: 90,
  hero: 45,
  left: 180,
  right: 0,
  top: 45,
};
export const VIEW_ELEVATIONS = { top: 89.9 };
export const VIEW_ELEVATION = 23;

function spec(type, section, group, label, value, extra = {}) {
  return {
    default: value,
    group,
    help: label,
    label,
    scene: true,
    scope: 'shared',
    section,
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
const flag = (section, group, label, value, extra = {}) =>
  spec('boolean', section, group, label, value, extra);
const color = (section, group, label, value, extra = {}) =>
  spec('color', section, group, label, value, extra);

const rolled = (facet, [min, max], item) => ({
  ...item,
  facet,
  roll: { max, min, step: item.step },
});
const inFacet = (facet, item) => ({ ...item, facet });
const sceneOnly = (item) => ({ ...item, sceneOnly: true });

const isRect = { structure: ['rect'] };
const isOctree = { structure: ['octree'] };

const STRUCTURE = {
  structure: inFacet(
    'structure',
    choice('structure', null, 'Partition', STRUCTURES, 'rect', {
      optionLabels: { octree: 'Octree', rect: 'Rect Subdivision' },
    })
  ),
  rectSeed: rolled(
    'structure',
    [0, 1],
    num('structure', null, 'Seed', 0.18, 0, 1, 0.0001, {
      help: 'Rect seed: offsets every cut hash',
      when: isRect,
    })
  ),
  rectMinSize: rolled(
    'structure',
    [0.06, 0.2],
    num('structure', null, 'Min Size', 0.1, 0.03, 0.5, 0.005, {
      help: 'A box stops splitting once a cut would leave a side this thin',
      when: isRect,
    })
  ),
  rectMinIters: rolled(
    'structure',
    [0, 2],
    num('structure', null, 'Min Depth', 1, 0, 11, 1, {
      help: 'Splits before a box may stop (the shader stops once i - 1 > this)',
      when: isRect,
    })
  ),
  rectMaxIters: num('structure', null, 'Max Depth', 12, 2, 12, 1, {
    help: 'Split loop iterations',
    when: isRect,
  }),
  rectBreakChance: rolled(
    'structure',
    [0, 0.25],
    num('structure', null, 'Break Chance', 0, 0, 1, 0.01, {
      help: 'Chance a box stops splitting early',
      when: isRect,
    })
  ),
  octreeSeed: rolled(
    'structure',
    [0, 999],
    num('structure', null, 'Seed', 66, 0, 999, 1, {
      help: 'Octree seed: offsets every cell hash',
      when: isOctree,
    })
  ),
  octreeLevels: num('structure', null, 'Levels', 5, 1, 6, 1, {
    help: 'Octree depth below the root split',
    when: isOctree,
  }),
  octreeHoleChance: rolled(
    'structure',
    [0.05, 0.35],
    num('structure', null, 'Hole Chance', 0.2, 0, 0.9, 0.01, {
      when: isOctree,
    })
  ),
  octreeLeafChance: rolled(
    'structure',
    [0.35, 0.65],
    num('structure', null, 'Leaf Chance', 0.5, 0.3, 1, 0.01, {
      help: 'Chance a cell stops subdividing',
      when: isOctree,
    })
  ),
  domainX: inFacet(
    'structure',
    num('structure', 'Domain', 'Half Width', 1, 0.25, 3, 0.01)
  ),
  domainY: inFacet(
    'structure',
    num('structure', 'Domain', 'Half Height', 1, 0.25, 3, 0.01)
  ),
  domainZ: inFacet(
    'structure',
    num('structure', 'Domain', 'Half Depth', 1, 0.25, 3, 0.01)
  ),
  density: rolled(
    'structure',
    [0.45, 1],
    num('structure', 'Fill', 'Density', 0.8, 0, 1, 0.01, {
      help: 'Share of cells that hold a solid',
    })
  ),
  cellShape: inFacet(
    'structure',
    choice('structure', 'Fill', 'Shape', CELL_SHAPES, 'cube', {
      help: 'Solid shape; mixed rolls cube or sphere per cell',
      optionLabels: { cube: 'Cube', mixed: 'Cube + Sphere', sphere: 'Sphere' },
    })
  ),
  sphereShare: rolled(
    'structure',
    [0.25, 0.75],
    num('structure', 'Fill', 'Sphere Share', 0.5, 0, 1, 0.01, {
      help: 'Share of cells that are spheres when the shape is mixed',
      when: { cellShape: ['mixed'] },
    })
  ),
  gap: rolled(
    'structure',
    [0.006, 0.05],
    num('structure', 'Fill', 'Margin', 0.03, 0, 0.2, 0.001, {
      help: 'Inset of a solid from its cell',
    })
  ),
};

const weight = (label, value) =>
  inFacet('color', num('cells', 'Roles', label, value, 0, 1, 0.01));

const CELLS = {
  roleEmissive: weight('Emissive', 0.1),
  roleAccent: weight('Accent', 0.1),
  roleDark: weight('Dark', 0.8),
  roleLight: weight('Light', 0),
  roleGlass: weight('Glass', 0),
  darkColor: inFacet('color', color('cells', 'Dark', 'Color', '#595d65')),
  darkRoughness: num('cells', 'Dark', 'Roughness', 0.2, 0, 1, 0.01),
  surfaceNoise: rolled(
    'color',
    [0, 1.5],
    num('cells', 'Dark', 'Noise', 1, 0, 3, 0.01, {
      help: 'Cyclic-noise variation of the dark cells’ albedo and roughness',
    })
  ),
  lightColor: inFacet('color', color('cells', 'Light', 'Color', '#e7e7e7')),
  lightRoughness: num('cells', 'Light', 'Roughness', 0.1, 0, 1, 0.01),
  accentColor: inFacet('color', color('cells', 'Accent', 'Color', '#e75959')),
  accentRoughness: num('cells', 'Accent', 'Roughness', 0.05, 0, 1, 0.01),
  emissiveColor: inFacet(
    'color',
    color('cells', 'Emissive', 'Color', '#ff8f8f')
  ),
  emissiveIntensity: rolled(
    'color',
    [4, 14],
    num('cells', 'Emissive', 'Intensity', 11, 0, 40, 0.1)
  ),
  glassColor: inFacet('color', color('cells', 'Glass', 'Tint', '#ffffff')),
  glassIor: num('cells', 'Glass', 'IOR', 1.4, 1, 2.4, 0.01),
  glassRoughness: num('cells', 'Glass', 'Max Roughness', 0.7, 0, 1, 0.01, {
    help: 'Each glass cell is frosted up to this',
  }),
  glassDispersion: num('cells', 'Glass', 'Dispersion', 5, 0, 20, 0.1),
  coreColor: inFacet('color', color('cells', 'Glass', 'Core Color', '#ffffff')),
  coreIntensity: num('cells', 'Glass', 'Core Intensity', 1, 0, 20, 0.1),
  coreScale: num('cells', 'Glass', 'Core Scale', 0.5, 0, 0.95, 0.01),
  paletteName: inFacet(
    'color',
    spec('string', 'cells', 'Palette', 'Palette', 'None', {
      help: 'gradients.json palette the dark, light and accent cells take a stop from; None keeps the role colours',
      placeholder: 'NAME',
    })
  ),
  paletteMix: rolled(
    'color',
    [0.4, 1],
    num('cells', 'Palette', 'Mix', 1, 0, 1, 0.01)
  ),
  paletteExact: inFacet(
    'color',
    flag('cells', 'Palette', 'Exact Stops', true, {
      help: 'Each cell takes a whole palette stop; off blends between stops',
    })
  ),
};

const FRAMES = {
  frameMode: inFacet(
    'color',
    choice('frames', null, 'Frames', FRAME_MODES, 'all', {
      optionLabels: { all: 'Every Cell', none: 'None', solid: 'Solid Cells' },
    })
  ),
  frameWidth: rolled(
    'color',
    [0.0015, 0.006],
    num('frames', null, 'Width', 0.002, 0, 0.05, 0.0005)
  ),
  frameColor: inFacet('color', color('frames', null, 'Color', '#dacb59')),
  frameRoughness: num('frames', null, 'Roughness', 0.1, 0, 1, 0.01),
  frameMetalness: num('frames', null, 'Metalness', 1, 0, 1, 0.01),
};

const STAGE = {
  studio: inFacet(
    'atmosphere',
    choice('stage', null, 'Studio', STUDIOS, 'crimson', {
      help: 'The emitter panels the environment is lit by',
    })
  ),
  envIntensity: rolled(
    'atmosphere',
    [0.6, 1.4],
    num('stage', null, 'Environment', 1, 0, 5, 0.01)
  ),
  skyZenith: inFacet('atmosphere', color('stage', 'Sky', 'Zenith', '#4a5059')),
  skyNadir: inFacet('atmosphere', color('stage', 'Sky', 'Nadir', '#eb3039')),
  background: inFacet(
    'atmosphere',
    color('stage', null, 'Background', '#cf3843')
  ),
  floorEnabled: flag('stage', 'Floor', 'Enabled', true),
  floorColor: inFacet(
    'atmosphere',
    color('stage', 'Floor', 'Color', '#bc3939')
  ),
  floorRoughness: rolled(
    'atmosphere',
    [0.1, 0.5],
    num('stage', 'Floor', 'Roughness', 0.15, 0, 1, 0.01)
  ),
  floorOffset: num('stage', 'Floor', 'Drop', 0.01, 0, 2, 0.01, {
    help: 'Gap between the domain and the floor',
  }),
};

const MOTION = {
  motionMode: sceneOnly(
    choice('motion', null, 'Mode', ['off', 'grow', 'reseed', 'manual'], 'off')
  ),
  growProgress: sceneOnly(
    num('motion', null, 'Progress', 1, 0, 1, 0.001, {
      when: { motionMode: ['manual'] },
    })
  ),
  growLevelSeconds: num('motion', null, 'Seconds / Level', 0.8, 0.05, 5, 0.01),
  morphSeconds: num('motion', null, 'Morph Seconds', 2.5, 0, 20, 0.1, {
    help: 'How long a structure change takes to morph in',
  }),
  holdSeconds: num('motion', null, 'Hold Seconds', 4, 0, 30, 0.1),
};

// Owned by the lighting and post rigs, which build their own Leva controls;
// declared here so a preset and a headless render carry them. Defaults are
// hyperCubesRender's lighting.js and post.js.
const rig = (item) => ({
  facet: 'atmosphere',
  group: null,
  rig: true,
  scene: true,
  scope: 'shared',
  section: 'post',
  ...item,
});
const RIG = {
  lightKeyColor: rig({
    default: '#dfe7ff',
    help: 'Key light colour',
    label: 'Key',
    type: 'color',
  }),
  lightKeyIntensity: rig({
    default: 1.5,
    help: 'Key light intensity; it casts the shadows',
    label: 'Key intensity',
    max: 10,
    min: 0,
    roll: { max: 2.5, min: 0.8, step: 0.01 },
    step: 0.01,
    type: 'number',
  }),
  lightKeyAzimuth: rig({
    default: -135,
    help: 'Key light bearing in degrees',
    label: 'Key azimuth',
    max: 360,
    min: -360,
    roll: { max: 180, min: -180, step: 1 },
    step: 1,
    type: 'number',
  }),
  lightKeyElevation: rig({
    default: 40,
    help: 'Key light elevation in degrees',
    label: 'Key elevation',
    max: 90,
    min: -90,
    roll: { max: 80, min: 25, step: 1 },
    step: 1,
    type: 'number',
  }),
  postBloomEnabled: rig({
    default: true,
    help: 'Mip bloom',
    label: 'Bloom',
    type: 'boolean',
  }),
  postBloomThreshold: rig({
    default: 1,
    help: 'Luminance the bloom starts above',
    label: 'Bloom threshold',
    max: 4,
    min: 0,
    step: 0.05,
    type: 'number',
  }),
  postBloomStrength: rig({
    default: 1,
    help: 'Bloom strength',
    label: 'Bloom strength',
    max: 4,
    min: 0,
    roll: { max: 1.4, min: 0.5, step: 0.05 },
    step: 0.05,
    type: 'number',
  }),
  postGradeEnabled: rig({
    default: true,
    help: 'Tint, vignette and letterbox',
    label: 'Grade',
    type: 'boolean',
  }),
  postGradeTint: rig({
    default: '#ffffff',
    help: 'Colour the frame is multiplied by',
    label: 'Grade tint',
    type: 'color',
  }),
  postGradeVignette: rig({
    default: 0.2,
    help: 'Vignette strength',
    label: 'Vignette',
    max: 1,
    min: 0,
    step: 0.01,
    type: 'number',
  }),
  postGradeLetterbox: rig({
    default: 0,
    help: 'Blacks out beyond this half-width in frame heights; 0 is off',
    label: 'Letterbox',
    max: 4,
    min: 0,
    step: 0.01,
    type: 'number',
  }),
};

const output = (item) => ({ scope: 'shared', section: 'output', ...item });
const still = (item) => ({ scope: 'still', section: 'output', ...item });
const video = (item) => ({ scope: 'video', section: 'video', ...item });

const RENDER = {
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
    default: 'output/hyper-cubes',
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
    help: 'Write a plottable SVG per view: solid and frame edges, hidden lines removed, one pen per colour',
    label: 'SVG',
    type: 'boolean',
  }),
  views: still({
    default: 'hero',
    help: `Comma-separated views: ${VIEWS.join(', ')}`,
    label: 'Views',
    placeholder: 'LIST',
    type: 'string',
  }),
  svgOcclusion: {
    default: true,
    help: 'Drop line work hidden behind nearer cells (uses a depth pass)',
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
  projection: {
    choices: PROJECTIONS,
    default: 'orthographic',
    help: 'Camera projection; both references are orthographic',
    label: 'Projection',
    scope: 'shared',
    section: 'render',
    type: 'enum',
  },
  fov: {
    default: 35,
    help: 'Vertical field of view in degrees (perspective only)',
    label: 'Field of view',
    max: 90,
    min: 10,
    scope: 'shared',
    section: 'render',
    step: 1,
    type: 'number',
  },
  margin: {
    default: 0.1,
    help: 'Space around the domain, as a share of the frame',
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
    help: 'Key light shadow map',
    label: 'Shadows',
    scope: 'shared',
    section: 'render',
    type: 'boolean',
  },
  keep: {
    default: '',
    help: 'Comma-separated facets to hold while the rest roll: structure, color, atmosphere',
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
  palettes: {
    array: true,
    cliOnly: true,
    default: null,
    help: 'Palette names the colour roll picks from (the CLI fills this from gradients.json)',
    nullable: true,
    placeholder: 'JSON',
    scope: 'shared',
    section: 'roll',
    type: 'json',
  },
  mode: video({
    choices: VIDEO_MODES,
    default: 'morph',
    help: 'grow: every cut slides in from the walls, level by level, then holds; morph: each structure holds, then morphs into the next and back to the first; turntable: orbit a settled structure',
    label: 'Mode',
    type: 'enum',
  }),
  view: video({
    choices: VIEWS,
    default: 'hero',
    help: 'Camera view for the clip',
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
    default: 3,
    help: 'Seconds each structure holds (morph, grow) or orbits for (turntable)',
    label: 'Hold',
    max: 300,
    min: 0,
    placeholder: 'S',
    step: 0.5,
    type: 'number',
  }),
  turns: video({
    default: 1,
    help: 'Turntable revolutions per structure',
    label: 'Turns',
    max: 10,
    min: 0.25,
    placeholder: 'N',
    step: 0.25,
    type: 'number',
  }),
  orbit: video({
    default: 0,
    help: 'Degrees the camera drifts round a grow or morph clip',
    label: 'Orbit drift',
    max: 360,
    min: -360,
    placeholder: 'DEG',
    step: 5,
    type: 'number',
  }),
};

export const RENDER_OPTIONS = {
  ...STRUCTURE,
  ...CELLS,
  ...FRAMES,
  ...STAGE,
  ...MOTION,
  ...RIG,
  ...RENDER,
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': { count: 3, height: 1920, out: 'output/hyper-cubes.mp4' },
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
    cells: 'cells',
    frames: 'frames',
    motion: 'motion',
    output: 'output',
    post: 'light & post',
    render: 'render',
    roll: 'rolling',
    stage: 'stage',
    structure: 'structure',
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
export const LEVA_KEYS = keysWhere((item) => item.scene && !item.rig);

// The keys that change the tree; every other key only re-dresses its cells.
export const TREE_KEYS = [
  'structure',
  'rectSeed',
  'rectMinSize',
  'rectMinIters',
  'rectMaxIters',
  'rectBreakChance',
  'octreeSeed',
  'octreeLevels',
  'octreeHoleChance',
  'octreeLeafChance',
];

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
