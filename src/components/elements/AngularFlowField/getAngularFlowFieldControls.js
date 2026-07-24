import { folder } from 'leva';

// Every AngularFlowField prop this schema covers, plus 'visible' (a
// control-only flag — consuming scenes gate rendering with it, same idiom as
// Windswept's godraysEnabled; it's not an AngularFlowField prop itself).
const FIELDS = [
  'visible',
  'animationEnabled',
  'length',
  'loopEnabled',
  'renderMode',
  'emitterCountX',
  'emitterCountY',
  'emitterCountZ',
  'spacingX',
  'spacingY',
  'spacingZ',
  'generationDistance',
  'discreteResolution',
  'noiseScale',
  'noiseSpeed',
  'noiseStrength',
  'octaves',
  'lacunarity',
  'gain',
  'warpStrength',
  'warpScale',
  'vorticity',
  'attraction',
  'repulsion',
  'alignmentStrength',
  'alignmentRadius',
  'divergenceStrength',
  'divergenceRadius',
  'damping',
  'seed',
  'colorMode',
  'colorStart',
  'colorEnd',
  'curvatureContrast',
  'curvatureBias',
  'gradientBlur',
  'thicknessMin',
  'thicknessMax',
  'thicknessSeed',
  'pointSize',
  'emissiveIntensity',
  'roughness',
  'metalness',
  'opacity',
];

// A consuming scene whose own schema already uses a colliding key (e.g.
// FractalAutomata's CA `seed`/palette `colorMode`) passes `keyPrefix` so
// every Leva key here becomes `${keyPrefix}${Field}` instead — flat keys
// must stay globally unique (docs/scene-conventions.md §9), folders don't
// namespace them.
function prefixedKey(field, keyPrefix) {
  if (!keyPrefix) return field;
  return `${keyPrefix}${field[0].toUpperCase()}${field.slice(1)}`;
}

// Companion to the folder builder below — extracts exactly the props
// AngularFlowField itself accepts (i.e. FIELDS minus 'visible') from a flat
// scene `config` object, translating prefixed keys back to plain prop names.
export function mapAngularFlowFieldProps(config, keyPrefix = '') {
  const props = {};
  FIELDS.forEach((field) => {
    if (field === 'visible') return;
    props[field] = config[prefixedKey(field, keyPrefix)];
  });
  return props;
}

