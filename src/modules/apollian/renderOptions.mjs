// Every knob Apollian's renderers accept, declared once
// (docs/apollian-pipeline.md). The scene's Leva folders are generated from
// it: `section` is the top folder and `group` the folder path inside it.
// `when` hides a control unless every named key holds one of the listed
// values. Dependency-free `.mjs` so plain Node and Vite's config loader can
// import it.
import createOptionSchema from '../optionSchema/index.mjs';

export const FAMILIES = ['apollian4', 'disc', 'kleinian', 'classic'];
export const BOUNDS = ['sphere', 'disc', 'cube', 'open'];
export const A4_SHAPES = ['sheets', 'tubes'];
export const SLICE_MODES = ['section', 'bands', 'stack'];
export const BAND_SIDES = ['outside', 'inside', 'both'];
export const SVG_STYLES = ['outline', 'pens', 'hatch'];
export const MATERIALS = ['matte', 'glass', 'iridescent', 'metal'];
export const PLINTHS = ['column', 'block', 'none'];
export const VIEWS = ['hero', 'front', 'side', 'top', 'slice'];
export const VIDEO_MODES = ['turntable', 'sweep', 'evolve', 'morph'];
export const MOTION_MODES = ['off', 'turntable', 'spin', 'sweep', 'evolve'];
export const PROJECTIONS = ['perspective', 'orthographic'];

export const FAMILY_LABELS = {
  apollian4: '4D Apollian',
  classic: 'Soddy Packing',
  disc: 'Apollian Disc',
  kleinian: 'Pseudo-Kleinian',
};

// Degrees round the object from +x toward +z, and up.
export const VIEW_AZIMUTHS = { front: 90, hero: 55, side: 0, top: 90 };
export const VIEW_ELEVATIONS = { front: 8, hero: 24, side: 8, top: 89 };

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

const isA4 = { family: ['apollian4'] };
const isDisc = { family: ['disc'] };
const isKlein = { family: ['kleinian'] };
const isClassic = { family: ['classic'] };
const isMarched = { family: ['apollian4', 'disc', 'kleinian'] };
const isBands = { sliceMode: ['bands'] };
const isStack = { sliceMode: ['stack'] };

const form = (item) => inFacet('form', item);

