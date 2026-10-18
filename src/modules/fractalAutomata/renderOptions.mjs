// Every knob Fractal Automata's renderers accept, declared once
// (docs/fractal-automata-pipeline.md). The scene's Leva folders are generated
// from it: `section` is the top folder and `group` the folder path inside it.
// `when` hides a control unless every named key holds one of the listed
// values. Dependency-free `.mjs` so plain Node and Vite's config loader can
// import it.
import createOptionSchema, {
  choice,
  color,
  flag,
  inFacet,
  num,
  rolled,
  standard,
} from '../optionSchema/index.mjs';

export const MAX_SEED = 999999;
export const MIN_LEVEL = 3;
export const MAX_LEVEL = 7;
export const BASE_FILLS = ['random', 'state1', 'state2', 'state3', 'split'];
export const RULE_MODES = ['random', 'ising', 'balanced'];
export const BOUNDS_SHAPES = ['cube', 'sphere'];
export const COLOR_MODES = [
  'growthOrder',
  'height',
  'distanceFromCore',
  'state',
];
export const STATES = [1, 2, 3];
export const VIEWS = ['hero', 'front', 'right', 'back', 'left', 'top'];
export const VIDEO_MODES = ['turntable', 'keyLight', 'godrayLight'];

// Degrees round the structure, measured from +x toward +z. `hero` is the
// scene camera's own bearing and elevation.
export const VIEW_AZIMUTHS = {
  back: 270,
  front: 90,
  hero: 56.3,
  left: 180,
  right: 0,
  top: 56.3,
};
export const VIEW_ELEVATIONS = {
  back: 18,
  front: 18,
  hero: 22.6,
  left: 18,
  right: 18,
  top: 72,
};

export const MATERIAL_STATE_DEFAULTS = {
  1: {
    clearcoat: 0,
    clearcoatRoughness: 0.3,
    emissiveColor: '#000000',
    emissiveIntensity: 0,
    ior: 1.5,
    metalness: 0.04,
    roughness: 0.92,
    thickness: 0.5,
    transmission: 0,
  },
  2: {
    clearcoat: 0,
    clearcoatRoughness: 0.3,
    emissiveColor: '#000000',
    emissiveIntensity: 0,
    ior: 1.5,
    metalness: 0.6,
    roughness: 0.65,
    thickness: 0.5,
    transmission: 0,
  },
  3: {
    clearcoat: 0.3,
    clearcoatRoughness: 0.2,
    emissiveColor: '#000000',
    emissiveIntensity: 0,
    ior: 1.5,
    metalness: 0.1,
    roughness: 0.3,
    thickness: 0.5,
    transmission: 0,
  },
};

const FIELD = {
  level: num('field', null, 'Level (detail)', 7, MIN_LEVEL, MAX_LEVEL, 1, {
    help: 'Grid resolution: (2^level + 1)^3 cells, so each level is roughly 8x the cost',
  }),
  seed: rolled(
    'structure',
    [0, MAX_SEED],
    num('field', null, 'Seed', 260708, 0, MAX_SEED, 1, {
      help: 'Structure seed: the rule tables and the initial fill',
    })
  ),
  baseFill: inFacet(
    'structure',
    choice('field', null, 'Base Fill', BASE_FILLS, 'random')
  ),
  ruleMode: inFacet(
    'structure',
    choice('field', null, 'Rule Mode', RULE_MODES, 'random')
  ),
  density: rolled(
    'structure',
    [0.3, 0.4],
    num('field', null, 'Density', 0.34, 0, 1, 0.01)
  ),
  beta: rolled(
    'structure',
    [0.8, 1.2],
    num('field', null, 'Beta (ising)', 0.56, 0, 3, 0.01, {
      when: { ruleMode: ['ising'] },
    })
  ),
  magnetism: rolled(
    'structure',
    [-0.25, 0.25],
    num('field', null, 'Magnetism', 0.1, -2, 2, 0.01, {
      when: { ruleMode: ['ising'] },
    })
  ),
  flipChance: rolled(
    'structure',
    [0, 0.05],
    num('field', null, 'Flip Chance', 0.02, 0, 0.5, 0.005)
  ),
  removeStrays: inFacet(
    'structure',
    flag('field', null, 'Remove Strays', true)
  ),
  cellSpacing: inFacet(
    'structure',
    num('field', null, 'Cell Spacing', 0.6, 0.1, 3, 0.01)
  ),
  cellScale: inFacet(
    'structure',
    num('field', null, 'Cell Scale', 0.6, 0.05, 1, 0.01)
  ),
  growthJitter: inFacet(
    'structure',
    num('field', null, 'Growth Jitter', 0.8, 0, 1, 0.01)
  ),
  boundsShape: inFacet(
    'structure',
    choice('field', null, 'Bounds Shape', BOUNDS_SHAPES, 'cube')
  ),
  boundsSphereRadius: inFacet(
    'structure',
    num('field', null, 'Sphere Radius', 1, 0.1, 1.75, 0.01, {
      when: { boundsShape: ['sphere'] },
    })
  ),
};

