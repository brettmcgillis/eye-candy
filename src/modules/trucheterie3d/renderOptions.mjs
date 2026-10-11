// Every knob the Trucheterie3D renderers accept, declared once
// (docs/trucheterie3d-pipeline.md). The field and palette specs are the 2D
// blob field's own, re-foldered; the scene's Leva is generated from this:
// `section` is the top folder, `group` the folder path inside it, `when`
// hides a control unless every named key holds one of the listed values.
// Dependency-free `.mjs` so plain Node and Vite's config loader import it.
import createOptionSchema, {
  choice,
  color,
  flag,
  inFacet,
  num,
  rigOf,
  rolled,
  sceneOnly,
  standard,
} from '../optionSchema/index.mjs';
import {
  RENDER_OPTIONS as BLOB,
  LANE_MODES,
  MEATBALLS,
  PALETTE_NONE,
} from '../trucheterieBlob/renderOptions.mjs';

export { LANE_MODES, MEATBALLS, PALETTE_NONE };

export const STRANDS = ['lanes', 'wires', 'both'];
export const LANES_AS = ['tubes', 'membrane'];
export const MEMBRANE_FINISHES = ['palette', 'foil', 'tintedFoil', 'matte'];
export const MEMBRANE_SIDES = ['single', 'double'];
export const PRESSURE_MODES = ['lift', 'normal'];
export const PROFILES = ['round', 'half', 'ribbon'];
export const JUNCTIONS = ['cap', 'weave'];
export const HEIGHT_MODES = ['flat', 'terrace'];
export const MOTION_MODES = ['off', 'grow', 'flow', 'inflate'];
export const VIEWS = ['hero', 'top', 'low', 'side', 'under'];
export const VIDEO_MODES = ['growth', 'flow', 'turntable', 'inflate'];
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

const MEMBRANE_WHEN = { lanesAs: ['membrane'], strands: ['lanes', 'both'] };
const membraneNum = (label, value, min, max, step, help) =>
  num('form', 'Membrane', label, value, min, max, step, {
    help,
    when: MEMBRANE_WHEN,
  });

// The 260421_CatenaryCanopy solver's knobs, its defaults and ranges.
function membraneControls() {
  return {
    membraneRows: membraneNum(
      'Rows Across',
      4,
      2,
      8,
      1,
      'Simulated vertices across each lane, seam to seam'
    ),
    membraneSides: choice(
      'form',
      'Membrane',
      'Sides',
      MEMBRANE_SIDES,
      'single',
      {
        help: 'single: one skin lifted off the ground, as the canopy; double: a second skin sewn under it at every seam, so each lane inflates into a closed balloon',
        choiceLabels: { double: 'Double (Balloon)', single: 'Single' },
        when: MEMBRANE_WHEN,
      }
    ),
    membranePressureMode: choice(
      'form',
      'Membrane',
      'Pressure Direction',
      PRESSURE_MODES,
      'lift',
      {
        help: "lift: straight up (down for a balloon's bottom skin), as the canopy; normal: along the skin's own normal, as a gas presses on a balloon",
        choiceLabels: { lift: 'Lift', normal: 'Normal' },
        when: MEMBRANE_WHEN,
      }
    ),
    membraneSubdivision: membraneNum(
      'Subdivision Level',
      1,
      0,
      2,
      1,
      'Loop subdivisions of the drawn skin, each smoothed; every level is four times the triangles'
    ),
    membranePressure: membraneNum(
      'Pressure',
      56.55,
      0,
      100,
      0.01,
      'Uniform upward lift on every free vertex'
    ),
    membraneCrownBias: membraneNum(
      'Crown Bias',
      0.2,
      0,
      4,
      0.01,
      'Extra lift toward the middle of each lane'
    ),
    membranePressureScale: membraneNum(
      'Pressure Scale',
      8.3,
      0,
      200,
      0.1,
      'Multiplies pressure into force'
    ),
    membraneResponse: membraneNum(
      'Pressure Response',
      1.9,
      0.1,
      20,
      0.1,
      'How quickly pressure eases toward its target'
    ),
    membraneDamping: membraneNum(
      'Damping',
      4.8,
      0,
      40,
      0.1,
      'How fast motion dies away; low wobbles before it settles'
    ),
    membraneSubsteps: membraneNum(
      'Substeps',
      5,
      1,
      20,
      1,
      'Solver steps per frame'
    ),
    membraneIterations: membraneNum(
      'Constraint Iterations',
      10,
      1,
      60,
      1,
      'Spring passes per step, run in pairs; more is stiffer'
    ),
    membraneStiffness: membraneNum(
      'Stiffness',
      0.19,
      0,
      2,
      0.01,
      'Spring correction per iteration; low stretches and billows more'
    ),
    membraneMaxDelta: membraneNum(
      'Max Delta Time',
      0.032,
      0.005,
      0.2,
      0.001,
      'Longest frame the solver will take in one go, in seconds'
    ),
  };
}

