// Every knob NetworkTest's renderers accept, declared once
// (docs/network-test-pipeline.md). The scene's Leva folders are generated
// from it: `section` is the top folder and `group` the folder path inside it.
// `when` hides a control unless every named key holds one of the listed
// values. Dependency-free `.mjs` so plain Node and Vite's config loader can
// import it.
import createOptionSchema, {
  choice,
  color,
  inFacet,
  num,
  rigOf,
  rolled,
  sceneOnly,
  spec,
  standard,
  still,
} from '../optionSchema/index.mjs';

export const FAMILIES = ['primitive', 'noise', 'attractor', 'cluster'];
export const FAMILY_KINDS = {
  attractor: ['lorenz', 'aizawa', 'thomas', 'halvorsen', 'flow'],
  cluster: ['gaussian', 'hub', 'galaxy'],
  noise: ['blob', 'filament', 'shell'],
  primitive: [
    'ring',
    'sphere',
    'torus',
    'helix',
    'knot',
    'lissajous',
    'lattice',
    'phyllotaxis',
  ],
};
export const RULES = [
  'chain',
  'mst',
  'rng',
  'gabriel',
  'knn',
  'band',
  'bridge',
];
export const MOODS = ['glow', 'ink'];
export const NODE_STYLES = ['dot', 'halo', 'ring'];
export const SVG_NODES = ['none', 'circles'];
export const VIEWS = ['hero', 'front', 'right', 'back', 'left', 'top'];
export const VIDEO_MODES = ['grow', 'drift', 'pulse', 'turntable'];
export const PROJECTIONS = ['perspective', 'orthographic'];
export const MAX_POINTS = 5000;

export const VIEW_AZIMUTHS = {
  back: 270,
  front: 90,
  hero: 40,
  left: 180,
  right: 0,
  top: 40,
};
export const VIEW_ELEVATIONS = { top: 89.9 };
export const VIEW_ELEVATION = 18;

const kindChoice = (family, label) =>
  inFacet(
    'points',
    choice('points', 'Kinds', label, ['any', ...FAMILY_KINDS[family]], 'any', {
      help: `${label} generator; any rolls one per placement`,
    })
  );
const familyWeight = (label, value) =>
  inFacet(
    'points',
    num('points', 'Families', label, value, 0, 1, 0.01, {
      help: `Share of placements drawn from ${label.toLowerCase()} generators; zero the rest to solo it`,
    })
  );

const POINTS = {
  pointSeed: rolled(
    'points',
    [0, 9999],
    num('points', null, 'Seed', 7, 0, 9999, 1, {
      help: 'Seeds the composition: placements, generators, scatter',
    })
  ),
  pointCount: rolled(
    'points',
    [700, 2200],
    num('points', null, 'Points', 1200, 50, MAX_POINTS, 10, {
      help: 'Point budget shared across the placements',
    })
  ),
  shapeCount: rolled(
    'points',
    [2, 6],
    num('points', null, 'Placements', 4, 1, 10, 1, {
      help: 'How many generators are placed and networked together',
    })
  ),
  weightPrimitive: familyWeight('Primitive', 1),
  weightNoise: familyWeight('Noise', 0.6),
  weightAttractor: familyWeight('Attractor', 0.6),
  weightCluster: familyWeight('Cluster', 0.6),
  primitiveKind: kindChoice('primitive', 'Primitive'),
  noiseKind: kindChoice('noise', 'Noise'),
  attractorKind: kindChoice('attractor', 'Attractor'),
  clusterKind: kindChoice('cluster', 'Cluster'),
  spread: rolled(
    'points',
    [0.3, 0.9],
    num('points', 'Placement', 'Spread', 0.6, 0, 1, 0.01, {
      help: 'How far placements sit from the centre, as a share of the domain',
    })
  ),
  shapeScale: rolled(
    'points',
    [0.4, 0.9],
    num('points', 'Placement', 'Scale', 0.65, 0.1, 1.5, 0.01, {
      help: 'Placement size as a share of the domain',
    })
  ),
  scaleJitter: rolled(
    'points',
    [0, 0.6],
    num('points', 'Placement', 'Scale Jitter', 0.3, 0, 1, 0.01)
  ),
  surfaceJitter: rolled(
    'points',
    [0, 0.12],
    num('points', 'Placement', 'Thickness', 0.03, 0, 0.4, 0.005, {
      help: 'Scatter of points off their generator, as a share of its size',
    })
  ),
  warpAmount: rolled(
    'points',
    [0, 0.6],
    num('points', 'Warp', 'Amount', 0.25, 0, 1.5, 0.01, {
      help: 'Domain warp over every point: blurs which generator made what',
    })
  ),
  warpScale: rolled(
    'points',
    [0.4, 2.2],
    num('points', 'Warp', 'Scale', 1, 0.1, 5, 0.01)
  ),
  minSpacing: rolled(
    'points',
    [0, 0.025],
    num('points', 'Warp', 'Min Spacing', 0.012, 0, 0.25, 0.001, {
      help: 'Poisson thinning: no two points closer than this',
    })
  ),
  domainX: inFacet(
    'points',
    num('points', 'Domain', 'Half Width', 1.2, 0.25, 3, 0.01)
  ),
  domainY: inFacet(
    'points',
    num('points', 'Domain', 'Half Height', 1, 0.25, 3, 0.01)
  ),
  domainZ: inFacet(
    'points',
    num('points', 'Domain', 'Half Depth', 1, 0.25, 3, 0.01)
  ),
};