const detailOn = { detailEnhanceEnabled: [true] };
const detail = (spec) => ({ ...spec, when: { ...detailOn, ...spec.when } });
const DETAIL = {
  detailEnhanceEnabled: inFacet(
    'detail',
    flag('detail', null, 'Enabled', false, {
      help: 'Voxel detail enhancement: erosion and growth fragments on the surface',
    })
  ),
  subdivisionLevels: detail(
    rolled(
      'detail',
      [1, 3],
      num('detail', null, 'Subdivision Levels', 2, 1, 4, 1)
    )
  ),
  subdivisionCoverageBoost: detail(
    rolled(
      'detail',
      [1.1, 2],
      num('detail', null, 'Subdivision Growth', 1.5, 1, 3, 0.1)
    )
  ),
  detailMinSharpness: detail(
    rolled('detail', [1, 3], num('detail', null, 'Min Sharpness', 2, 1, 6, 1))
  ),
  erosionCoverage: detail(
    rolled(
      'detail',
      [0.08, 0.3],
      num('detail', null, 'Erosion Coverage', 0.2, 0, 1, 0.01)
    )
  ),
  growthCoverage: detail(
    rolled(
      'detail',
      [0.05, 0.25],
      num('detail', null, 'Growth Coverage', 0.2, 0, 1, 0.01)
    )
  ),
  detailThreshold: detail(
    rolled('detail', [1, 3], num('detail', null, 'Threshold', 2, 0, 4, 1))
  ),
  detailAltitudeVariance: detail(
    inFacet('detail', flag('detail', null, 'Altitude Variance', false))
  ),
  detailThresholdHigh: detail(
    inFacet(
      'detail',
      num('detail', null, 'Threshold (High Alt.)', 3, 0, 4, 1, {
        when: { detailAltitudeVariance: [true] },
      })
    )
  ),
  debugTierColors: detail(flag('detail', null, 'Debug Tier Colors', false)),
};

const PALETTE = {
  colorMode: choice('palette', null, 'Color Mode', COLOR_MODES, 'state', {
    help: 'Only state colouring is baked into the meshes; the other modes are unused',
  }),
  paletteName: inFacet('color', {
    default: 'None',
    group: null,
    help: 'gradients.json palette name, or None to use the three colours below',
    label: 'Palette',
    placeholder: 'NAME',
    scene: true,
    scope: 'shared',
    section: 'palette',
    type: 'string',
  }),
  paletteExact: inFacet('color', flag('palette', null, 'Exact Colors', false)),
  paletteStart: inFacet(
    'color',
    color('palette', null, 'Color Start', '#ff0000')
  ),
  paletteMid: inFacet('color', color('palette', null, 'Color Mid', '#ffffff')),
  paletteEnd: inFacet('color', color('palette', null, 'Color End', '#7c7c7c')),
  paletteMidpoint: num('palette', null, 'Midpoint', 0.5, 0.05, 0.95, 0.01),
  showState1: flag('palette', null, 'Show State 1', true),
  showState2: flag('palette', null, 'Show State 2', true),
  showState3: flag('palette', null, 'Show State 3', true),
};

