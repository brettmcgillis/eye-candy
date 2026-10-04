// Every knob the Trucheterie3D renderers accept, declared once
// (docs/trucheterie3d-pipeline.md). The field and palette specs are the 2D
// blob field's own, re-foldered; the scene's Leva is generated from this:
// `section` is the top folder, `group` the folder path inside it, `when`
// hides a control unless every named key holds one of the listed values.
// Dependency-free `.mjs` so plain Node and Vite's config loader import it.
import createOptionSchema from '../optionSchema/index.mjs';
import {
  RENDER_OPTIONS as BLOB,
  LANE_MODES,
  MEATBALLS,
  PALETTE_NONE,
} from '../trucheterieBlob/renderOptions.mjs';

export { LANE_MODES, MEATBALLS, PALETTE_NONE };

export const STRANDS = ['lanes', 'wires', 'both'];
export const PROFILES = ['round', 'half', 'ribbon'];
export const JUNCTIONS = ['cap', 'weave'];
export const HEIGHT_MODES = ['flat', 'terrace'];
export const MOTION_MODES = ['off', 'grow', 'flow'];
export const VIEWS = ['hero', 'top', 'low', 'side', 'under'];
export const VIDEO_MODES = ['growth', 'flow', 'turntable'];
export const PROJECTIONS = ['perspective', 'orthographic'];
// Weave needs slack round the crossings at grid corners: at full width the
// lanes touch edge to edge and three-way contacts there have no solution.
export const WEAVE_MAX_THICKNESS = 0.9;

export const VIEW_AZIMUTHS = { hero: 60, low: 70, side: 0, top: 90, under: 60 };
export const VIEW_ELEVATIONS = {
  hero: 42,
  low: 16,
  side: 24,
  top: 89.5,
  under: -38,
};

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
const from = (key, section, group, extra = {}) => ({
  ...BLOB[key],
  group,
  section,
  ...extra,
});

const FIELD = {
  blobSeed: from('blobSeed', 'field', null, { facet: undefined }),
  blobGridSize: from('blobGridSize', 'field', null, {
    max: 40,
    roll: { max: 30, min: 14, step: 1 },
  }),
  blobPathsPerUnit: from('blobPathsPerUnit', 'field', null, {
    help: 'Lanes per micro-cell: more is finer tubes',
    max: 12,
    roll: { max: 8, min: 3, step: 1 },
  }),
  blobCanvasSize: from('blobCanvasSize', 'field', null, {
    help: 'World width of the whole grid',
  }),
  blobSizeFunction: from('blobSizeFunction', 'field', 'Cells'),
  blobDistribution: from('blobDistribution', 'field', 'Cells'),
  blobConnectivity: from('blobConnectivity', 'field', 'Cells'),
  blobOneFill: from('blobOneFill', 'field', 'Cells'),
  blobHoles: from('blobHoles', 'field', 'Cells'),
  blobMeatballs: from('blobMeatballs', 'field', 'Cells'),
  planeRotation: from('planeRotation', 'field', null, {
    help: 'Turns the field about the vertical',
  }),
};

const PALETTE = {
  blobPalette: from('blobPalette', 'palette', null),
  blobLaneMode: from('blobLaneMode', 'palette', null),
  blobPaletteExact: from('blobPaletteExact', 'palette', null),
  blobPaletteShuffle: from('blobPaletteShuffle', 'palette', null),
  blobMonochrome: from('blobMonochrome', 'palette', 'Monochrome'),
  blobMonoColor: from('blobMonoColor', 'palette', 'Monochrome'),
  bgColor: from('bgColor', 'palette', null, {
    default: '#e8e2d4',
    help: 'Lane colour when no palette is selected',
    label: 'Lane Color',
  }),
  strokeColor: from('strokeColor', 'palette', null, {
    default: '#1a1a1a',
    help: 'Wire colour',
    label: 'Wire Color',
  }),
};