const FORM = {
  family: form(
    choice('form', null, 'Family', FAMILIES, 'apollian4', {
      optionLabels: FAMILY_LABELS,
    })
  ),
  fieldScale: form(
    num('form', 'Field', 'Scale', 0.5, 0.05, 6, 0.001, {
      help: 'Field units per object unit: higher carves a wider stretch of the fractal',
      when: isMarched,
    })
  ),
  fieldX: form(
    num('form', 'Field', 'Offset X', 0, -4, 4, 0.001, { when: isMarched })
  ),
  fieldY: form(
    num('form', 'Field', 'Offset Y', 0, -4, 4, 0.001, { when: isMarched })
  ),
  fieldZ: form(
    num('form', 'Field', 'Offset Z', 0, -4, 4, 0.001, { when: isMarched })
  ),
  thickness: form(
    num('form', 'Field', 'Thickness', 0.004, 0, 0.1, 0.0005, {
      help: 'Grows the surface by this much; the 4D and disc fields are bare sheets without it',
      when: isMarched,
    })
  ),
  a4Shape: form(
    choice('form', '4D Apollian', 'Estimator', A4_SHAPES, 'sheets', {
      help: 'sheets: Apollian with a twist (|p.y|), tubes: Slicing a 4D apollian',
      optionLabels: { sheets: 'Sheets (twist)', tubes: 'Tubes (slice)' },
      when: isA4,
    })
  ),
  a4Folds: form(
    num('form', '4D Apollian', 'Folds', 7, 1, 12, 1, { when: isA4 })
  ),
  a4Scale: form(
    num('form', '4D Apollian', 'Inversion', 1.2, 0.8, 2, 0.001, { when: isA4 })
  ),
  a4W: form(
    num('form', '4D Apollian', 'W', 0.03125, -1, 1, 0.0005, { when: isA4 })
  ),
  a4Twist: form(
    num('form', '4D Apollian', 'Twist', 1, 0, 1, 0.01, {
      help: 'Bends w with radius, as the twist shader does',
      when: isA4,
    })
  ),
  a4RotXW: form(
    num('form', '4D Apollian', 'Rotate XW', 0, -180, 180, 0.1, { when: isA4 })
  ),
  a4RotYW: form(
    num('form', '4D Apollian', 'Rotate YW', 0, -180, 180, 0.1, { when: isA4 })
  ),
  a4RotZW: form(
    num('form', '4D Apollian', 'Rotate ZW', 0, -180, 180, 0.1, { when: isA4 })
  ),
  discFolds: form(num('form', 'Disc', 'Folds', 8, 1, 12, 1, { when: isDisc })),
  discScale: form(
    num('form', 'Disc', 'Inversion', 1.34, 1, 2, 0.001, { when: isDisc })
  ),
  discDrift: form(
    num('form', 'Disc', 'Drift', 0, -2, 2, 0.001, {
      help: 'Slides the fold lattice through the slab, as the reference does over time',
      when: isDisc,
    })
  ),
  kleinFolds: form(
    num('form', 'Kleinian', 'Folds', 7, 1, 12, 1, { when: isKlein })
  ),
  kleinKey: form(
    num('form', 'Kleinian', 'Keyframe', 0, 0, 16, 0.01, {
      help: "Position along Durand's 16 box-fold keyframes",
      when: isKlein,
    })
  ),
  classicMinRadius: form(
    num('form', 'Packing', 'Min Radius', 0.012, 0.003, 0.1, 0.001, {
      help: 'Smallest sphere the packing keeps',
      when: isClassic,
    })
  ),
  classicMaxSpheres: form(
    num('form', 'Packing', 'Max Spheres', 4000, 100, 8000, 100, {
      when: isClassic,
    })
  ),
  classicWarp: form(
    num('form', 'Packing', 'Warp', 0.3, 0, 0.9, 0.01, {
      help: 'An inversion that keeps the ball: pulls the packing toward one side',
      when: isClassic,
    })
  ),
  classicWarpAzimuth: form(
    num('form', 'Packing', 'Warp Azimuth', 30, -180, 180, 1, {
      when: isClassic,
    })
  ),
  classicWarpElevation: form(
    num('form', 'Packing', 'Warp Elevation', 20, -90, 90, 1, {
      when: isClassic,
    })
  ),
  classicGap: form(
    num('form', 'Packing', 'Gap', 0.03, 0, 0.3, 0.005, {
      help: 'Each sphere shrinks by this share of its radius',
      when: isClassic,
    })
  ),
  bound: form(
    choice('form', 'Bound', 'Shape', BOUNDS, 'sphere', {
      optionLabels: {
        cube: 'Cube / Slab',
        disc: 'Disc / Coin',
        open: 'Open',
        sphere: 'Sphere',
      },
    })
  ),
  discHalf: form(
    num('form', 'Bound', 'Coin Half Thickness', 0.25, 0.03, 1, 0.005, {
      when: { bound: ['disc'] },
    })
  ),
  cubeHalf: form(
    num('form', 'Bound', 'Slab Half Height', 0.75, 0.05, 1, 0.005, {
      when: { bound: ['cube'] },
    })
  ),
  objectTilt: form(num('form', 'Bound', 'Tilt', 0, -90, 90, 0.5)),
  objectSpin: form(num('form', 'Bound', 'Spin', 0, -180, 180, 0.5)),
  objectSize: num('form', 'Bound', 'Size', 1, 0.25, 3, 0.01, {
    help: 'World size of the unit bound',
  }),
};

const slice = (item) => inFacet('slice', item);