// Leva schema for AngularFlowField. Defaults match
// ~/dev/examples/260323_DiscreteVectors's own defaults exactly (its
// index.html input `value`s) — the four exceptions (length/loopEnabled/
// visible have no reference equivalent; pointSize/emissiveIntensity/
// roughness/metalness/opacity are this port's own MeshStandardMaterial
// properties, not portable from the reference's custom fresnel/specular
// shader) keep their own sensible defaults, noted inline.
export default function getAngularFlowFieldControls(
  p = {},
  { keyPrefix = '' } = {}
) {
  const key = (field) => prefixedKey(field, keyPrefix);
  const val = (field, fallback) => p[key(field)] ?? fallback;

  return folder({
    [key('visible')]: { label: 'Visible', value: val('visible', true) },
    [key('animationEnabled')]: {
      label: 'Animate',
      value: val('animationEnabled', true),
    },
    // No reference equivalent (its trails grow unbounded) — this port caps
    // trail length by design; kept at its own default.
    [key('length')]: {
      label: 'Trail Length',
      value: val('length', 48),
      min: 8,
      max: 256,
      step: 1,
    },
    // No reference equivalent either (same reason as length).
    [key('loopEnabled')]: {
      label: 'Loop (respawn)',
      value: val('loopEnabled', true),
    },
    [key('renderMode')]: {
      label: 'Render Mode',
      value: val('renderMode', 'tube'),
      options: ['tube', 'points'],
    },
    [key('emitterCountX')]: {
      label: 'Emitters X',
      value: val('emitterCountX', 6),
      min: 1,
      max: 18,
      step: 1,
    },
    [key('emitterCountY')]: {
      label: 'Emitters Y',
      value: val('emitterCountY', 6),
      min: 1,
      max: 18,
      step: 1,
    },
    [key('emitterCountZ')]: {
      label: 'Emitters Z',
      value: val('emitterCountZ', 6),
      min: 1,
      max: 18,
      step: 1,
    },
    [key('spacingX')]: {
      label: 'Spacing X',
      value: val('spacingX', 0.05),
      min: 0.01,
      max: 1.5,
      step: 0.01,
    },
    [key('spacingY')]: {
      label: 'Spacing Y',
      value: val('spacingY', 0.05),
      min: 0.01,
      max: 1.5,
      step: 0.01,
    },
    [key('spacingZ')]: {
      label: 'Spacing Z',
      value: val('spacingZ', 0.05),
      min: 0.01,
      max: 1.5,
      step: 0.01,
    },
    [key('generationDistance')]: {
      label: 'Generation Distance',
      value: val('generationDistance', 0.1),
      min: 0.002,
      max: 1,
      step: 0.001,
    },
    [key('discreteResolution')]: {
      label: 'Discrete Resolution',
      value: val('discreteResolution', 2),
      min: 1,
      max: 20,
      step: 1,
    },
    [key('noiseScale')]: {
      label: 'Noise Scale',
      value: val('noiseScale', 0.65),
      min: 0.05,
      max: 4,
      step: 0.01,
    },
    [key('noiseSpeed')]: {
      label: 'Noise Speed',
      value: val('noiseSpeed', 0.22),
      min: 0,
      max: 2,
      step: 0.01,
    },
    [key('noiseStrength')]: {
      label: 'Noise Strength',
      value: val('noiseStrength', 1),
      min: 0,
      max: 3,
      step: 0.01,
    },
    [key('octaves')]: {
      label: 'Octaves',
      value: val('octaves', 1),
      min: 1,
      max: 8,
      step: 1,
    },
    [key('lacunarity')]: {
      label: 'Lacunarity',
      value: val('lacunarity', 2),
      min: 1,
      max: 4,
      step: 0.01,
    },
    [key('gain')]: {
      label: 'Gain',
      value: val('gain', 0.5),
      min: 0,
      max: 1,
      step: 0.01,
    },
    [key('warpStrength')]: {
      label: 'Warp Strength',
      value: val('warpStrength', 0),
      min: 0,
      max: 2,
      step: 0.01,
    },
    [key('warpScale')]: {
      label: 'Warp Scale',
      value: val('warpScale', 1.2),
      min: 0.05,
      max: 4,
      step: 0.01,
    },
    [key('vorticity')]: {
      label: 'Vorticity',
      value: val('vorticity', 1),
      min: 0,
      max: 2,
      step: 0.01,
    },
    [key('attraction')]: {
      label: 'Attraction',
      value: val('attraction', 0.25),
      min: 0,
      max: 1.5,
      step: 0.01,
    },
    [key('repulsion')]: {
      label: 'Repulsion',
      value: val('repulsion', 0.1),
      min: 0,
      max: 1.5,
      step: 0.01,
    },
    [key('alignmentStrength')]: {
      label: 'Alignment Strength',
      value: val('alignmentStrength', 0.7),
      min: 0,
      max: 3,
      step: 0.01,
    },
    [key('alignmentRadius')]: {
      label: 'Alignment Radius',
      value: val('alignmentRadius', 0.16),
      min: 0.05,
      max: 2,
      step: 0.01,
    },
    [key('divergenceStrength')]: {
      label: 'Divergence Strength',
      value: val('divergenceStrength', 0),
      min: 0,
      max: 3,
      step: 0.01,
    },
    [key('divergenceRadius')]: {
      label: 'Divergence Radius',
      value: val('divergenceRadius', 0.16),
      min: 0.05,
      max: 2,
      step: 0.01,
    },
    [key('damping')]: {
      label: 'Damping',
      value: val('damping', 0.985),
      min: 0.85,
      max: 0.999,
      step: 0.001,
    },
    [key('seed')]: {
      label: 'Seed',
      value: val('seed', 351107),
      min: 0,
      max: 999999,
      step: 1,
    },
    [key('colorMode')]: {
      label: 'Color Mode',
      value: val('colorMode', 'age'),
      options: ['age', 'curvature', 'solid'],
    },
    [key('colorStart')]: {
      label: 'Color Start',
      value: val('colorStart', '#b19eff'),
    },
    [key('colorEnd')]: {
      label: 'Color End',
      value: val('colorEnd', '#ffae00'),
    },
    [key('curvatureContrast')]: {
      label: 'Gradient Contrast',
      value: val('curvatureContrast', 1.4),
      min: 0.2,
      max: 3,
      step: 0.01,
    },
    [key('curvatureBias')]: {
      label: 'Gradient Bias',
      value: val('curvatureBias', -0.4),
      min: -1,
      max: 1,
      step: 0.01,
    },
    [key('gradientBlur')]: {
      label: 'Gradient Blur',
      value: val('gradientBlur', 0.35),
      min: 0,
      max: 1,
      step: 0.01,
    },
    [key('thicknessMin')]: {
      label: 'Thickness Min (tube)',
      value: val('thicknessMin', 1),
      min: 0.1,
      max: 10,
      step: 0.1,
    },
    [key('thicknessMax')]: {
      label: 'Thickness Max (tube)',
      value: val('thicknessMax', 3),
      min: 0.1,
      max: 10,
      step: 0.1,
    },
    [key('thicknessSeed')]: {
      label: 'Thickness Seed (tube)',
      value: val('thicknessSeed', 0),
      min: 0,
      max: 999999,
      step: 1,
    },
    // No reference default found for particle size (its default display mode
    // is mesh, not particles) — kept at this port's own default.
    [key('pointSize')]: {
      label: 'Point Size (points)',
      value: val('pointSize', 0.045),
      min: 0.005,
      max: 0.3,
      step: 0.005,
    },
    // emissiveIntensity/roughness/metalness/opacity are this port's own
    // MeshStandardMaterial knobs — the reference shades its tube with a
    // custom fresnel/specular shader that doesn't map onto these directly,
    // so they keep their own defaults rather than the reference's
    // fresnel=0.05/specular=2/bloom=0.2.
    [key('emissiveIntensity')]: {
      label: 'Emissive Intensity (tube)',
      value: val('emissiveIntensity', 1.2),
      min: 0,
      max: 5,
      step: 0.05,
    },
    [key('roughness')]: {
      label: 'Roughness (tube)',
      value: val('roughness', 0.5),
      min: 0,
      max: 1,
      step: 0.01,
    },
    [key('metalness')]: {
      label: 'Metalness (tube)',
      value: val('metalness', 0.1),
      min: 0,
      max: 1,
      step: 0.01,
    },
    [key('opacity')]: {
      label: 'Opacity',
      value: val('opacity', 1),
      min: 0,
      max: 1,
      step: 0.01,
    },
  });
}