const imageKnob = (item) => inFacet('points', item);

// A picture (a file, an upload or the webcam) as a points source: a plane of
// points scattered by its darkness and edges, wired like any other. Never
// rolled; held with the points facet.
const IMAGE = {
  imageShare: imageKnob(
    num('image', null, 'Image Share', 0, 0, 1, 0.01, {
      help: 'Share of the point budget scattered over the source image; 1 is the image alone',
    })
  ),
  sourceImage: imageKnob(
    spec('string', 'image', null, 'Source image', '', {
      help: 'Image for the image share: a path under public/ (images/…) or, on the CLI, a file path',
      placeholder: 'PATH',
    })
  ),
  imageInvert: imageKnob(
    spec('boolean', 'image', null, 'Invert', false, {
      help: 'Flip which end of the picture gathers points: glow gathers on bright, ink on dark',
    })
  ),
  imageEdges: imageKnob(
    num('image', null, 'Edges', 0.4, 0, 1, 0.01, {
      help: 'Blend the density from tone (0) toward edge strength (1), so links trace contours',
    })
  ),
  imageContrast: imageKnob(
    num('image', null, 'Contrast', 2.5, 0.2, 5, 0.05, {
      help: 'Power on the density: higher empties the light areas',
    })
  ),
  imageScale: imageKnob(
    num('image', null, 'Scale', 1, 0.2, 1.5, 0.01, {
      help: 'Picture size as a share of the domain’s width and height',
    })
  ),
  imageDepth: imageKnob(
    num('image', null, 'Relief', 0.25, 0, 1, 0.01, {
      help: 'Push bright points toward the camera, as a share of the domain depth',
    })
  ),
  imageColor: inFacet(
    'color',
    num('image', null, 'Source Colour', 0, 0, 1, 0.01, {
      help: 'How far nodes and links take the picture’s own colour',
    })
  ),
  webcam: sceneOnly(
    spec('boolean', 'image', 'Webcam', 'Webcam', false, {
      help: 'The live webcam is the source image',
    })
  ),
  webcamFacing: sceneOnly(
    choice('image', 'Webcam', 'Camera', ['front', 'back'], 'front')
  ),
  webcamRate: sceneOnly(
    num('image', 'Webcam', 'Updates/s', 4, 1, 15, 1, {
      help: 'How often a webcam frame rebuilds the network',
    })
  ),
};

const ruleWeight = (rule, label, value, help) =>
  inFacet(
    'wiring',
    num('wiring', 'Rules', label, value, 0, 1, 0.01, {
      help: `${help}. The weight is the share of that rule's edges kept; zero the rest to solo it`,
    })
  );