const SLICE = {
  sectionCut: slice(
    flag('slice', null, 'Section Cut', false, {
      help: 'Cut the 3D object at the slice plane, so the scene shows the face the plot draws',
    })
  ),
  sliceAzimuth: rolled(
    'slice',
    [-180, 180],
    num('slice', 'Plane', 'Azimuth', 90, -180, 180, 0.5)
  ),
  sliceElevation: rolled(
    'slice',
    [-90, 90],
    num('slice', 'Plane', 'Elevation', 0, -90, 90, 0.5)
  ),
  sliceOffset: rolled(
    'slice',
    [-0.4, 0.4],
    num('slice', 'Plane', 'Offset', 0, -1.5, 1.5, 0.001)
  ),
  sliceSpin: slice(num('slice', 'Plane', 'Spin', 0, -180, 180, 0.5)),
  sliceZoom: slice(num('slice', 'Frame', 'Zoom', 1, 0.25, 12, 0.01)),
  slicePanX: slice(num('slice', 'Frame', 'Pan X', 0, -1.5, 1.5, 0.001)),
  slicePanY: slice(num('slice', 'Frame', 'Pan Y', 0, -1.5, 1.5, 0.001)),
  sliceMode: slice(
    choice('slice', null, 'Mode', SLICE_MODES, 'bands', {
      optionLabels: { bands: 'Iso Bands', section: 'Section', stack: 'Stack' },
    })
  ),
  bandStep: rolled(
    'slice',
    [0.006, 0.03],
    num('slice', 'Bands', 'Step', 0.012, 0.001, 0.2, 0.001, { when: isBands })
  ),
  bandCount: rolled(
    'slice',
    [4, 16],
    num('slice', 'Bands', 'Count', 8, 1, 60, 1, { when: isBands })
  ),
  bandSide: slice(
    choice('slice', 'Bands', 'Side', BAND_SIDES, 'outside', { when: isBands })
  ),
  stackCount: rolled(
    'slice',
    [6, 24],
    num('slice', 'Stack', 'Planes', 12, 2, 40, 1, { when: isStack })
  ),
  stackSpacing: rolled(
    'slice',
    [0.02, 0.12],
    num('slice', 'Stack', 'Spacing', 0.06, 0.005, 0.5, 0.001, { when: isStack })
  ),
  stackShift: slice(
    num('slice', 'Stack', 'Plot Shift', 0.02, 0, 0.1, 0.001, {
      help: 'How far each plane is displaced in the plot, in frame heights',
      when: isStack,
    })
  ),
  stackAngle: slice(
    num('slice', 'Stack', 'Plot Angle', 90, -180, 180, 1, { when: isStack })
  ),
  sliceGlow: slice(
    num('slice', 'Look', 'Glow', 0.5, 0, 2, 0.01, {
      help: 'The twist shader’s glow round the solid',
    })
  ),
  sliceShadow: slice(
    num('slice', 'Look', 'Shadow', 1, 0, 2, 0.01, {
      help: 'The twist shader’s drop shadow onto the paper below',
    })
  ),
  sliceLine: slice(
    num('slice', 'Look', 'Band Lines', 1, 0, 4, 0.05, {
      help: 'Width in pixels of the drawn contour lines',
    })
  ),
  slicePaper: inFacet('stage', color('slice', 'Look', 'Paper', '#101014')),
};

const look = (item) => inFacet('look', item);

const LOOK = {
  paletteName: look(
    spec('string', 'look', 'Palette', 'Palette', 'Sunraze (lospec)', {
      help: 'gradients.json palette the object, the slice and the plot pens take',
      placeholder: 'NAME',
    })
  ),
  paletteRepeat: rolled(
    'look',
    [0.6, 3],
    num('look', 'Palette', 'Repeat', 1, 0.1, 8, 0.01)
  ),
  paletteShift: rolled(
    'look',
    [-0.5, 0.5],
    num('look', 'Palette', 'Shift', 0, -1, 1, 0.001)
  ),
  paletteReverse: look(flag('look', 'Palette', 'Reverse', false)),
  colorTrap: look(num('look', 'Colour By', 'Orbit Trap', 1, 0, 1, 0.01)),
  colorDepth: look(num('look', 'Colour By', 'Fold Depth', 0, 0, 1, 0.01)),
  colorRadius: look(num('look', 'Colour By', 'Radius', 0, 0, 1, 0.01)),
  colorHeight: look(num('look', 'Colour By', 'Height', 0, 0, 1, 0.01)),
  material: look(
    choice('look', 'Material', 'Surface', MATERIALS, 'matte', {
      optionLabels: {
        glass: 'Glass',
        iridescent: 'Iridescent',
        matte: 'Matte + AO',
        metal: 'Metal',
      },
    })
  ),
  roughness: rolled(
    'look',
    [0.15, 0.7],
    num('look', 'Material', 'Roughness', 0.45, 0.02, 1, 0.01)
  ),
  clearcoat: look(num('look', 'Material', 'Clearcoat', 0.3, 0, 1, 0.01)),
  ior: look(
    num('look', 'Material', 'IOR', 1.2, 1, 2.4, 0.01, {
      when: { material: ['glass'] },
    })
  ),
  absorption: look(
    num('look', 'Material', 'Absorption', 0.333, 0, 4, 0.01, {
      help: 'How fast colour builds with distance travelled inside the glass',
      when: { material: ['glass'] },
    })
  ),
  iridescence: look(
    num('look', 'Material', 'Iridescence', 1, 0, 3, 0.01, {
      help: 'Strength of the folded-reflection bands',
      when: { material: ['iridescent', 'glass'] },
    })
  ),
  aoStrength: look(num('look', 'Material', 'AO', 1, 0, 3, 0.01)),
  cutGlow: look(
    num('look', 'Material', 'Cut Glow', 0.6, 0, 4, 0.01, {
      help: 'Emission of the section-cut face',
      when: { sectionCut: [true] },
    })
  ),
};

