// Every knob CandleCLI, its Live tab and the Burning At Both Ends scene
// accept, declared once (docs/candle-pipeline.md). A generation is one
// candle burning at both ends: its form (profile, crater, rim, drips, wax),
// its wick, how it burns (flame system and state) and its smoke.
// Dependency-free `.mjs` so plain Node and Vite's config loader can import it.
import createOptionSchema, {
  choice,
  color,
  flag,
  inFacet,
  num,
  rolled,
  sceneOnly,
  standard,
} from '../optionSchema/index.mjs';

export const PROFILES = [
  'pillar',
  'spindle',
  'waisted',
  'twisted',
  'fluted',
  'faceted',
];
export const FLAMES = ['sim', 'shader', 'slices', 'out'];
export const FLAME_STATES = ['calm', 'flicker', 'gutter', 'breeze', 'sooty'];
export const EMBER_STATES = ['snuffed', 'smoulder', 'cold'];
export const SMOKES = ['curl', 'billboard', 'ribbon', 'none'];
export const FLOORS = ['reflect', 'matte', 'none'];
export const LOOKS = ['realistic', 'cartoon', 'clay'];
export const VIEWS = ['hero', 'front', 'end', 'low', 'high'];
export const VIDEO_MODES = ['burn', 'snuff', 'montage', 'turntable'];
export const SVG_STYLES = ['slices', 'sections', 'grid', 'none'];

// Degrees round the candle (azimuth from +z toward +x) and above it. `end`
// frames the top end alone, close in on its flame.
export const VIEW_ANGLES = {
  end: { azimuth: 22, elevation: 18 },
  front: { azimuth: 0, elevation: 3 },
  hero: { azimuth: 28, elevation: 12 },
  high: { azimuth: 35, elevation: 48 },
  low: { azimuth: 14, elevation: -14 },
};

const lit = { flame: ['sim', 'shader', 'slices'] };
const sim = { flame: ['sim'] };
const shader = { flame: ['shader'] };
const curl = { smoke: ['curl'] };
const billboard = { smoke: ['billboard'] };
const ribbon = { smoke: ['ribbon'] };
const profiled = { profile: PROFILES.filter((p) => p !== 'pillar') };
const counted = { profile: ['twisted', 'fluted', 'faceted'] };