const WIRING = {
  wireSeed: rolled(
    'wiring',
    [0, 9999],
    num('wiring', null, 'Seed', 3, 0, 9999, 1, {
      help: 'Seeds which edges a partial rule keeps, and the bridges',
    })
  ),
  ruleChain: ruleWeight(
    'chain',
    'Chain',
    0.6,
    'Links each point to the next along its generator (curves, trajectories, arms)'
  ),
  ruleMst: ruleWeight('mst', 'Spanning Tree', 1, 'Minimum spanning tree'),
  ruleRng: ruleWeight(
    'rng',
    'Rel. Neighbourhood',
    0.4,
    'Relative neighbourhood graph: no third point nearer to both ends'
  ),
  ruleGabriel: ruleWeight(
    'gabriel',
    'Gabriel',
    0,
    'Gabriel graph: no third point inside the sphere on the edge'
  ),
  ruleKnn: ruleWeight('knn', 'k-Nearest', 0, 'Each point to its k nearest'),
  ruleBand: ruleWeight(
    'band',
    'Distance Band',
    0.2,
    'Pairs within a distance band, filled to a degree range (the original NetworkTest)'
  ),
  ruleBridge: ruleWeight(
    'bridge',
    'Bridges',
    1,
    'Long links between placements'
  ),
  knnK: rolled('wiring', [2, 6], num('wiring', 'k-Nearest', 'k', 3, 1, 12, 1)),
  bandMin: rolled(
    'wiring',
    [0, 0.08],
    num('wiring', 'Band', 'Min Distance', 0.02, 0, 1, 0.005)
  ),
  bandMax: rolled(
    'wiring',
    [0.1, 0.35],
    num('wiring', 'Band', 'Max Distance', 0.2, 0.01, 2, 0.005)
  ),
  bandMinDegree: rolled(
    'wiring',
    [1, 2],
    num('wiring', 'Band', 'Min Links', 1, 0, 16, 1)
  ),
  bandMaxDegree: rolled(
    'wiring',
    [3, 8],
    num('wiring', 'Band', 'Max Links', 6, 0, 32, 1)
  ),
  bridgeCount: rolled(
    'wiring',
    [4, 24],
    num('wiring', 'Bridges', 'Count', 10, 0, 80, 1, {
      help: 'Links drawn between placements',
    })
  ),
  bridgeArc: rolled(
    'wiring',
    [0, 0.6],
    num('wiring', 'Bridges', 'Arc', 0.3, 0, 1.5, 0.01, {
      help: 'How far a bridge bows away from a straight line',
    })
  ),
  maxDegree: rolled(
    'wiring',
    [4, 10],
    num('wiring', null, 'Max Degree', 8, 1, 32, 1, {
      help: 'Links a point may hold across every rule but bridges',
    })
  ),
};