const FORM = {
  strands: inFacet(
    'form',
    choice('form', null, 'Strands', STRANDS, 'lanes', {
      help: 'lanes: every lane a tube; wires: every pen stroke a wire; both: tubes with wires in the seams',
      optionLabels: { both: 'Lanes + Wires', lanes: 'Lanes', wires: 'Wires' },
    })
  ),
  junction: inFacet(
    'form',
    choice('form', null, 'Junctions', JUNCTIONS, 'cap', {
      help: `cap: lanes stop against the blob they meet, as in 2D; weave: in four-way cells the second family passes under the first (lane thickness is held to ${WEAVE_MAX_THICKNESS})`,
      optionLabels: { cap: 'Cap', weave: 'Weave' },
    })
  ),
  tubeProfile: inFacet(
    'form',
    choice('form', 'Profile', 'Profile', PROFILES, 'round', {
      help: 'round: a full tube; half: half-round on a flat back; ribbon: a rounded flat band',
      optionLabels: { half: 'Half Round', ribbon: 'Ribbon', round: 'Round' },
    })
  ),
  tubeThickness: rolled(
    'form',
    [0.6, 1],
    num('form', 'Profile', 'Lane Thickness', 0.9, 0.1, 1, 0.01, {
      help: 'Lane tube width as a share of the widest that cannot touch its neighbours',
    })
  ),
  wireThickness: rolled(
    'form',
    [0.1, 0.3],
    num('form', 'Profile', 'Wire Thickness', 0.2, 0.04, 0.5, 0.01, {
      help: 'Wire radius as a share of half a lane width',
    })
  ),
  ribbonHeight: num('form', 'Profile', 'Ribbon Height', 0.5, 0.15, 1, 0.01, {
    help: 'Ribbon thickness against its width; never taller than wide, so crossings keep their clearance',
    when: { tubeProfile: ['ribbon'] },
  }),
  tubeSegments: num('form', 'Profile', 'Segments', 12, 4, 32, 1, {
    help: 'Vertices round each tube',
  }),
  heightMode: inFacet(
    'form',
    choice('form', 'Height', 'Height', HEIGHT_MODES, 'flat', {
      help: 'flat: one plane; terrace: each ring one step above the ring outside it',
      optionLabels: { flat: 'Flat', terrace: 'Terrace' },
    })
  ),
  heightScale: rolled(
    'form',
    [0.2, 0.6],
    num('form', 'Height', 'Height Scale', 0.4, 0, 2, 0.01, {
      help: 'Lane widths each ring steps up from the ring outside it',
      when: { heightMode: ['terrace'] },
    })
  ),
  maxSlope: num('form', 'Height', 'Max Slope', 0.6, 0.1, 3, 0.01, {
    help: 'Steepest rise over run a strand takes between rings; the low side is lifted to meet it',
    when: { heightMode: ['terrace'] },
  }),
  rampLength: num('form', 'Height', 'Ramp', 2, 0.25, 8, 0.05, {
    help: 'Lane widths over which heights and weave dips ease',
  }),
};

const STAGE = {
  sceneBgColor: inFacet(
    'atmosphere',
    color('stage', null, 'Background', '#ece7dc')
  ),
  floorEnabled: flag('stage', 'Floor', 'Floor', true, {
    help: 'A shadow-catching floor under the piece',
  }),
  floorColor: inFacet(
    'atmosphere',
    color('stage', 'Floor', 'Floor Color', '#ece7dc')
  ),
  floorGap: num('stage', 'Floor', 'Floor Gap', 0.15, 0, 2, 0.01, {
    help: 'Space between the lowest tube and the floor, in world units',
  }),
  roughness: rolled(
    'atmosphere',
    [0.2, 0.7],
    num('stage', 'Material', 'Roughness', 0.42, 0, 1, 0.01)
  ),
  metalness: num('stage', 'Material', 'Metalness', 0, 0, 1, 0.01),
  clearcoat: rolled(
    'atmosphere',
    [0, 0.8],
    num('stage', 'Material', 'Clearcoat', 0.3, 0, 1, 0.01)
  ),
  envIntensity: num('stage', 'Material', 'Environment', 0.8, 0, 3, 0.01, {
    help: 'Studio reflection strength',
  }),
};

const MOTION = {
  motionMode: sceneOnly(
    choice('motion', null, 'Mode', MOTION_MODES, 'off', {
      help: 'grow: tubes extrude along their channels, hold, and loop; flow: the palette drifts along the channels',
    })
  ),
  growSeconds: num('motion', null, 'Grow Seconds', 6, 0.5, 60, 0.1, {
    help: 'How long the growth front takes to finish',
  }),
  holdSeconds: num('motion', null, 'Hold Seconds', 3, 0, 60, 0.1),
  paletteDrift: num('motion', null, 'Palette Drift', 1, -20, 20, 0.05, {
    help: 'Palette stops each channel moves through per second',
  }),
};

// Owned by the lighting rig, which builds its own Leva controls; declared
// here so a preset and a headless render carry them. Defaults are
// trucheterie3dRender's lighting.js.
const rig = (item) => ({
  facet: 'atmosphere',
  group: null,
  rig: true,
  scene: true,
  scope: 'shared',
  section: 'light',
  ...item,
});
const RIG = {
  lightKeyColor: rig({
    default: '#fff4e6',
    help: 'Key light colour',
    label: 'Key',
    type: 'color',
  }),
  lightKeyIntensity: rig({
    default: 2.2,
    help: 'Key light intensity; it casts the shadows',
    label: 'Key intensity',
    max: 10,
    min: 0,
    step: 0.01,
    type: 'number',
  }),
  lightKeyAzimuth: rig({
    default: -40,
    help: 'Key light bearing in degrees',
    label: 'Key azimuth',
    max: 360,
    min: -360,
    roll: { max: 180, min: -180, step: 1 },
    step: 1,
    type: 'number',
  }),
  lightKeyElevation: rig({
    default: 55,
    help: 'Key light elevation in degrees',
    label: 'Key elevation',
    max: 90,
    min: -90,
    roll: { max: 70, min: 30, step: 1 },
    step: 1,
    type: 'number',
  }),
  lightFillIntensity: rig({
    default: 0.6,
    help: 'Sky / ground fill intensity',
    label: 'Fill intensity',
    max: 4,
    min: 0,
    step: 0.01,
    type: 'number',
  }),
};