const CANDLE = {
  formSeed: rolled(
    'candle',
    [0, 99999],
    num('candle', null, 'Form seed', 1337, 0, 99999, 1, {
      help: 'Seeds the rim, the drips and the wax buildup',
    })
  ),
  candleHeight: rolled(
    'candle',
    [4.5, 7.5],
    num('candle', null, 'Height', 6, 2, 10, 0.05)
  ),
  radius: rolled(
    'candle',
    [0.3, 0.55],
    num('candle', null, 'Radius', 0.4, 0.15, 1, 0.01)
  ),
  tilt: rolled(
    'candle',
    [0, 24],
    num('candle', null, 'Tilt', 15, -45, 45, 0.5, {
      help: 'Degrees the candle leans in the view plane',
    })
  ),
  profile: inFacet(
    'candle',
    choice('candle', 'Profile', 'Profile', PROFILES, 'pillar', {
      help: 'pillar: a plain cylinder; spindle: swells at the middle; waisted: pinched at the middle; twisted: a rope twist; fluted: vertical grooves; faceted: a polygon section',
    })
  ),
  profileAmount: rolled(
    'candle',
    [0.35, 1],
    num('candle', 'Profile', 'Amount', 0.6, 0, 1, 0.01, { when: profiled })
  ),
  profileCount: rolled(
    'candle',
    [4, 10],
    num('candle', 'Profile', 'Count', 6, 3, 16, 1, {
      help: 'Lobes of a twist, flutes, or facets',
      when: counted,
    })
  ),
  profileTwist: rolled(
    'candle',
    [0.6, 2.5],
    num('candle', 'Profile', 'Turns', 1.2, 0, 6, 0.05, {
      help: 'Turns the twist makes end to end',
      when: { profile: ['twisted'] },
    })
  ),
  burnDepth: rolled(
    'candle',
    [0.12, 0.5],
    num('candle', 'Melt', 'Crater depth', 0.3, 0.05, 1.5, 0.01, {
      help: 'How far each end has burned down into a crater, in radii',
    })
  ),
  rimWall: rolled(
    'candle',
    [0.08, 0.2],
    num('candle', 'Melt', 'Rim wall', 0.12, 0.04, 0.4, 0.005, {
      help: 'Wall thickness round the crater, in radii',
    })
  ),
  rimRagged: rolled(
    'candle',
    [0.2, 1],
    num('candle', 'Melt', 'Rim ragged', 0.55, 0, 1.5, 0.01, {
      help: 'How unevenly the rim has melted',
    })
  ),
  dripCount: rolled(
    'candle',
    [0, 9],
    num('candle', 'Melt', 'Drips', 4, 0, 16, 1)
  ),
  dripLength: rolled(
    'candle',
    [0.3, 1.8],
    num('candle', 'Melt', 'Drip length', 1, 0.05, 3, 0.01)
  ),
  dripThickness: rolled(
    'candle',
    [0.7, 1.4],
    num('candle', 'Melt', 'Drip thickness', 1, 0.3, 2.5, 0.01)
  ),
  buildup: rolled(
    'candle',
    [0, 1],
    num('candle', 'Melt', 'Buildup', 0.5, 0, 1.5, 0.01, {
      help: 'Wax sheets run over the rim and down the side',
    })
  ),
  waxColor: inFacet('candle', color('candle', 'Wax', 'Colour', '#f4ecdc')),
  waxTranslucency: rolled(
    'candle',
    [0.5, 1],
    num('candle', 'Wax', 'Translucency', 0.8, 0, 1.5, 0.01, {
      help: 'How much flame light glows through thin wax',
    })
  ),
  waxRoughness: rolled(
    'candle',
    [0.3, 0.6],
    num('candle', 'Wax', 'Roughness', 0.45, 0, 1, 0.01)
  ),
  waxDetail: num('candle', 'Wax', 'Mesh detail', 24, 8, 48, 1, {
    help: 'Mesh cells per radius; higher is smoother and slower to build',
  }),
  wickLength: rolled(
    'candle',
    [0.16, 0.3],
    num('candle', 'Wick', 'Length', 0.22, 0.05, 0.5, 0.005)
  ),
  wickCurl: rolled(
    'candle',
    [0, 1],
    num('candle', 'Wick', 'Curl', 0.45, 0, 1.5, 0.01, {
      help: 'How far the wick bends over at its tip',
    })
  ),
  wickMushroom: rolled(
    'candle',
    [0, 1],
    num('candle', 'Wick', 'Carbon', 0.3, 0, 1, 0.01, {
      help: 'The carbon mushroom on the tip of a long-burned wick',
    })
  ),
};