const NODES = {
  mood: inFacet(
    'color',
    choice('stage', null, 'Mood', MOODS, 'glow', {
      help: 'glow: additive light on a dark ground; ink: lines laid on paper',
      choiceLabels: { glow: 'Glow', ink: 'Ink' },
    })
  ),
  background: inFacet('color', color('stage', null, 'Background', '#05070d')),
  depthFade: rolled(
    'atmosphere',
    [0.2, 0.8],
    num('stage', null, 'Depth Fade', 0.5, 0, 1, 0.01, {
      help: 'How much the far side of the network fades out',
    })
  ),
  paletteName: inFacet(
    'color',
    spec('string', 'stage', 'Palette', 'Palette', 'None', {
      help: 'gradients.json palette each placement takes a stop from; None keeps the set colours',
      placeholder: 'NAME',
    })
  ),
  paletteMix: rolled(
    'color',
    [0.4, 1],
    num('stage', 'Palette', 'Mix', 0.8, 0, 1, 0.01)
  ),
  paletteExact: inFacet(
    'color',
    spec('boolean', 'stage', 'Palette', 'Exact Stops', true, {
      help: 'Each placement takes a whole palette stop; off blends between stops',
    })
  ),
  nodeColor: inFacet('color', color('nodes', null, 'Color', '#9fd8ff')),
  nodeIntensity: rolled(
    'color',
    [1, 4],
    num('nodes', null, 'Intensity', 2, 0, 12, 0.05)
  ),
  nodeStyle: inFacet(
    'color',
    choice('nodes', null, 'Style', NODE_STYLES, 'halo', {
      choiceLabels: { dot: 'Dot', halo: 'Halo', ring: 'Ring' },
    })
  ),
  nodeSize: rolled(
    'color',
    [0.006, 0.016],
    num('nodes', null, 'Size', 0.01, 0, 0.08, 0.0005)
  ),
  nodeHubScale: rolled(
    'color',
    [0, 1.5],
    num('nodes', null, 'Hub Scale', 0.6, 0, 3, 0.01, {
      help: 'How much a well-linked point grows',
    })
  ),
  nodeShare: rolled(
    'color',
    [0.2, 1],
    num('nodes', null, 'Shown', 1, 0, 1, 0.01, {
      help: 'Share of points drawn as nodes; 0 is wires only',
    })
  ),
  edgeColor: inFacet('color', color('edges', null, 'Color', '#4b8cff')),
  bridgeColor: inFacet(
    'color',
    color('edges', null, 'Bridge Color', '#ff6a8a')
  ),
  edgeTint: rolled(
    'color',
    [0.3, 1],
    num('edges', null, 'Palette Tint', 0.7, 0, 1, 0.01, {
      help: 'How far an edge takes its ends’ placement colours',
    })
  ),
  edgeIntensity: rolled(
    'color',
    [0.6, 2.5],
    num('edges', null, 'Intensity', 1.2, 0, 8, 0.05)
  ),
  edgeOpacity: rolled(
    'color',
    [0.6, 1],
    num('edges', null, 'Opacity', 0.85, 0, 1, 0.01)
  ),
  edgeWidth: rolled(
    'color',
    [0.003, 0.009],
    num('edges', null, 'Width', 0.005, 0, 0.03, 0.0001)
  ),
  edgeSoftness: rolled(
    'atmosphere',
    [0.3, 1],
    num('edges', null, 'Softness', 0.7, 0, 1, 0.01, {
      help: 'Falloff across a line: 0 is a hard ink edge, 1 a glow',
    })
  ),
  lengthFade: rolled(
    'color',
    [0, 0.5],
    num('edges', null, 'Length Fade', 0.3, 0, 1, 0.01, {
      help: 'Long links fade, as the original band did',
    })
  ),
  pulseCount: rolled(
    'color',
    [0, 160],
    num('pulses', null, 'Count', 60, 0, 600, 1, {
      help: 'Signals walking the network',
    })
  ),
  pulseColor: inFacet('color', color('pulses', null, 'Color', '#ffffff')),
  pulseIntensity: rolled(
    'color',
    [2, 8],
    num('pulses', null, 'Intensity', 5, 0, 20, 0.1)
  ),
  pulseSize: rolled(
    'color',
    [0.01, 0.025],
    num('pulses', null, 'Size', 0.016, 0, 0.08, 0.0005)
  ),
  pulseTrail: rolled(
    'color',
    [0.2, 0.8],
    num('pulses', null, 'Trail', 0.5, 0, 1, 0.01, {
      help: 'Trail behind a signal, as a share of the edge it is on',
    })
  ),
  pulseSpeed: num('pulses', null, 'Speed', 0.6, 0, 4, 0.01, {
    help: 'Domain units a signal travels per second',
  }),
};

const MOTION = {
  motionMode: sceneOnly(
    choice('motion', null, 'Mode', ['off', 'grow', 'drift', 'reseed'], 'grow')
  ),
  growProgress: sceneOnly(
    num('motion', null, 'Progress', 1, 0, 1, 0.001, {
      when: { motionMode: ['off'] },
    })
  ),
  growSeconds: num('motion', 'Grow', 'Seconds', 6, 0.5, 30, 0.1, {
    help: 'How long the network takes to grow from its roots',
  }),
  holdSeconds: num('motion', 'Grow', 'Hold Seconds', 5, 0, 60, 0.1),
  driftAmount: num('motion', 'Drift', 'Amount', 0.12, 0, 1, 0.005, {
    help: 'How far points wander from home',
  }),
  driftScale: num('motion', 'Drift', 'Scale', 1.2, 0.1, 5, 0.01),
  driftSpeed: num('motion', 'Drift', 'Speed', 0.15, 0, 2, 0.005),
  rewireSeconds: num('motion', 'Drift', 'Rewire Every', 0.25, 0.02, 5, 0.01, {
    help: 'Seconds between rewiring the drifting points',
  }),
  fadeSeconds: num('motion', 'Drift', 'Edge Fade', 0.6, 0, 5, 0.01, {
    help: 'How long a link takes to form or break',
  }),
};

// Owned by the post rig, which builds its own Leva controls; declared here
// so a preset and a headless render carry them. Defaults are
// networkTestRender's post.js.
const rig = rigOf({ facet: 'atmosphere' });

