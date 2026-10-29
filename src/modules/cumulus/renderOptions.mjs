import createOptionSchema, {
  choice,
  color,
  flag,
  inFacet,
  num,
  rolled,
  sceneOnly,
  spec,
  standard,
  still,
} from '../optionSchema/index.mjs';

export const HALOS = [
  'rings',
  'gradient',
  'atomic',
  'network',
  'record',
  'plate',
  'crtStaticRing',
  'solarSystem',
];
export const HALO_LABELS = {
  rings: 'Rings',
  gradient: 'Gradient rings',
  atomic: 'Atomic',
  network: 'Network',
  record: 'Record',
  plate: 'Plate',
  crtStaticRing: 'Static',
  solarSystem: 'Universal',
};
export const VIEWS = ['hero', 'front', 'profile', 'back'];
const AXES = ['x', 'y', 'z'];
const vec = (section, group, label, value, extra = {}) =>
  spec('json', section, group, label, value, {
    help: `${label} as JSON, e.g. ${JSON.stringify(value)}`,
    placeholder: 'JSON',
    vector: AXES,
    ...extra,
  });
const halo = (item) => rolled('halo', null, item);
const stage = (item) => inFacet('stage', item);
const anatomy = (item) => inFacet('anatomy', item);
const CRANIUM_BONES = {
  showCranium: true,
  showLeftZygomatic: true,
  showOccipital: true,
  showRightLacrimal: true,
  showRightMaxilla: true,
  showRightNasal: true,
  showRightPalatine: true,
  showRightParietal: false,
  showRightTemporal: false,
  showRightZygomatic: true,
  showSphenoid: true,
  showTeeth: false,
  showVomer: true,
  showEthmoid: true,
  showFrontal: true,
  showInferiorConchae: true,
  showLeftLacrimal: true,
  showLeftMaxilla: true,
  showLeftNasal: true,
  showLeftPalatine: true,
  showLeftParietal: false,
  showLeftTemporal: false,
};
const MANDIBLE_BONES = {
  showMandible: false,
  showMandibleBone: true,
  showMandibleTeeth: true,
};
const boneLabel = (key) =>
  key
    .slice('show'.length)
    .replace(/([a-z])([A-Z])/gu, '$1 $2')
    .replace('Mandible Teeth', 'Bottom Teeth');
const bones = (flags, group) =>
  Object.fromEntries(
    Object.entries(flags).map(([key, value]) => [
      key,
      anatomy(
        flag('skull', group, boneLabel(key), value, {
          when: { skullVisible: [true] },
        })
      ),
    ])
  );