const FIRE = {
  flame: inFacet(
    'fire',
    choice('fire', null, 'Flame', FLAMES, 'sim', {
      choiceLabels: {
        out: 'Out',
        shader: 'Shader',
        sim: 'Fluid sim',
        slices: 'Slices',
      },
      help: 'sim: a buoyant fluid simulation ray-marched as a volume; shader: the displaced shader flame; slices: the stacked volumetric slices; out: no flame, the wick smokes',
    })
  ),
  flameState: inFacet(
    'fire',
    choice('fire', null, 'State', FLAME_STATES, 'calm', {
      help: 'calm: still air; flicker: a restless flame; gutter: starving and catching; breeze: leaning in a draught; sooty: tall, smoking',
      when: lit,
    })
  ),
  emberState: inFacet(
    'fire',
    choice('fire', null, 'Ember', EMBER_STATES, 'snuffed', {
      help: 'snuffed: just blown out, a thick ribbon; smoulder: a glowing tip and a thin wisp; cold: long out',
      when: { flame: ['out'] },
    })
  ),
  flameSeed: rolled(
    'fire',
    [0, 99999],
    num('fire', null, 'Flame seed', 7, 0, 99999, 1)
  ),
  flameSize: rolled(
    'fire',
    [1, 1.4],
    num('fire', null, 'Size', 1.15, 0.4, 2.5, 0.01, { when: lit })
  ),
  flameIntensity: rolled(
    'fire',
    [0.85, 1.25],
    num('fire', null, 'Intensity', 1, 0, 4, 0.01, { when: lit })
  ),
  flameFlicker: rolled(
    'fire',
    [0.6, 1.4],
    num('fire', null, 'Flicker', 1, 0, 3, 0.01, {
      help: 'Scales how much the state flickers, gutters and sways',
      when: lit,
    })
  ),
  flameWindAzimuth: rolled(
    'fire',
    [-180, 180],
    num('fire', null, 'Draught from', 40, -180, 180, 1, {
      help: 'Degrees the draught blows from (breeze and gutter)',
      when: { flameState: ['breeze', 'gutter'] },
    })
  ),
  flameHue: rolled(
    'fire',
    [-5, 5],
    num('fire', null, 'Hue', 0, -180, 180, 1, { when: lit })
  ),
  flameStartColor: color('fire', 'Colour', 'Hot', '#fff1c4', { when: sim }),
  flameMidColor: color('fire', 'Colour', 'Mid', '#ff9a2e', { when: sim }),
  flameEndColor: color('fire', 'Colour', 'Cool', '#d42a05', { when: sim }),
  flameBlueColor: color('fire', 'Colour', 'Blue base', '#2f5bff', {
    when: sim,
  }),
  flameBlue: rolled(
    'fire',
    [0.5, 1.2],
    num('fire', 'Colour', 'Blue amount', 0.85, 0, 3, 0.01, { when: sim })
  ),
  simBuoyancy: num('fire', 'Sim', 'Buoyancy', 1, 0, 3, 0.01, {
    help: 'Scales the state’s buoyancy',
    when: sim,
  }),
  simTurbulence: num('fire', 'Sim', 'Turbulence', 1, 0, 4, 0.01, {
    help: 'Scales the state’s curl turbulence',
    when: sim,
  }),
  simLifespan: num('fire', 'Sim', 'Lifespan', 1, 0.2, 3, 0.01, {
    help: 'Scales how long the gas stays hot: the flame’s height',
    when: sim,
  }),
  simSoot: num('fire', 'Sim', 'Soot', 1, 0, 5, 0.01, {
    help: 'Scales the soot the flame sheds',
    when: sim,
  }),
  simResolution: num('fire', 'Sim', 'Grid', 1, 0.5, 2, 0.05, {
    help: 'Grid density of the simulation (1 = 32 cells across the flame box)',
    when: sim,
  }),
  simSteps: num('fire', 'Sim', 'March steps', 72, 16, 200, 1, {
    help: 'Ray-march samples through the flame volume',
    when: sim,
  }),
  flameBaseSpeed: num('fire', 'Shader', 'Base speed', 1.15, 0, 4, 0.01, {
    when: shader,
  }),
  flameMinSpeed: num('fire', 'Shader', 'Min speed', 0.28, 0, 2, 0.01, {
    when: shader,
  }),
  flameSlowFreq: num('fire', 'Shader', 'Slow freq', 0.7, 0, 5, 0.01, {
    when: shader,
  }),
  flameSlowAmp: num('fire', 'Shader', 'Slow amp', 0.55, 0, 2, 0.01, {
    when: shader,
  }),
  flameFastFreq: num('fire', 'Shader', 'Fast freq', 2.6, 0, 10, 0.01, {
    when: shader,
  }),
  flameFastAmp: num('fire', 'Shader', 'Fast amp', 0.25, 0, 2, 0.01, {
    when: shader,
  }),
  flameMicroFreq: num('fire', 'Shader', 'Micro freq', 5.7, 0, 20, 0.01, {
    when: shader,
  }),
  flameMicroAmp: num('fire', 'Shader', 'Micro amp', 0.08, 0, 1, 0.01, {
    when: shader,
  }),
  flameSwayX: num('fire', 'Shader', 'Sway X', 0.015, 0, 0.2, 0.001, {
    when: shader,
  }),
  flameSwayZ: num('fire', 'Shader', 'Sway Z', 0.014, 0, 0.2, 0.001, {
    when: shader,
  }),
  flamePulseFreq: num('fire', 'Shader', 'Pulse freq', 3.4, 0, 10, 0.01, {
    when: shader,
  }),
  flamePulseAmp: num('fire', 'Shader', 'Pulse amp', 0.04, 0, 0.5, 0.001, {
    when: shader,
  }),
};