const stage = (item) => inFacet('stage', item);

const STAGE = {
  background: stage(color('stage', null, 'Background', '#1c1b22')),
  skyZenith: stage(color('stage', 'Sky', 'Zenith', '#7d889e')),
  skyHorizon: stage(color('stage', 'Sky', 'Horizon', '#d9cfc2')),
  stagePalette: rolled(
    'stage',
    [0, 0.6],
    num('stage', null, 'From Palette', 0, 0, 1, 0.01, {
      help: 'Pulls the backdrop, plinth and floor toward the palette’s darkest stops',
    })
  ),
  plinth: stage(
    choice('stage', 'Plinth', 'Style', PLINTHS, 'column', {
      optionLabels: { block: 'Block', column: 'Column', none: 'None' },
    })
  ),
  plinthColor: stage(color('stage', 'Plinth', 'Color', '#8f8a94')),
  plinthRoughness: stage(
    num('stage', 'Plinth', 'Roughness', 0.6, 0.02, 1, 0.01)
  ),
  plinthHeight: stage(num('stage', 'Plinth', 'Height', 0.7, 0.05, 3, 0.01)),
  plinthWidth: stage(num('stage', 'Plinth', 'Width', 0.8, 0.2, 2, 0.01)),
  plinthGap: stage(
    num('stage', 'Plinth', 'Float', 0.08, 0, 1, 0.005, {
      help: 'Air between the object and the plinth top',
    })
  ),
  floorEnabled: flag('stage', 'Floor', 'Enabled', true),
  floorColor: stage(
    color('stage', 'Floor', 'Shadow Color', '#0b0a0e', {
      help: 'What the floor darkens toward under shadow; unshadowed, the floor is the backdrop',
    })
  ),
  floorShadow: stage(
    num('stage', 'Floor', 'Shadow Strength', 0.75, 0, 1, 0.01)
  ),
  fog: stage(num('stage', null, 'Fog', 0.04, 0, 1, 0.001)),
  exposure: rolled(
    'stage',
    [1, 1.5],
    num('stage', 'Light', 'Exposure', 1.2, 0.2, 4, 0.01)
  ),
  lightAzimuth: rolled(
    'stage',
    [-180, 180],
    num('stage', 'Light', 'Azimuth', -40, -180, 180, 1)
  ),
  lightElevation: rolled(
    'stage',
    [40, 75],
    num('stage', 'Light', 'Elevation', 55, 5, 89, 1)
  ),
  lightColor: stage(color('stage', 'Light', 'Color', '#fff1dc')),
  lightIntensity: rolled(
    'stage',
    [1.5, 3.5],
    num('stage', 'Light', 'Intensity', 2.6, 0, 10, 0.01)
  ),
  ambient: stage(num('stage', 'Light', 'Ambient', 0.9, 0, 3, 0.01)),
  shadowSoftness: stage(
    num('stage', 'Light', 'Shadow Softness', 0.12, 0.01, 1, 0.005, {
      help: 'Penumbra width of the marched soft shadow',
    })
  ),
};