export const RENDER_OPTIONS = {
  ringsPosition: halo(
    vec('halo', 'rings.Appearance', 'Position', {
      x: 0,
      y: 1.5,
      z: -1,
    })
  ),
  ringsRotation: halo(
    vec('halo', 'rings.Appearance', 'Rotation', { x: 45, y: 0, z: 0 })
  ),
  recordPosition: halo(
    vec('halo', 'record.Appearance', 'Position', {
      x: 0,
      y: 1.5,
      z: -1,
    })
  ),
  recordRotation: halo(
    vec('halo', 'record.Appearance', 'Rotation', { x: 45, y: 0, z: 0 })
  ),
  networkPosition: halo(
    vec('halo', 'network.Appearance', 'Position', {
      x: 0,
      y: 1.5,
      z: -1,
    })
  ),
  networkRotation: halo(
    vec('halo', 'network.Appearance', 'Rotation', {
      x: 45,
      y: 0,
      z: 0,
    })
  ),
  atomPosition: halo(
    vec('halo', 'atom.Appearance', 'Position', { x: 0, y: 1.5, z: -1 })
  ),
  atomRotation: halo(
    vec('halo', 'atom.Appearance', 'Rotation', { x: 45, y: 0, z: 0 })
  ),
  platePosition: halo(
    vec('halo', 'plate.Appearance', 'Position', {
      x: 0,
      y: 1.5,
      z: -1,
    })
  ),
  plateRotation: halo(
    vec('halo', 'plate.Appearance', 'Rotation', { x: 45, y: 0, z: 1 })
  ),
  crtStaticRingPosition: halo(
    vec('halo', 'crtStaticRing.Appearance', 'Position', {
      x: 0,
      y: 1.5,
      z: -1,
    })
  ),
  crtStaticRingRotation: halo(
    vec('halo', 'crtStaticRing.Appearance', 'Rotation', {
      x: 45,
      y: 0,
      z: 0,
    })
  ),
  solarSystemPosition: halo(
    vec('halo', 'solarSystem.Appearance', 'Position', {
      x: 0,
      y: 0.75,
      z: 0,
    })
  ),
  solarSystemRotation: halo(
    vec('halo', 'solarSystem.Appearance', 'Rotation', {
      x: 0,
      y: 0,
      z: 0,
    })
  ),
  ringsVisible: rolled('halo', null, flag('halo', 'Rings', 'Visible', true)),
  ringsScale: rolled(
    'halo',
    null,
    num('halo', 'Rings', 'Scale', 0.9, 0.01, 20, 0.01)
  ),
  ringsStyle: rolled(
    'halo',
    null,
    choice('halo', 'Rings', 'Style', ['default', 'gradient'], 'default', {})
  ),
  ringsInnerRadius: rolled(
    'halo',
    [0.3, 0.8],
    num('halo', 'Rings', 'Inner Radius', 0.5, 0.1, 2, 0.1)
  ),
  ringsOuterRadius: rolled(
    'halo',
    [1.7, 2.3],
    num('halo', 'Rings', 'Outer Radius', 2, 0.5, 20, 0.1)
  ),
  ringsPalette: rolled(
    'color',
    null,
    spec('string', 'halo', 'Rings', 'Palette', 'None')
  ),
  ringsPaletteExact: rolled(
    'color',
    null,
    flag('halo', 'Rings', 'Exact Colors', false)
  ),
  ringsStart: rolled(
    'color',
    null,
    color('halo', 'Rings', 'Start Color', '#FFFFFF')
  ),
  ringsEnd: rolled(
    'color',
    null,
    color('halo', 'Rings', 'End Color', '#000000')
  ),
  ringsSteps: rolled(
    'halo',
    [4, 24],
    num('halo', 'Rings', 'Steps', 8, 2, 64, 1)
  ),
  ringsSm: rolled(
    'halo',
    [0.05, 0.5],
    num('halo', 'Rings', 'SM Width', 0.1, 0.01, 3, 0.01)
  ),
  ringsMed: rolled(
    'halo',
    [0.4, 2],
    num('halo', 'Rings', 'MED Width', 1, 0.1, 3, 0.1)
  ),
  ringsLg: rolled(
    'halo',
    [0.8, 3],
    num('halo', 'Rings', 'LG Width', 2, 0.1, 3, 0.1)
  ),
  ringsXl: rolled(
    'halo',
    [1, 5],
    num('halo', 'Rings', 'XL Width', 3, 0.1, 5, 0.1)
  ),
  ringsSilver: rolled(
    'color',
    null,
    color('halo', 'Rings', 'Silver', '#c1c1c1')
  ),
  ringsWhite: rolled('color', null, color('halo', 'Rings', 'White', '#ffffff')),
  ringsBlack: rolled('color', null, color('halo', 'Rings', 'Black', '#000000')),
  ringsBlue: rolled('color', null, color('halo', 'Rings', 'Blue', '#0023ff')),
  ringsLightblue: rolled(
    'color',
    null,
    color('halo', 'Rings', 'Light Blue', '#69d8ff')
  ),
  recordVisible: rolled('halo', null, flag('halo', null, 'Visible', true)),
  recordScale: rolled(
    'halo',
    null,
    num('halo', null, 'Scale', 12, 0.01, 20, 0.01)
  ),
  recordSideA: rolled('halo', null, flag('halo', null, 'Side', true)),
  networkVisible: rolled(
    'halo',
    null,
    flag('halo', 'Network', 'Visible', true)
  ),
  networkScale: rolled(
    'halo',
    null,
    num('halo', 'Network', 'Scale', 0.53, 0.01, 20, 0.01)
  ),
  networkPointColor: rolled(
    'color',
    null,
    color('halo', 'Network', 'Point Color', '#ff0000')
  ),
  networkLineColor: rolled(
    'color',
    null,
    color('halo', 'Network', 'Line Color', '#000000')
  ),
  networkPointSize: rolled(
    'halo',
    [0.5, 10],
    num('halo', 'Network', 'Point Size', 2.5, 0.5, 10, 0.5)
  ),
  networkParticleCount: rolled(
    'halo',
    [80, 350],
    num('halo', 'Network', 'Particles', 500, 50, 1000, 50)
  ),
  networkMaxDistance: rolled(
    'halo',
    [0.1, 2],
    num('halo', 'Network', 'Max Distance', 0.8, 0.1, 2, 0.1)
  ),
  networkAngularSpeed: rolled(
    'motion',
    [0, 3],
    num('halo', 'Network', 'Angular Speed', 0.53, 0, 3, 0.01)
  ),
  networkTimeScale: rolled(
    'halo',
    null,
    num('halo', 'Network', 'Time Scale', 0.4, 0, 2, 0.05)
  ),
  atomVisible: rolled('halo', null, flag('halo', 'Atom', 'Visible', true)),
  atomScale: rolled(
    'halo',
    null,
    num('halo', 'Atom', 'Scale', 1.05, 0.01, 20, 0.01)
  ),
  atomicNumber: rolled(
    'halo',
    [1, 28],
    num('halo', 'Atom', 'Atomic Number', 8, 1, 36, 1)
  ),
  atomAnimateElectrons: rolled(
    'halo',
    null,
    flag('halo', 'Atom', 'Animate Electrons', true)
  ),
  atomShellSpacing: rolled(
    'halo',
    [0.1, 2],
    num('halo', 'Atom', 'Shell Spacing', 0.65, 0.1, 2, 0.05)
  ),
  plateVisible: rolled('halo', null, flag('halo', null, 'Visible', true)),
  plateScale: rolled(
    'halo',
    null,
    num('halo', null, 'Scale', 0.18, 0.01, 20, 0.01)
  ),
  crtStaticRingVisible: rolled(
    'halo',
    null,
    flag('halo', 'Static', 'Visible', true)
  ),
  crtStaticRingScale: rolled(
    'halo',
    null,
    num('halo', 'Static', 'Scale', 0.9, 0.01, 20, 0.01)
  ),
  crtStaticRingInnerRadius: rolled(
    'halo',
    [0.3, 0.7],
    num('halo', 'Static', 'Inner Radius', 0.5, 0.1, 15, 0.01)
  ),
  crtStaticRingOuterRadius: rolled(
    'halo',
    [1.7, 2.3],
    num('halo', 'Static', 'Outer Radius', 2, 0.1, 15, 0.01)
  ),
  crtStaticRingSnowAmount: rolled(
    'halo',
    [0, 1],
    num('halo', 'Static', 'Snow Amount', 1, 0, 1, 0.01)
  ),
  crtStaticRingSnowScale: rolled(
    'halo',
    null,
    num('halo', 'Static', 'Snow Scale', 180, 10, 800, 10)
  ),
  crtStaticRingSnowSpeed: rolled(
    'motion',
    [0, 5],
    num('halo', 'Static', 'Snow Speed', 1, 0, 5, 0.1)
  ),
  crtStaticRingSnowSize: rolled(
    'halo',
    [40, 1000],
    num('halo', 'Static', 'Snow Size', 240, 40, 1000, 20)
  ),
  crtStaticRingSnap: rolled(
    'halo',
    [1, 60],
    num('halo', 'Static', 'Snap', 24, 1, 60, 1)
  ),
  crtStaticRingBandStrength: rolled(
    'halo',
    [0, 1],
    num('halo', 'Static', 'Band Strength', 1, 0, 1, 0.01)
  ),
  crtStaticRingBandSpeed: rolled(
    'motion',
    [0, 3],
    num('halo', 'Static', 'Band Speed', 0.6, 0, 3, 0.1)
  ),
  crtStaticRingBandScale: rolled(
    'halo',
    null,
    num('halo', 'Static', 'Band Scale', 8, 1, 40, 1)
  ),
  crtStaticRingRFStrength: rolled(
    'halo',
    [0, 1],
    num('halo', 'Static', 'RF Strength', 1, 0, 1, 0.01)
  ),
  crtStaticRingRFScale: rolled(
    'halo',
    null,
    num('halo', 'Static', 'RF Scale', 22, 2, 80, 1)
  ),
  crtStaticRingRFSpeed: rolled(
    'motion',
    [0, 3],
    num('halo', 'Static', 'RF Speed', 0.4, 0, 3, 0.1)
  ),
  crtStaticRingCurvature: rolled(
    'halo',
    [0, 0.4],
    num('halo', 'Static', 'Curvature', 0, 0, 0.4, 0.01)
  ),
  crtStaticRingVignette: rolled(
    'halo',
    [0.6, 0.98],
    num('halo', 'Static', 'Vignette', 0.92, 0.6, 0.98, 0.01)
  ),
  solarSystemVisible: rolled(
    'halo',
    null,
    flag('halo', 'Solar system', 'Visible', true)
  ),
  solarSystemScale: rolled(
    'halo',
    null,
    num('halo', 'Solar system', 'Scale', 0.18, 0.01, 2, 0.01)
  ),
  solarSystemOrbitSpeed: rolled(
    'motion',
    [0, 5],
    num('halo', 'Solar system', 'Orbit Speed', 1, 0, 5, 0.01)
  ),
  solarSystemRotationSpeed: rolled(
    'motion',
    [0, 5],
    num('halo', 'Solar system', 'Spin Speed', 1, 0, 5, 0.01)
  ),
  solarSystemShowOrbits: rolled(
    'halo',
    null,
    flag('halo', 'Solar system', 'Show Orbits', true)
  ),
  solarSystemOrbitOpacity: rolled(
    'halo',
    [0, 1],
    num('halo', 'Solar system', 'Orbit Opacity', 0.14, 0, 1, 0.01)
  ),
  solarSystemOrbitColor: rolled(
    'color',
    null,
    color('halo', 'Solar system', 'Orbit Color', '#8ea2ff')
  ),
  solarSystemAsteroidBeltsVisible: rolled(
    'halo',
    null,
    flag('halo', 'Solar system', 'Asteroid Belts', true)
  ),
  solarSystemAsteroidMode: rolled(
    'halo',
    null,
    choice(
      'halo',
      'Solar system',
      'Asteroid Mode',
      ['mesh', 'sprite'],
      'mesh',
      {}
    )
  ),
  solarSystemShadowsEnabled: rolled(
    'halo',
    null,
    flag('halo', 'Solar system', 'Shadows', false)
  ),
  solarSystemSunRadius: rolled(
    'halo',
    [0.1, 1.2],
    num('halo', 'Solar system', 'Sun Radius', 0.48, 0.1, 1.2, 0.01)
  ),
  solarSystemSunSurfaceDetailScale: rolled(
    'halo',
    null,
    num('halo', 'Solar system', 'Surface Detail', 1, 0.25, 2, 0.01)
  ),
  solarSystemSunSurfaceDisplacementScale: rolled(
    'halo',
    null,
    num('halo', 'Solar system', 'Surface Displacement', 0.15, 0.01, 0.35, 0.005)
  ),
  solarSystemSunEmissiveIntensity: rolled(
    'halo',
    [0, 8],
    num('halo', 'Solar system', 'Sun Glow', 2.8, 0, 8, 0.05)
  ),
  solarSystemSunLightIntensity: rolled(
    'halo',
    [0.05, 0.4],
    num('halo', 'Solar system', 'Sun Light', 0.14, 0, 100, 0.01)
  ),
  solarSystemSunLightColor: rolled(
    'color',
    null,
    color('halo', 'Solar system', 'Sun Light Color', '#ffcf37')
  ),
  solarSystemSunLightDecay: rolled(
    'halo',
    [0, 4],
    num('halo', 'Solar system', 'Sun Light Decay', 2, 0, 4, 0.01)
  ),
  haloType: rolled(
    'halo',
    null,
    choice(
      'halo',
      null,
      'Type',
      [
        'rings',
        'atomic',
        'network',
        'record',
        'plate',
        'crtStaticRing',
        'solarSystem',
      ],
      'rings',
      {}
    )
  ),
  animate: rolled('motion', null, flag('motion', null, 'Rotate', true)),
  speed: rolled('motion', [0, 78], num('motion', null, 'RPM', 33, 0, 78, 1)),
  wobble: rolled('motion', null, flag('motion', null, 'Wobble', false)),
  wobbleSpeed: rolled(
    'motion',
    [0, 10],
    num('motion', null, 'Wobble Speed', 1, 0, 10, 0.1)
  ),
  wobbleAngle: rolled(
    'motion',
    [0, 15],
    num('motion', null, 'Wobble Angle', 5, 0, 15, 1)
  ),
  haloSeed: rolled(
    'halo',
    null,
    spec('string', 'halo', null, 'Halo seed', 'cumulus')
  ),
  haloSize: rolled(
    'placement',
    [0.85, 1.12],
    num('placement', null, 'Halo size multiplier', 1, 0.5, 1.5, 0.01)
  ),
  haloTilt: rolled(
    'placement',
    [-10, 10],
    num('placement', null, 'Halo tilt offset', 0, -30, 30, 1)
  ),
  haloHeight: rolled(
    'placement',
    [-0.12, 0.15],
    num('placement', null, 'Halo height offset', 0, -0.5, 0.5, 0.01)
  ),
  paletteName: rolled(
    'color',
    null,
    spec('string', 'color', null, 'Palette', 'None')
  ),
  paletteExact: rolled(
    'color',
    null,
    flag('color', null, 'Exact palette colors', false)
  ),
  backgroundColor: stage(
    color('stage', 'Environment', 'Background', '#ffffff')
  ),
  environmentIntensity: stage(
    num('stage', 'Environment', 'Env intensity', 0, 0, 2, 0.01)
  ),
  ambientIntensity: stage(
    num('stage', 'Lighting.Ambient', 'Ambient intensity', 0.12, 0, 2, 0.01)
  ),
  plPosition: stage(
    vec('stage', 'Lighting.Point Light', 'Key position', { x: 3, y: 3, z: 5 })
  ),
  plDecay: stage(
    num('stage', 'Lighting.Point Light', 'Key decay', 0, -10, 10, 0.1)
  ),
  plDistance: stage(
    num('stage', 'Lighting.Point Light', 'Key distance', -1, -10, 10, 0.1)
  ),
  plIntensity: stage(
    num('stage', 'Lighting.Point Light', 'Key intensity', 0.8, 0, 20, 0.1)
  ),
  plCastShadow: stage(
    flag('stage', 'Lighting.Point Light', 'Key casts shadow', true)
  ),
  spotlightEnabled: stage(
    flag('stage', 'Lighting.Spotlight', 'Spotlight', false)
  ),
  spotlightPosition: stage(
    vec(
      'stage',
      'Lighting.Spotlight',
      'Spotlight position',
      { x: -4.5, y: 2.4, z: -5 },
      { when: { spotlightEnabled: [true] } }
    )
  ),
  spotlightAngle: stage(
    num(
      'stage',
      'Lighting.Spotlight',
      'Spotlight angle',
      0.4,
      0.05,
      1.5,
      0.01,
      {
        when: { spotlightEnabled: [true] },
      }
    )
  ),
  spotlightPenumbra: stage(
    num('stage', 'Lighting.Spotlight', 'Spotlight penumbra', 1, 0, 1, 0.01, {
      when: { spotlightEnabled: [true] },
    })
  ),
  spotlightIntensity: stage(
    num(
      'stage',
      'Lighting.Spotlight',
      'Spotlight intensity',
      1.35,
      0,
      10,
      0.01,
      {
        when: { spotlightEnabled: [true] },
      }
    )
  ),
  spotlightColor: stage(
    color('stage', 'Lighting.Spotlight', 'Spotlight colour', '#d6e5ff', {
      when: { spotlightEnabled: [true] },
    })
  ),
  spotlightCastShadow: stage(
    flag('stage', 'Lighting.Spotlight', 'Spotlight casts shadow', false, {
      when: { spotlightEnabled: [true] },
    })
  ),
  floatSpeed: stage(
    num('animation', 'Animations', 'Float speed', 0.5, 0, 1, 0.01)
  ),
  haloScrollEnabled: sceneOnly(
    spec('boolean', 'animation', 'Animations', 'Halo scroll', false)
  ),
  haloScrollInterval: sceneOnly(
    num('animation', 'Animations', 'Scroll interval (s)', 2, 0.5, 10, 0.1)
  ),
  bloomEnabled: stage(flag('post', 'Post.Bloom', 'Bloom', true)),
  bloomIntensity: stage(
    num('post', 'Post.Bloom', 'Bloom intensity', 1.1, 0, 4, 0.01, {
      when: { bloomEnabled: [true] },
    })
  ),
  bloomLuminanceThreshold: stage(
    num('post', 'Post.Bloom', 'Bloom threshold', 0.3, 0, 1, 0.01, {
      when: { bloomEnabled: [true] },
    })
  ),
  bloomLuminanceSmoothing: stage(
    num('post', 'Post.Bloom', 'Bloom smoothing', 0.28, 0, 1, 0.01, {
      when: { bloomEnabled: [true] },
    })
  ),
  bloomRadius: stage(
    num('post', 'Post.Bloom', 'Bloom radius', 0.68, 0, 1, 0.01, {
      when: { bloomEnabled: [true] },
    })
  ),
  cloudVisible: anatomy(flag('cloud', 'Cloud Appearance', 'Cloud', true)),
  cloudPosition: anatomy(
    vec(
      'cloud',
      'Cloud Appearance',
      'Cloud position',
      { x: 0, y: 0.75, z: 0 },
      { when: { cloudVisible: [true] } }
    )
  ),
  cloudRotation: anatomy(
    vec(
      'cloud',
      'Cloud Appearance',
      'Cloud rotation',
      { x: 0, y: 0, z: 0 },
      { when: { cloudVisible: [true] } }
    )
  ),
  cloudScale: anatomy(
    num('cloud', 'Cloud Appearance', 'Cloud scale', 0.15, 0.01, 1, 0.01, {
      when: { cloudVisible: [true] },
    })
  ),
  cloudSeed: anatomy(
    num('cloud', null, 'Cloud seed', 42, 1, 100, 1, {
      when: { cloudVisible: [true] },
    })
  ),
  cloudSegments: anatomy(
    num('cloud', null, 'Cloud segments', 50, 1, 80, 1, {
      when: { cloudVisible: [true] },
    })
  ),
  cloudVolume: anatomy(
    num('cloud', null, 'Cloud volume', 6, 0, 100, 0.1, {
      when: { cloudVisible: [true] },
    })
  ),
  cloudOpacity: anatomy(
    num('cloud', null, 'Cloud opacity', 0.8, 0, 1, 0.01, {
      when: { cloudVisible: [true] },
    })
  ),
  cloudFade: anatomy(
    num('cloud', null, 'Cloud fade', 0, 0, 400, 1, {
      when: { cloudVisible: [true] },
    })
  ),
  cloudGrowth: anatomy(
    num('cloud', null, 'Cloud growth', 4, 0, 20, 1, {
      when: { cloudVisible: [true] },
    })
  ),
  cloudSpeed: anatomy(
    num('cloud', null, 'Cloud speed', 0.5, 0, 1, 0.01, {
      when: { cloudVisible: [true] },
    })
  ),
  cloudBoundsX: anatomy(
    num('cloud', null, 'Cloud bounds X', 6, 0, 10, 1, {
      when: { cloudVisible: [true] },
    })
  ),
  cloudBoundsY: anatomy(
    num('cloud', null, 'Cloud bounds Y', 1, 0, 10, 1, {
      when: { cloudVisible: [true] },
    })
  ),
  cloudBoundsZ: anatomy(
    num('cloud', null, 'Cloud bounds Z', 1, 0, 10, 1, {
      when: { cloudVisible: [true] },
    })
  ),
  cloudColor: anatomy(
    color('cloud', null, 'Cloud colour', '#bababa', {
      when: { cloudVisible: [true] },
    })
  ),
  skullVisible: anatomy(flag('skull', 'Skull Appearance', 'Skull', true)),
  skullPosition: anatomy(
    vec(
      'skull',
      'Skull Appearance',
      'Skull position',
      { x: 0, y: 0, z: 0 },
      { when: { skullVisible: [true] } }
    )
  ),
  skullRotation: anatomy(
    vec(
      'skull',
      'Skull Appearance',
      'Skull rotation',
      { x: 0, y: 0, z: 0 },
      { when: { skullVisible: [true] } }
    )
  ),
  skullScale: anatomy(
    num('skull', 'Skull Appearance', 'Skull scale', 0.1, 0.01, 1, 0.01, {
      when: { skullVisible: [true] },
    })
  ),
  ...bones(CRANIUM_BONES, 'Bones.Cranium'),
  ...bones(MANDIBLE_BONES, 'Bones.Mandible'),
  femurVisible: anatomy(flag('femur', 'Appearance', 'Femur', true)),
  femurPosition: anatomy(
    vec(
      'femur',
      'Appearance',
      'Femur position',
      { x: 0.3, y: 0, z: -0.6 },
      { when: { femurVisible: [true] } }
    )
  ),
  femurRotation: anatomy(
    vec(
      'femur',
      'Appearance',
      'Femur rotation',
      { x: -8, y: 173, z: -26 },
      { when: { femurVisible: [true] } }
    )
  ),
  femurScale: anatomy(
    num('femur', 'Appearance', 'Femur scale', 0.75, 0.1, 1, 0.01, {
      when: { femurVisible: [true] },
    })
  ),
  censorPanelVisible: anatomy(
    flag('censor', 'Appearance', 'Censor panel', true)
  ),
  censorPanelPosition: anatomy(
    vec(
      'censor',
      'Appearance',
      'Censor position',
      { x: -1, y: 2.2, z: -0.25 },
      { when: { censorPanelVisible: [true] } }
    )
  ),
  censorPanelRotation: anatomy(
    vec(
      'censor',
      'Appearance',
      'Censor rotation',
      { x: 45, y: 0, z: 0 },
      { when: { censorPanelVisible: [true] } }
    )
  ),
  censorPanelScale: anatomy(
    num('censor', 'Appearance', 'Censor scale', 2.2, 0.1, 5, 0.05, {
      when: { censorPanelVisible: [true] },
    })
  ),
  censorPixelSize: anatomy(
    num('censor', 'Censor', 'Pixel size', 20, 1, 64, 1, {
      when: { censorPanelVisible: [true] },
    })
  ),
  censorRefraction: anatomy(
    num('censor', 'Censor', 'Refraction', 0, 0, 0.15, 0.005, {
      when: { censorPanelVisible: [true] },
    })
  ),
  censorClipOffset: anatomy(
    num('censor', 'Censor', 'Clip offset', 2, -2, 2, 0.01, {
      when: { censorPanelVisible: [true] },
    })
  ),
  cameraAzimuth: rolled(
    'camera',
    [-60, 30],
    num('camera', null, 'Camera azimuth', -38.5, -180, 180, 0.5, {
      help: 'Degrees round the skull from its face (hero only)',
    })
  ),
  cameraElevation: rolled(
    'camera',
    [6, 34],
    num('camera', null, 'Camera elevation', 19, -80, 80, 0.5, {
      help: 'Degrees above the skull',
    })
  ),
  cameraZoom: rolled(
    'camera',
    [0.92, 1.2],
    num('camera', null, 'Camera zoom', 1, 0.3, 3, 0.01, {
      help: 'Above 1 crops in; below 1 leaves room round the frame',
    })
  ),
  cameraRoll: rolled(
    'camera',
    [-5, 5],
    num('camera', null, 'Camera roll', 0, -45, 45, 1, {
      help: 'Degrees the hero frame tilts',
    })
  ),
  cameraShiftY: rolled(
    'camera',
    [-0.06, 0.06],
    num('camera', null, 'Camera shift', 0, -0.5, 0.5, 0.01, {
      help: 'Moves the subject up (+) or down in the hero frame, in frame heights',
    })
  ),
  cameraPanX: num('camera', null, 'Camera target X offset', 0, -20, 20, 0.01),
  cameraPanY: num('camera', null, 'Camera target Y offset', 0, -20, 20, 0.01),
  cameraPanZ: num('camera', null, 'Camera target Z offset', 0, -20, 20, 0.01),
  frameTime: num('motion', null, 'Frame time (seconds)', 0, 0, 120, 0.01),
  halos: spec('string', 'halo', null, 'Included halos', HALOS.join(','), {
    scene: false,
  }),
  batch: standard.batch(),
  out: standard.out('cumulus'),
  count: standard.count('thoughts'),
  width: standard.width(),
  height: standard.height(),
  pixelRatio: standard.pixelRatio(),
  webp: standard.webp(),
  svg: standard.svg(
    'Geometry outlines, hidden lines and tone hatching in pen layers'
  ),
  capture: standard.capture(),
  transparent: standard.transparent(),
  plotWidthMm: standard.plotWidthMm(),
  svgColors: standard.svgColors(),
  svgAnatomyInk: still({
    type: 'color',
    section: 'svg',
    label: 'Skull and bone outline ink',
    default: '#222222',
    help: 'A readable outline ink for the fixed anatomy',
  }),
  svgMonochrome: still({
    type: 'boolean',
    section: 'svg',
    label: 'Black ink only',
    default: false,
    help: 'Use black ink for all lines and shading',
  }),
  svgPaper: still(
    color('svg', null, 'SVG paper', '#ffffff', {
      help: 'Page colour behind the lines: an SVG background style, never a plotted shape',
    })
  ),
  svgPaperDistance: still(
    num('svg', null, 'SVG paper distance', 20, 0, 60, 1, {
      help: 'Inks closer than this (CIELAB ΔE) to the paper are darkened until they clear it, so pale parts keep a pen that shows',
    })
  ),
  svgOcclusion: standard.svgOcclusion('Remove lines hidden by nearer surfaces'),
  svgSilhouette: still(
    flag('svg', null, 'SVG silhouette', true, {
      help: 'Trace the outline of the subject as the camera sees it',
    })
  ),
  svgContours: still(
    flag('svg', null, 'SVG contours', true, {
      help: 'Trace where a halo or cloud surface turns away from the camera inside the outline',
    })
  ),
  svgEdges: still(
    flag('svg', null, 'SVG creases', true, {
      help: 'Trace sharp halo and panel edges',
    })
  ),
  svgCreaseAngle: still(
    num('svg', null, 'SVG crease angle', 35, 5, 120, 1, {
      help: 'Degrees two faces must bend by for their edge to count as a crease',
      when: { svgEdges: [true] },
    })
  ),
  svgMinLength: still(
    num('svg', null, 'SVG min length', 3, 0, 40, 0.5, {
      help: 'Drop traced lines shorter than this in output px',
      placeholder: 'PX',
    })
  ),
  svgAnatomyContours: still(
    flag('svg', null, 'SVG bone contours', true, {
      help: 'Trace where the skull and femur turn away from the camera',
    })
  ),
  svgAnatomyEdges: still(
    flag('svg', null, 'SVG bone creases', true, {
      help: 'Trace sharp edges of the scanned skull and femur',
    })
  ),
  svgAnatomyCreaseAngle: still(
    num('svg', null, 'SVG bone crease angle', 70, 5, 150, 1, {
      help: 'Degrees the scanned bone must fold by for a crease; low values speckle',
      when: { svgAnatomyEdges: [true] },
    })
  ),
  svgAnatomyMinLength: still(
    num('svg', null, 'SVG bone min length', 8, 0, 60, 0.5, {
      help: 'Drop bone lines shorter than this in output px',
      placeholder: 'PX',
    })
  ),
  svgNodes: still(
    choice('svg', null, 'SVG nodes', ['dots', 'none'], 'dots', {
      help: 'Network points: dots draws a circle at their rendered size, none leaves them out',
    })
  ),
  svgTexture: still(
    flag('svg', null, 'SVG texture contours', false, {
      help: "Contour the render's brightness inside the subject: static, the sun, record grooves",
    })
  ),
  svgTextureLevels: still(
    num('svg', null, 'SVG texture levels', 6, 1, 30, 1, {
      help: 'How many equal-area brightness contours the texture layer draws',
      when: { svgTexture: [true] },
    })
  ),
  svgStroke: standard.svgStroke({
    default: null,
    help: 'Stroke width in output px; empty uses the pen width, 0 draws hairlines',
    nullable: true,
  }),
  svgPenMm: standard.svgPenMm(),
  svgShading: standard.svgShading(
    'Tone traced from the frozen frame',
    'crosshatch'
  ),
  svgShadeSpacing: standard.svgShadeSpacing(),
  svgShadeGamma: standard.svgShadeGamma(),
  svgShadeAngle: standard.svgShadeAngle(),
  views: standard.views(VIEWS, 'hero'),
  fov: standard.fov(20),
  margin: standard.margin(0.08, 'Frame padding'),
  samples: standard.samples(),
  shadows: standard.shadows(),
  keep: standard.keep(['halo', 'placement', 'color', 'motion']),
  base: standard.base('thought'),
  palettes: standard.palettes('halo'),
  mode: standard.mode(
    ['montage', 'motion', 'turntable'],
    'montage',
    'Montage holds each thought; motion animates its halo; turntable orbits it'
  ),
  view: standard.view(VIEWS, 'hero'),
  fps: standard.fps(),
  hold: standard.hold(3, 'Seconds per thought'),
  turns: standard.turns('thought'),
  orbit: standard.orbit(0, 'Camera drift in degrees'),
  ...standard.videoFormats(),
  ...standard.overlayOptions(),
};
const HALO_PREFIXES = {
  rings: 'rings',
  record: 'record',
  network: 'network',
  atom: 'atomic',
  atomic: 'atomic',
  plate: 'plate',
  crtStaticRing: 'crtStaticRing',
  solarSystem: 'solarSystem',
};
Object.entries(RENDER_OPTIONS).forEach(([key, item]) => {
  const prefix = Object.keys(HALO_PREFIXES).find((name) =>
    key.startsWith(name)
  );
  if (prefix)
    Object.assign(item, { when: { haloType: [HALO_PREFIXES[prefix]] } });
  if (key.startsWith('record')) Object.assign(item, { group: 'Record' });
  if (key.startsWith('plate')) Object.assign(item, { group: 'Plate' });
});
export function allowedHalos(value, fail = (message) => new Error(message)) {
  const names = String(value)
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  if (!names.length || names.some((name) => !HALOS.includes(name)))
    throw fail(`Choose at least one halo from ${HALOS.join(', ')}`);
  return [...new Set(names)];
}
const schema = createOptionSchema({
  options: RENDER_OPTIONS,
  views: VIEWS,
  surfaceDefaults: {
    workbench: { count: 6 },
    'cli-video': { out: 'output/cumulus.mp4', count: 3 },
  },
  sectionLabels: {
    animation: 'animation',
    censor: 'censor panel',
    cloud: 'cloud',
    femur: 'femur',
    post: 'bloom',
    skull: 'skull',
    stage: 'stage & lighting',
  },
  validate(kind, options, fail) {
    allowedHalos(options.halos, fail);
    if (options.ringsOuterRadius <= options.ringsInnerRadius)
      throw fail('Rings outer radius must exceed inner radius');
    if (options.crtStaticRingOuterRadius <= options.crtStaticRingInnerRadius)
      throw fail('Static outer radius must exceed inner radius');
  },
});
export const {
  SCENE_KEYS,
  LEVA_KEYS,
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