const SMOKE = {
  smoke: inFacet(
    'smoke',
    choice('smoke', null, 'Smoke', SMOKES, 'curl', {
      choiceLabels: {
        billboard: 'Billboard',
        curl: 'Curl particles',
        none: 'None',
        ribbon: 'Ribbon',
      },
      help: 'curl: a sorted particle stream in curl noise; billboard: the camera-facing shader sheet; ribbon: the spline-following particles; none: off',
    })
  ),
  smokeColor: inFacet('smoke', color('smoke', null, 'Colour', '#c4c4c4')),
  smokeSeed: rolled(
    'smoke',
    [0, 99999],
    num('smoke', 'Curl', 'Seed', 11, 0, 99999, 1, { when: curl })
  ),
  smokeCount: num('smoke', 'Curl', 'Particles', 65536, 4096, 262144, 4096, {
    help: 'Particles per end (rounded to a power of two)',
    when: curl,
  }),
  smokeOpacity: rolled(
    'smoke',
    [0.05, 0.13],
    num('smoke', 'Curl', 'Opacity', 0.08, 0.002, 0.4, 0.001, {
      help: 'Each particle’s peak opacity; density comes from overlap',
      when: curl,
    })
  ),
  smokeSize: rolled(
    'smoke',
    [0.7, 1.4],
    num('smoke', 'Curl', 'Size', 1, 0.2, 4, 0.01, { when: curl })
  ),
  smokeLife: rolled(
    'smoke',
    [4, 9],
    num('smoke', 'Curl', 'Life', 6, 1, 20, 0.1, {
      help: 'Seconds a particle lives',
      when: curl,
    })
  ),
  smokeRise: rolled(
    'smoke',
    [0.35, 0.8],
    num('smoke', 'Curl', 'Rise', 0.55, 0, 2, 0.01, {
      help: 'Units per second the stream climbs',
      when: curl,
    })
  ),
  smokeLaminar: rolled(
    'smoke',
    [0.15, 0.7],
    num('smoke', 'Curl', 'Laminar', 0.4, 0, 4, 0.01, {
      help: 'Height the stream rises smooth before it breaks into eddies',
      when: curl,
    })
  ),
  smokeCurl: rolled(
    'smoke',
    [0.5, 1.8],
    num('smoke', 'Curl', 'Curl', 1, 0, 5, 0.01, {
      help: 'Strength of the curl-noise eddies',
      when: curl,
    })
  ),
  smokeCurlScale: rolled(
    'smoke',
    [0.7, 2.2],
    num('smoke', 'Curl', 'Curl scale', 1.3, 0.1, 6, 0.01, {
      help: 'Frequency of the eddies: higher is finer',
      when: curl,
    })
  ),
  smokeCurlSpeed: rolled(
    'smoke',
    [0.05, 0.35],
    num('smoke', 'Curl', 'Curl speed', 0.15, 0, 2, 0.01, { when: curl })
  ),
  smokeSway: rolled(
    'smoke',
    [0, 1],
    num('smoke', 'Curl', 'Sway', 0.4, 0, 2, 0.01, {
      help: 'How far the whole stream meanders',
      when: curl,
    })
  ),
  smokeSpread: rolled(
    'smoke',
    [0.2, 0.9],
    num('smoke', 'Curl', 'Spread', 0.5, 0, 3, 0.01, {
      help: 'How wide a particle wanders as it ages',
      when: curl,
    })
  ),
  smokeLight: num('smoke', 'Curl', 'Flame light', 1, 0, 4, 0.01, {
    help: 'How strongly the flames light the smoke',
    when: curl,
  }),
  smokeRiseSpeed: num('smoke', 'Billboard', 'Rise', 0.35, 0, 2, 0.01, {
    when: billboard,
  }),
  smokeSpreadStrength: num('smoke', 'Billboard', 'Spread', 0.18, 0, 1, 0.01, {
    when: billboard,
  }),
  smokeTimeFrequency: num('smoke', 'Billboard', 'Time freq', 0.45, 0, 3, 0.01, {
    when: billboard,
  }),
  smokeUvFrequencyX: num('smoke', 'Billboard', 'UV freq X', 1, 0, 10, 0.01, {
    when: billboard,
  }),
  smokeUvFrequencyY: num('smoke', 'Billboard', 'UV freq Y', 1.5, 0, 10, 0.01, {
    when: billboard,
  }),
  smokeWidth: num('smoke', 'Billboard', 'Width', 0.18, 0.05, 2, 0.01, {
    when: billboard,
  }),
  smokeHeight: num('smoke', 'Billboard', 'Height', 3, 0.5, 8, 0.05, {
    when: billboard,
  }),
  smokeSheetOpacity: num('smoke', 'Billboard', 'Opacity', 0.35, 0, 1, 0.01, {
    when: billboard,
  }),
  volParticleCount: num('smoke', 'Ribbon', 'Particles', 8000, 500, 40000, 100, {
    when: ribbon,
  }),
  volOpacity: num('smoke', 'Ribbon', 'Opacity', 0.01, 0, 0.2, 0.001, {
    when: ribbon,
  }),
  volSize: num('smoke', 'Ribbon', 'Size', 0.7, 0.1, 5, 0.01, { when: ribbon }),
  volSpread: num('smoke', 'Ribbon', 'Spread', 0.2, 0, 2, 0.01, {
    when: ribbon,
  }),
  volTurbulence: num('smoke', 'Ribbon', 'Turbulence', 2, 0, 8, 0.01, {
    when: ribbon,
  }),
  volTurbulenceSpeed: num('smoke', 'Ribbon', 'Turb speed', 0.25, 0, 2, 0.01, {
    when: ribbon,
  }),
  volMaxDrift: num('smoke', 'Ribbon', 'Max drift', 2.4, 0, 8, 0.01, {
    when: ribbon,
  }),
  volFadeRate: num('smoke', 'Ribbon', 'Fade', 4, 0, 20, 0.1, {
    when: ribbon,
  }),
};