const MOTION = {
  sceneView: sceneOnly(
    choice('motion', null, 'View', ['object', 'slice'], 'object', {
      optionLabels: { object: 'Object', slice: 'Slice' },
    })
  ),
  motionMode: sceneOnly(
    choice('motion', null, 'Motion', MOTION_MODES, 'turntable', {
      optionLabels: {
        evolve: 'Evolve Field',
        off: 'Off',
        spin: 'Spin Object',
        sweep: 'Sweep Slice',
        turntable: 'Turntable',
      },
    })
  ),
  motionSpeed: sceneOnly(num('motion', null, 'Speed', 1, 0, 5, 0.01)),
  turntableSeconds: num('motion', null, 'Turn Seconds', 40, 4, 240, 1, {
    help: 'Seconds per revolution of a turntable or spin',
  }),
  sweepSpan: num('motion', null, 'Sweep Span', 0.8, 0.05, 1.5, 0.01, {
    help: 'A sweep moves the slice this far either side of its offset',
  }),
  sweepSeconds: num('motion', null, 'Sweep Seconds', 16, 2, 120, 0.5),
  evolveRate: num('motion', null, 'Evolve Rate', 1, 0, 5, 0.01, {
    help: 'How fast the field evolves: 4D rotation, disc drift, kleinian keyframes, packing warp',
  }),
};