const RIG = {
  postBloomEnabled: rig({
    default: true,
    help: 'Mip bloom',
    label: 'Bloom',
    type: 'boolean',
  }),
  postBloomThreshold: rig({
    default: 0.6,
    help: 'Luminance the bloom starts above',
    label: 'Bloom threshold',
    max: 4,
    min: 0,
    roll: { max: 0.9, min: 0.3, step: 0.05 },
    step: 0.05,
    type: 'number',
  }),
  postBloomStrength: rig({
    default: 1.2,
    help: 'Bloom strength',
    label: 'Bloom strength',
    max: 4,
    min: 0,
    roll: { max: 1.8, min: 0.6, step: 0.05 },
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
    default: 0.35,
    help: 'Vignette strength',
    label: 'Vignette',
    max: 1,
    min: 0,
    roll: { max: 0.5, min: 0, step: 0.01 },
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
  postGrainEnabled: rig({
    default: false,
    help: 'Film grain',
    label: 'Grain',
    type: 'boolean',
  }),
  postGrainAmount: rig({
    default: 0.06,
    help: 'Grain strength',
    label: 'Grain amount',
    max: 0.4,
    min: 0,
    step: 0.005,
    type: 'number',
  }),
  postGrainScale: rig({
    default: 1,
    help: 'Grain cell size in px',
    label: 'Grain scale',
    max: 4,
    min: 0.25,
    step: 0.05,
    type: 'number',
  }),
  postGrainAnimated: rig({
    default: true,
    help: 'Re-roll the grain every frame',
    label: 'Grain animated',
    type: 'boolean',
  }),
};

const RENDER = {
  batch: standard.batch(),
  out: standard.out('network-test'),
  width: standard.width(),
  height: standard.height(),
  pixelRatio: standard.pixelRatio(),
  count: standard.count('networks'),
  png: standard.png(),
  webp: standard.webp(),
  svg: standard.svg(
    'Write a plottable SVG per view: edges chained into paths, one pen per class and depth band'
  ),
  dxf: standard.dxf(),
  plotWidthMm: standard.plotWidthMm(),
  views: standard.views(VIEWS, 'hero'),
  stillTime: still({
    default: 4,
    help: 'Seconds of signal travel a still is frozen at',
    label: 'Signal time',
    max: 120,
    min: 0,
    placeholder: 'S',
    step: 0.5,
    type: 'number',
  }),
  svgStroke: standard.svgStroke(),
  svgNodes: {
    choices: SVG_NODES,
    default: 'circles',
    help: 'Draw nodes as small circles, or leave them out',
    label: 'SVG nodes',
    scope: 'still',
    section: 'svg',
    type: 'enum',
  },
  svgDepthPens: {
    choices: [1, 2, 3],
    default: 2,
    help: 'Split each pen into this many depth bands, near to far',
    label: 'SVG depth pens',
    max: 3,
    min: 1,
    scope: 'still',
    section: 'svg',
    type: 'number',
  },
  svgMinAlpha: {
    default: 0.15,
    help: 'Drop links fainter than this (faded by length or depth)',
    label: 'SVG min alpha',
    max: 1,
    min: 0,
    scope: 'still',
    section: 'svg',
    step: 0.01,
    type: 'number',
  },
  projection: standard.projection(PROJECTIONS, 'perspective'),
  fov: standard.fov(32),
  margin: standard.margin(
    0.08,
    'Space around the network, as a share of the frame'
  ),
  samples: standard.samples(),
  keep: standard.keep(['points', 'wiring', 'color', 'atmosphere']),
  base: standard.base('network'),
  palettes: standard.palettes('colour'),
  mode: standard.mode(
    VIDEO_MODES,
    'grow',
    'grow: the network grows out from its roots, holds, then grows back in, drifting and signalling throughout; drift: points wander and rewire; pulse: a settled network carrying signals; turntable: orbit a settled network'
  ),
  view: standard.view(VIEWS, 'hero'),
  fps: standard.fps(),
  hold: standard.hold(
    4,
    'Seconds each network holds grown, or plays for (drift, pulse, turntable)'
  ),
  turns: standard.turns('network'),
  orbit: standard.orbit(
    30,
    'Degrees the camera drifts round a grow, drift or pulse clip'
  ),
};

export const RENDER_OPTIONS = {
  ...POINTS,
  ...IMAGE,
  ...WIRING,
  ...NODES,
  ...MOTION,
  ...RIG,
  ...RENDER,
  ...standard.overlayOptions(),
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': { count: 2, height: 1920, out: 'output/network-test.mp4' },
  workbench: { count: 6 },
};

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
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

const { keysWhere } = schema;

// The keys that move points; wiring keys only relink them.
export const POINT_KEYS = keysWhere((item) => item.facet === 'points');
export const WIRING_KEYS = keysWhere((item) => item.facet === 'wiring');