const cartoon = { look: ['cartoon'] };
const clay = { look: ['clay'] };

const STYLE = {
  look: inFacet(
    'style',
    choice('style', null, 'Look', LOOKS, 'realistic', {
      choiceLabels: {
        cartoon: 'Cartoon',
        clay: 'Claymation',
        realistic: 'Realistic',
      },
      help: 'realistic: the sim flame, sorted smoke and translucent wax; cartoon: toon-banded wax with an ink outline, a flat-banded inked flame and outlined puffs; clay: lumpy fingerprinted plasticine, a sculpted flame and clay smoke balls, stepped like stop-motion',
    })
  ),
  toonBands: rolled(
    'style',
    [2, 4],
    num('style', 'Cartoon', 'Bands', 3, 2, 6, 1, {
      help: 'Flat tones the wax and flame are drawn in',
      when: cartoon,
    })
  ),
  toonOutline: rolled(
    'style',
    [0.007, 0.016],
    num('style', 'Cartoon', 'Outline', 0.011, 0, 0.08, 0.001, {
      help: 'Ink outline width round the wax, in candle units',
      when: cartoon,
    })
  ),
  toonInk: inFacet(
    'style',
    color('style', 'Cartoon', 'Ink', '#1a1013', { when: cartoon })
  ),
  styleWax: inFacet(
    'style',
    color('style', null, 'Style wax', '#ff6b6b', {
      help: 'The candle colour a cartoon or clay look uses (realistic uses Wax colour)',
      when: { look: ['cartoon', 'clay'] },
    })
  ),
  styleBackground: inFacet(
    'style',
    color('style', null, 'Style backdrop', '#1b1f3b', {
      help: 'The backdrop a cartoon or clay look sits on',
      when: { look: ['cartoon', 'clay'] },
    })
  ),
  clayLumps: rolled(
    'style',
    [0.25, 0.9],
    num('style', 'Clay', 'Lumps', 0.5, 0, 1.5, 0.01, {
      help: 'How hand-pressed and uneven the plasticine is',
      when: clay,
    })
  ),
  clayPrints: rolled(
    'style',
    [0.2, 1],
    num('style', 'Clay', 'Fingerprints', 0.55, 0, 1.5, 0.01, {
      help: 'Fine thumb marks and ridges on every surface',
      when: clay,
    })
  ),
  clayFps: num('style', 'Clay', 'Frame rate', 12, 0, 30, 1, {
    help: 'Stop-motion poses per second (0: smooth)',
    when: clay,
  }),
};