// Owned by the post rig, which builds its own Leva controls; declared here
// so a preset and a headless render carry them. Defaults are
// apollianRender's post.js.
const rig = (item) => ({
  facet: 'stage',
  group: null,
  rig: true,
  scene: true,
  scope: 'shared',
  section: 'post',
  ...item,
});
const RIG = {
  postBloomEnabled: rig({
    default: true,
    help: 'Mip bloom',
    label: 'Bloom',
    type: 'boolean',
  }),
  postBloomThreshold: rig({
    default: 0.9,
    help: 'Luminance the bloom starts above',
    label: 'Bloom threshold',
    max: 4,
    min: 0,
    step: 0.05,
    type: 'number',
  }),
  postBloomStrength: rig({
    default: 0.6,
    help: 'Bloom strength',
    label: 'Bloom strength',
    max: 4,
    min: 0,
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
    default: 0.3,
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

const quality = (item) => ({ scope: 'shared', section: 'quality', ...item });

const QUALITY = {
  marchSteps: quality(num('quality', null, 'March Steps', 160, 32, 400, 1)),
  shadowSteps: quality(num('quality', null, 'Shadow Steps', 40, 0, 128, 1)),
  aoSamples: quality(num('quality', null, 'AO Samples', 8, 0, 16, 1)),
  hitEpsilon: quality(
    num('quality', null, 'Hit Epsilon', 0.0004, 0.00005, 0.01, 0.00005, {
      help: 'A ray hits once the field is under this times its distance',
    })
  ),
  renderScale: sceneOnly(
    num('quality', null, 'Render Scale', 0.75, 0.25, 1, 0.05, {
      help: 'Canvas resolution the march runs at',
    })
  ),
};

const output = (item) => ({ scope: 'shared', section: 'output', ...item });
const still = (item) => ({ scope: 'still', section: 'output', ...item });
const plot = (item) => ({ ...item, scope: 'still', section: 'svg' });
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
    default: 'output/apollian',
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
    help: 'How many objects to roll',
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
    help: 'Write a plottable SVG of the slice: outlines, contours by pen or hatching',
    label: 'SVG',
    type: 'boolean',
  }),
  views: still({
    default: 'hero,slice',
    help: `Comma-separated views: ${VIEWS.join(', ')}`,
    label: 'Views',
    placeholder: 'LIST',
    type: 'string',
  }),
  svgStyle: plot(
    choice('svg', null, 'SVG style', SVG_STYLES, 'pens', {
      facet: 'slice',
      help: 'outline: one ink; pens: contours one layer per pen; hatch: the solid hatched one angle per pen',
      scene: false,
    })
  ),
  svgPens: plot(
    num('svg', null, 'Pens', 5, 1, 12, 1, {
      facet: 'slice',
      help: 'Pen layers the palette is split into',
      scene: false,
    })
  ),
  hatchSpacing: plot(
    num('svg', null, 'Hatch spacing', 4, 0.5, 40, 0.5, {
      help: 'Hatch line spacing in output px',
      scene: false,
    })
  ),
  hatchAngle: plot(
    num('svg', null, 'Hatch angle', 45, -180, 180, 1, { scene: false })
  ),
  hatchAngleStep: plot(
    num('svg', null, 'Hatch angle step', 37, 0, 180, 1, {
      help: 'Each pen turns its hatch by this much more',
      scene: false,
    })
  ),
  inkColor: plot(color('svg', null, 'Ink', '#1a1a1a', { scene: false })),
  svgResolution: plot(
    num('svg', null, 'SVG resolution', 640, 64, 2400, 16, {
      help: 'Field samples across the long side of the slice',
      scene: false,
    })
  ),
  svgOcclusion: plot(
    flag('svg', null, 'SVG hidden lines', true, {
      help: 'In a stack, drop line work hidden behind nearer planes',
      scene: false,
    })
  ),
  svgStroke: plot(
    num('svg', null, 'SVG stroke', 0.6, 0, 8, 0.1, {
      help: 'Stroke width in output px; 0 draws hairlines',
      scene: false,
    })
  ),
  projection: {
    choices: PROJECTIONS,
    default: 'perspective',
    help: 'Camera projection for the object views',
    label: 'Projection',
    scope: 'shared',
    section: 'render',
    type: 'enum',
  },
  fov: {
    default: 30,
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
    default: 0.12,
    help: 'Space round the object and plinth, as a share of the frame',
    label: 'Fit margin',
    max: 0.5,
    min: 0,
    scope: 'shared',
    section: 'render',
    step: 0.01,
    type: 'number',
  },
  keep: {
    default: '',
    help: 'Comma-separated facets to hold while the rest roll: form, slice, look, stage',
    label: 'Hold facets',
    placeholder: 'LIST',
    scope: 'shared',
    section: 'roll',
    type: 'string',
  },
  families: {
    default: FAMILIES.join(','),
    help: `Comma-separated families the form roll picks from: ${FAMILIES.join(', ')}`,
    label: 'Families',
    placeholder: 'LIST',
    scope: 'shared',
    section: 'roll',
    type: 'string',
  },
  base: {
    cliOnly: true,
    default: null,
    help: 'A config (or props.json path) the roll starts from',
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
    help: 'Palette names the look roll picks from (the CLI fills this from gradients.json)',
    nullable: true,
    placeholder: 'JSON',
    scope: 'shared',
    section: 'roll',
    type: 'json',
  },
  mode: video({
    choices: VIDEO_MODES,
    default: 'turntable',
    help: 'turntable: orbit the object; sweep: the slice plane travels through it; evolve: the field moves; morph: each object holds, then morphs into the next and back to the first',
    label: 'Mode',
    type: 'enum',
  }),
  view: video({
    choices: VIEWS,
    default: 'hero',
    help: 'Camera view for the clip; slice films the 2D section',
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
    help: 'Seconds per object (turntable, sweep, evolve) or each hold of a morph',
    label: 'Hold',
    max: 300,
    min: 0,
    placeholder: 'S',
    step: 0.5,
    type: 'number',
  }),
  turns: video({
    default: 1,
    help: 'Turntable revolutions per object',
    label: 'Turns',
    max: 10,
    min: 0.25,
    placeholder: 'N',
    step: 0.25,
    type: 'number',
  }),
  morphSeconds: video({
    default: 3,
    help: 'Seconds each morph takes',
    label: 'Morph',
    max: 60,
    min: 0.5,
    placeholder: 'S',
    step: 0.5,
    type: 'number',
  }),
  orbit: video({
    default: 0,
    help: 'Degrees the camera drifts round a sweep, evolve or morph clip',
    label: 'Orbit drift',
    max: 360,
    min: -360,
    placeholder: 'DEG',
    step: 5,
    type: 'number',
  }),
};

export const RENDER_OPTIONS = {
  ...FORM,
  ...SLICE,
  ...LOOK,
  ...STAGE,
  ...MOTION,
  ...RIG,
  ...QUALITY,
  ...RENDER,
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': { count: 1, height: 1920, out: 'output/apollian.mp4' },
  workbench: { count: 4 },
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

export function resolveFamilies(list, fail = (message) => new Error(message)) {
  const families = String(list)
    .split(',')
    .map((family) => family.trim())
    .filter(Boolean);
  if (families.length === 0 || families.some((f) => !FAMILIES.includes(f))) {
    throw fail(`families must name only ${FAMILIES.join(', ')}.`);
  }
  return families;
}

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  sectionLabels: {
    form: 'form',
    look: 'look',
    motion: 'motion',
    output: 'output',
    post: 'post',
    quality: 'quality',
    render: 'render',
    roll: 'rolling',
    slice: 'slice',
    stage: 'stage',
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
    resolveFamilies(options.families, fail);
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

// The keys that change the packing; every other key is a uniform.
export const PACKING_KEYS = [
  'classicMinRadius',
  'classicMaxSpheres',
  'classicWarp',
  'classicWarpAzimuth',
  'classicWarpElevation',
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