const stateSpecs = (state) => {
  const d = MATERIAL_STATE_DEFAULTS[state];
  const group = `State ${state}`;
  const prefix = `state${state}`;
  const roll = {
    1: { metalness: [0, 0.3], roughness: [0.55, 1] },
    2: { metalness: [0.2, 0.9], roughness: [0.3, 0.9] },
    3: { metalness: [0, 0.5], roughness: [0.1, 0.6] },
  }[state];
  return {
    [`${prefix}Roughness`]: rolled(
      'material',
      roll.roughness,
      num('materials', group, 'Roughness', d.roughness, 0, 1, 0.01)
    ),
    [`${prefix}Metalness`]: rolled(
      'material',
      roll.metalness,
      num('materials', group, 'Metalness', d.metalness, 0, 1, 0.01)
    ),
    [`${prefix}EmissiveColor`]: inFacet(
      'material',
      color('materials', group, 'Emissive Color', d.emissiveColor)
    ),
    [`${prefix}EmissiveIntensity`]: inFacet(
      'material',
      num(
        'materials',
        group,
        'Emissive Intensity',
        d.emissiveIntensity,
        0,
        10,
        0.05
      )
    ),
    [`${prefix}Clearcoat`]: inFacet(
      'material',
      num('materials', group, 'Clearcoat', d.clearcoat, 0, 1, 0.01)
    ),
    [`${prefix}ClearcoatRoughness`]: inFacet(
      'material',
      num(
        'materials',
        group,
        'Clearcoat Roughness',
        d.clearcoatRoughness,
        0,
        1,
        0.01
      )
    ),
    [`${prefix}Transmission`]: inFacet(
      'material',
      num(
        'materials',
        group,
        'Transmission (glass)',
        d.transmission,
        0,
        1,
        0.01
      )
    ),
    [`${prefix}Ior`]: inFacet(
      'material',
      num('materials', group, 'IOR', d.ior, 1, 2.5, 0.01)
    ),
    [`${prefix}Thickness`]: inFacet(
      'material',
      num('materials', group, 'Thickness', d.thickness, 0, 5, 0.05)
    ),
  };
};
const MATERIALS = Object.assign({}, ...STATES.map(stateSpecs));

const LIGHTING = {
  lightAzimuth: rolled(
    'atmosphere',
    [0, 360],
    num('lighting', null, 'Key Azimuth', 25.65, 0, 360, 0.01)
  ),
  lightElevation: rolled(
    'atmosphere',
    [18, 72],
    num('lighting', null, 'Key Elevation', 68.7, 0, 90, 0.01)
  ),
  keyLightIntensity: rolled(
    'atmosphere',
    [1.6, 3.4],
    num('lighting', null, 'Key Intensity', 2.41, 0, 10, 0.01)
  ),
  ambientIntensity: rolled(
    'atmosphere',
    [0.15, 0.5],
    num('lighting', null, 'Ambient (Sky) Intensity', 0.3, 0, 2, 0.01)
  ),
  rimLightIntensity: rolled(
    'atmosphere',
    [0.25, 0.9],
    num('lighting', null, 'Rim Intensity', 0.49, 0, 5, 0.01)
  ),
  bounceLightIntensity: inFacet(
    'atmosphere',
    num('lighting', null, 'Bounce Intensity', 0.07, 0, 5, 0.01)
  ),
  shadowIntensity: inFacet(
    'atmosphere',
    num('lighting', null, 'Shadow Intensity', 1.08, 0, 2, 0.01)
  ),
  shadowSoftness: inFacet(
    'atmosphere',
    num('lighting', null, 'Shadow Softness', 2.6, 0, 10, 0.01)
  ),
  exposure: inFacet(
    'atmosphere',
    num('lighting', null, 'Exposure', 0.7, 0, 3, 0.01)
  ),
  backgroundColor: inFacet(
    'atmosphere',
    color('lighting', null, 'Background Color', '#03040a')
  ),
  envIntensity: inFacet(
    'atmosphere',
    num('lighting', null, 'Environment Intensity', 0.3, 0, 3, 0.01)
  ),
  envEnabled: inFacet(
    'atmosphere',
    flag('lighting', null, 'Environment Enabled', true)
  ),
};