const STAGE = {
  backgroundColor: color('stage', null, 'Background', '#050507'),
  floor: choice('stage', null, 'Floor', FLOORS, 'reflect'),
  floorColor: color('stage', null, 'Floor colour', '#111111', {
    when: { floor: ['reflect', 'matte'] },
  }),
  floorDrop: num('stage', null, 'Floor drop', 1.8, 0, 8, 0.05, {
    help: 'Gap between the lower flame and the floor',
    when: { floor: ['reflect', 'matte'] },
  }),
  ambientIntensity: num('stage', null, 'Ambient', 0.15, 0, 2, 0.01),
  keyIntensity: num('stage', null, 'Key light', 1.1, 0, 4, 0.01),
  flameLight: num('stage', null, 'Flame light', 1, 0, 6, 0.01, {
    help: 'How strongly the flames light the wax and floor',
  }),
  exposure: num('stage', null, 'Exposure', 1, 0.2, 4, 0.01),
  autoRotate: sceneOnly(flag('stage', null, 'Auto rotate', false)),
};

const POST = {
  bloom: flag('post', null, 'Bloom', true),
  bloomStrength: num('post', null, 'Bloom strength', 0.55, 0, 4, 0.01, {
    when: { bloom: [true] },
  }),
  bloomThreshold: num('post', null, 'Bloom threshold', 0.6, 0, 4, 0.01, {
    when: { bloom: [true] },
  }),
  bloomRadius: num('post', null, 'Bloom radius', 0.6, 0, 1, 0.01, {
    when: { bloom: [true] },
  }),
};

const svgOnly = (item) => ({ ...item, scene: false, scope: 'still' });

const GENERATION = {
  settle: num('render', null, 'Settle', 5, 0, 30, 0.1, {
    config: true,
    help: 'Seconds the flame and smoke burn before a still is taken',
    scene: false,
  }),
};