const output = (item) => ({ scope: 'shared', section: 'output', ...item });
const still = (item) => ({ scope: 'still', section: 'output', ...item });
const video = (item) => ({ scope: 'video', section: 'video', ...item });
const render = (item) => ({ scope: 'shared', section: 'render', ...item });

const RENDER = {
  out: output({
    cliOnly: true,
    default: 'output/trucheterie3d',
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
    help: 'How many fields to roll; a batch uses seed, seed-1, seed-2…',
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
  views: still({
    default: 'hero',
    help: `Comma-separated views: ${VIEWS.join(', ')}`,
    label: 'Views',
    placeholder: 'LIST',
    type: 'string',
  }),
  projection: render({
    choices: PROJECTIONS,
    default: 'perspective',
    help: 'Camera projection',
    label: 'Projection',
    type: 'enum',
  }),
  fov: render({
    default: 30,
    help: 'Vertical field of view in degrees (perspective only)',
    label: 'Field of view',
    max: 90,
    min: 10,
    step: 1,
    type: 'number',
  }),
  margin: render({
    default: 0.06,
    help: 'Space around the piece, as a share of the frame',
    label: 'Fit margin',
    max: 0.5,
    min: 0,
    step: 0.01,
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
    help: 'Comma-separated facets to hold while the rest roll: structure, palette, form, atmosphere',
    label: 'Hold facets',
    placeholder: 'LIST',
    scope: 'shared',
    section: 'roll',
    type: 'string',
  },
  base: {
    cliOnly: true,
    default: null,
    help: 'A field config (or props.json path) the roll starts from',
    nullable: true,
    placeholder: 'JSON',
    scope: 'shared',
    section: 'roll',
    type: 'json',
  },
  mode: video({
    choices: VIDEO_MODES,
    default: 'growth',
    help: 'growth: tubes extrude along their channels from the centre, then hold; flow: the grown field with its palette drifting; turntable: orbit a still field',
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
    help: 'Seconds each field holds (growth, flow) or orbits for (turntable)',
    label: 'Hold',
    max: 300,
    min: 0,
    placeholder: 'S',
    step: 0.5,
    type: 'number',
  }),
  turns: video({
    default: 1,
    help: 'Turntable revolutions per field',
    label: 'Turns',
    max: 10,
    min: 0.25,
    placeholder: 'N',
    step: 0.25,
    type: 'number',
  }),
  orbit: video({
    default: 20,
    help: 'Degrees the camera drifts round a growth or flow clip',
    label: 'Orbit drift',
    max: 360,
    min: -360,
    placeholder: 'DEG',
    step: 5,
    type: 'number',
  }),
};

export const RENDER_OPTIONS = {
  ...FIELD,
  ...PALETTE,
  ...FORM,
  ...STAGE,
  ...MOTION,
  ...RIG,
  ...RENDER,
};

export const SURFACE_DEFAULTS = {
  'cli-still': { blobSeed: null },
  'cli-video': { count: 2, height: 1920, out: 'output/trucheterie3d.mp4' },
  workbench: { blobSeed: null, count: 6 },
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
    field: 'field',
    form: 'form',
    light: 'light',
    motion: 'motion',
    output: 'output',
    palette: 'palette',
    render: 'render',
    roll: 'rolling',
    stage: 'stage',
    video: 'video',
  },
  surfaceDefaults: SURFACE_DEFAULTS,
  validate(kind, options, fail) {
    if (kind === 'still' && !options.png && !options.webp) {
      throw fail('Select at least one output format: PNG or WebP.');
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

// Keys that change the tubes' geometry; every other key only re-dresses them.
export const TUBE_KEYS = [
  'blobSeed',
  'blobGridSize',
  'blobPathsPerUnit',
  'blobSizeFunction',
  'blobDistribution',
  'blobConnectivity',
  'blobOneFill',
  'blobHoles',
  'blobMeatballs',
  'strands',
  'junction',
  'tubeThickness',
  'wireThickness',
  'heightMode',
  'heightScale',
  'maxSlope',
  'rampLength',
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