const godraysOn = { godraysEnabled: [true] };
const godrays = (spec) => ({ ...spec, when: godraysOn });
const GODRAYS = {
  godraysEnabled: inFacet(
    'atmosphere',
    flag('godrays', null, 'Enabled', false)
  ),
  godraysColor: godrays(
    inFacet('atmosphere', color('godrays', null, 'Light Color', '#ffd27a'))
  ),
  godraysPosition: {
    default: { x: 0, y: 0, z: 0 },
    group: null,
    help: 'Light position in world units',
    label: 'Light Position',
    scene: true,
    sceneOnly: true,
    scope: 'shared',
    section: 'godrays',
    type: 'json',
    when: godraysOn,
  },
  godraysIntensity: godrays(
    rolled(
      'atmosphere',
      [12, 28],
      num('godrays', null, 'Light Intensity', 20, 0, 40, 0.1)
    )
  ),
  godraysBlendColor: godrays(
    inFacet('atmosphere', color('godrays', null, 'Blend Color', '#ffd27a'))
  ),
  godraysVolumeSize: godrays(
    num('godrays', null, 'Volume Size', 80, 2, 80, 0.5)
  ),
  godraysDensity: godrays(
    rolled(
      'atmosphere',
      [0.5, 0.9],
      num('godrays', null, 'Density', 0.7, 0, 1, 0.01)
    )
  ),
  godraysMaxDensity: godrays(
    num('godrays', null, 'Max Density', 0.5, 0, 1, 0.01)
  ),
  godraysDistanceAttenuation: godrays(
    num('godrays', null, 'Distance Attenuation', 2, 0, 5, 0.01)
  ),
  godraysRaymarchSteps: godrays(
    num('godrays', null, 'Raymarch Steps', 60, 24, 250, 1)
  ),
  godraysBlur: godrays(flag('godrays', null, 'Blur', false)),
  godraysEdgeRadius: godrays(num('godrays', null, 'Edge Radius', 2, 0, 5, 1)),
  godraysEdgeStrength: godrays(
    num('godrays', null, 'Edge Strength', 2, 0, 5, 0.1)
  ),
};

const RENDER = {
  batch: standard.batch(),
  out: standard.out('fractal-automata'),
  width: standard.width(),
  height: standard.height(),
  pixelRatio: standard.pixelRatio({ default: 1 }),
  count: standard.count('structures'),
  png: standard.png(),
  webp: standard.webp(),
  views: standard.views(VIEWS, 'hero'),

  fov: standard.fov(45, {
    help: 'Vertical field of view in degrees (the scene camera’s is 45)',
  }),
  margin: standard.margin(
    0.06,
    'Space around the structure, as a share of the frame'
  ),
  samples: standard.samples(),
  shadows: standard.shadows(),

  keep: standard.keep([
    'structure',
    'detail',
    'color',
    'material',
    'atmosphere',
  ]),
  base: standard.base('structure'),
  palettes: standard.palettes('colour'),

  mode: standard.mode(
    VIDEO_MODES,
    'turntable',
    'turntable: orbit the structure; keyLight: the key light sweeps once round; godrayLight: the godray light orbits the structure (forces godrays on)'
  ),
  view: standard.view(VIEWS, 'hero'),
  fps: standard.fps(),
  hold: standard.hold(12, 'Seconds per structure', { min: 1 }),
  turns: standard.turns('piece', {
    help: 'Revolutions per structure: the turntable’s camera, the godray light’s orbit',
  }),
};

export const RENDER_OPTIONS = {
  ...FIELD,
  ...DETAIL,
  ...PALETTE,
  ...MATERIALS,
  ...LIGHTING,
  ...GODRAYS,
  ...RENDER,
  ...standard.overlayOptions(),
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': {
    count: 1,
    height: 1920,
    out: 'output/fractal-automata.mp4',
  },
  workbench: { count: 4 },
};

const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  sectionLabels: {
    detail: 'voxel detail',
    field: 'voxel field',
    lighting: 'light',
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