const RENDER = {
  batch: standard.batch(),
  out: standard.out('candle'),
  width: standard.width(),
  height: standard.height(),
  pixelRatio: standard.pixelRatio(),
  count: standard.count('candles'),
  webp: standard.webp(),
  capture: standard.capture(),
  transparent: standard.transparent(),
  svg: standard.svg(
    'Write a plottable SVG per view: the candle’s slices, contours and silhouette, the flame’s isotherms and the smoke as stipple'
  ),
  plotWidthMm: standard.plotWidthMm(),
  views: standard.views(VIEWS, 'hero'),
  svgOcclusion: standard.svgOcclusion(
    'Drop line work and smoke dots hidden behind the candle (uses a depth pass)'
  ),
  svgStroke: standard.svgStroke(),
  svgPenMm: standard.svgPenMm(),
  svgColors: standard.svgColors(),
  svgPaper: svgOnly(color('svg', null, 'SVG paper', '#ffffff')),
  svgStyle: svgOnly(
    choice('svg', null, 'SVG lines', SVG_STYLES, 'slices', {
      help: 'Section lines across the candle — slices: level rings; sections: cuts down its length; grid: both; none: off',
    })
  ),
  svgLines: svgOnly(
    num('svg', null, 'SVG line count', 40, 2, 200, 1, {
      when: { svgStyle: ['slices', 'sections', 'grid'] },
    })
  ),
  svgSilhouette: svgOnly(flag('svg', null, 'SVG silhouette', true)),
  svgContours: svgOnly(flag('svg', null, 'SVG contours', true)),
  svgCreaseAngle: svgOnly(
    num('svg', null, 'SVG crease angle', 50, 5, 120, 1, {
      help: 'Degrees two faces must bend by for their edge to draw',
    })
  ),
  svgIsotherms: svgOnly(
    num('svg', null, 'SVG isotherms', 9, 0, 40, 1, {
      help: 'Nested temperature contours per flame (0: off); legacy flames contour their brightness',
    })
  ),
  svgSmokeDots: svgOnly(
    num('svg', null, 'SVG smoke dots', 1, 0, 8, 0.05, {
      help: 'Stipple density for the smoke (0: off)',
    })
  ),
  svgShading: standard.svgShading(
    'Shade the candle from its render, on its own layer'
  ),
  svgShadeSpacing: standard.svgShadeSpacing(),
  svgShadeGamma: standard.svgShadeGamma(),
  svgShadeAngle: standard.svgShadeAngle(),
  fov: standard.fov(32),
  margin: standard.margin(
    0.06,
    'Space round the candle and flames, as a share of the frame'
  ),
  keep: standard.keep(['candle', 'fire', 'smoke', 'style']),
  base: standard.base('candle'),
  mode: standard.mode(
    VIDEO_MODES,
    'burn',
    'burn: the candle burns while the camera holds (or drifts by --orbit); snuff: the flames go out halfway and the wicks smoke; montage: one held still per candle; turntable: the camera circles it'
  ),
  view: standard.view(VIEWS, 'hero'),
  ...standard.videoFormats(),
  fps: standard.fps(),
  hold: standard.hold(6, 'Seconds of footage per candle'),
  turns: standard.turns('candle'),
  orbit: standard.orbit(0, 'Degrees the camera drifts round a burn clip'),
};

export const RENDER_OPTIONS = {
  ...CANDLE,
  ...FIRE,
  ...SMOKE,
  ...STYLE,
  ...STAGE,
  ...POST,
  ...GENERATION,
  ...RENDER,
  ...standard.overlayOptions(),
};

export const SURFACE_DEFAULTS = {
  'cli-still': { batch: null },
  'cli-video': { count: 3, height: 1920, out: 'output/candle.mp4' },
  workbench: { count: 6 },
};

const schema = createOptionSchema({
  configKeys: (item) => item.scene || item.config,
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

// Keys that change the wax mesh (rebuilt on the CPU), and the generation
// keys the CLI keeps beside the scene keys.
export const FORM_KEYS = [...Object.keys(CANDLE), 'look', 'clayLumps'];
export const CONFIG_KEYS = [...SCENE_KEYS, ...Object.keys(GENERATION)];