const FORM = {
  strands: inFacet(
    'form',
    choice('form', null, 'Strands', STRANDS, 'lanes', {
      help: 'lanes: every lane a tube; wires: every pen stroke a wire; both: tubes with wires in the seams',
      choiceLabels: { both: 'Lanes + Wires', lanes: 'Lanes', wires: 'Wires' },
    })
  ),
  junction: inFacet(
    'form',
    choice('form', null, 'Junctions', JUNCTIONS, 'cap', {
      help: `cap: lanes stop against the blob they meet, as in 2D; weave: in four-way cells the second family passes under the first (lane thickness is held to ${WEAVE_MAX_THICKNESS})`,
      choiceLabels: { cap: 'Cap', weave: 'Weave' },
    })
  ),
  tubeProfile: inFacet(
    'form',
    choice('form', 'Profile', 'Profile', PROFILES, 'round', {
      help: 'round: a full tube; half: half-round on a flat back; ribbon: a rounded flat band',
      choiceLabels: { half: 'Half Round', ribbon: 'Ribbon', round: 'Round' },
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
  lanesAs: inFacet(
    'form',
    choice('form', null, 'Lanes As', LANES_AS, 'tubes', {
      help: 'tubes: a tube per lane; membrane: one skin over the field, every stroke pinned as a seam and each lane inflated (always capped and flat)',
      choiceLabels: { membrane: 'Membrane', tubes: 'Tubes' },
      when: { strands: ['lanes', 'both'] },
    })
  ),
  ...membraneControls(),
  heightMode: inFacet(
    'form',
    choice('form', 'Height', 'Height', HEIGHT_MODES, 'flat', {
      help: 'flat: one plane; terrace: each ring one step above the ring outside it',
      choiceLabels: { flat: 'Flat', terrace: 'Terrace' },
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
  membraneFinish: choice(
    'stage',
    'Material',
    'Membrane Finish',
    MEMBRANE_FINISHES,
    'palette',
    {
      help: "palette: lane colours with the material below; foil / matte: the canopy's own materials, iridescent film and all; tinted foil: the foil over the lane colours",
      choiceLabels: {
        foil: 'Foil',
        matte: 'Matte',
        palette: 'Palette',
        tintedFoil: 'Tinted Foil',
      },
      when: MEMBRANE_WHEN,
    }
  ),
  envIntensity: num('stage', 'Material', 'Environment', 0.8, 0, 3, 0.01, {
    help: 'Studio reflection strength',
  }),
};

const MOTION = {
  motionMode: sceneOnly(
    choice('motion', null, 'Mode', MOTION_MODES, 'off', {
      help: 'grow: tubes extrude along their channels, hold, and loop; flow: the palette drifts along the channels; inflate: a membrane breathes, pressure on then off',
    })
  ),
  inflateSeconds: num('motion', null, 'Inflate Seconds', 5, 0.5, 60, 0.1, {
    help: 'How long pressure stays on each cycle',
    when: { motionMode: ['inflate'] },
  }),
  deflateSeconds: num('motion', null, 'Deflate Seconds', 4, 0.5, 60, 0.1, {
    help: 'How long pressure stays off each cycle',
    when: { motionMode: ['inflate'] },
  }),
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
const rig = rigOf({ facet: 'atmosphere', section: 'light' });
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

const RENDER = {
  out: standard.out('trucheterie3d'),
  width: standard.width(),
  height: standard.height(),
  pixelRatio: standard.pixelRatio(),
  count: standard.count('pieces', {
    help: 'How many fields to roll; a batch uses seed, seed-1, seed-2…',
  }),
  png: standard.png(),
  webp: standard.webp(),
  views: standard.views(VIEWS, 'hero'),
  projection: standard.projection(PROJECTIONS, 'perspective'),
  fov: standard.fov(30),
  margin: standard.margin(
    0.06,
    'Space around the piece, as a share of the frame'
  ),
  shadows: standard.shadows(),
  keep: standard.keep(['structure', 'palette', 'form', 'atmosphere']),
  base: standard.base('field'),
  mode: standard.mode(
    VIDEO_MODES,
    'growth',
    'growth: tubes extrude along their channels from the centre, then hold; flow: the grown field with its palette drifting; turntable: orbit a still field; inflate: a membrane inflates from flat, holds, then deflates'
  ),
  view: standard.view(VIEWS, 'hero'),
  fps: standard.fps(),
  hold: standard.hold(
    3,
    'Seconds each field holds (growth, flow) or orbits for (turntable)'
  ),
  turns: standard.turns('field'),
  orbit: standard.orbit(
    20,
    'Degrees the camera drifts round a growth or flow clip'
  ),
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

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  sectionLabels: {
    roll: 'rolling',
  },
  surfaceDefaults: SURFACE_DEFAULTS,
  views: VIEWS,
});

export const {
  LEVA_KEYS,
  SCENE_KEYS,
  configFrom,
  defaultsFor,
  facets,
  keysInFacet,
  normalizeOptions,
  optionsFor,
  optionsFromConfig,
  presetFromConfig,
  resolveViews,
  sceneDefaults,
  sectionsFor,
  usageFor,
} = schema;

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
  'lanesAs',
  'membraneRows',
  'membraneSides',
  'junction',
  'tubeThickness',
  'wireThickness',
  'heightMode',
  'heightScale',
  'maxSlope',
  'rampLength',
];

// The membrane solve's runtime knobs: they move the simulation, never its mesh.
export const MEMBRANE_KEYS = [
  'membranePressureMode',
  'membranePressure',
  'membraneCrownBias',
  'membranePressureScale',
  'membraneResponse',
  'membraneDamping',
  'membraneSubsteps',
  'membraneIterations',
  'membraneStiffness',
  'membraneMaxDelta',
];
