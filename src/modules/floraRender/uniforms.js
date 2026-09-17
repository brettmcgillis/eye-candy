/* eslint-disable no-param-reassign */
import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

const SCALARS = [
  'stemPhase',
  'burst',
  'tintVariance',
  'greenReach',
  'tipAmount',
  'tipPower',
  'stemWidth',
  'tipWidth',
  'thicknessCurve',
  'leafWidth',
  'leafFlatness',
  'minPixels',
  'roughness',
  'occlusion',
  'cardCup',
  'windStrength',
  'windSpeed',
  'scatterDistance',
  'scatterLift',
  'scatterDrift',
  'scatterFlutter',
  'scatterGravity',
  'scatterTurbulence',
  'scatterSpin',
  'ornamentScale',
  'ornamentMinPixels',
];

const COLORS = [
  'stemColor',
  'budColor',
  'crownColor',
  'accentColor',
  'tipColor',
  'ornamentColor',
];

export function createUniforms() {
  const u = {
    bloom: uniform(0),
    center: uniform(new THREE.Vector3(0, 8, 0)),
    exit: uniform(0),
    formHue: uniform(0),
    hueDrift: uniform(0),
    paletteFlip: uniform(0),
    paletteNodes: new Set(),
    paletteOn: uniform(0),
    paletteSpan: uniform(1),
    paletteStart: uniform(0),
    paletteTexture: null,
    growth: uniform(0),
    scatterDir: uniform(new THREE.Vector3(1, 0, 0)),
  };

  SCALARS.forEach((key) => {
    u[key] = uniform(0);
  });
  COLORS.forEach((key) => {
    u[key] = uniform(new THREE.Color());
  });

  return u;
}

const TINTED = new Set([
  'budColor',
  'crownColor',
  'accentColor',
  'tipColor',
  'ornamentColor',
]);

const hsl = { h: 0, l: 0, s: 0 };

function syncScatterDirection(u, config) {
  const angle = THREE.MathUtils.degToRad(config.scatterAngle ?? 25);

  u.scatterDir.value.set(Math.sin(angle), 0, Math.cos(angle));
}

const SCHEME_ACCENTS = {
  analogous: { hue: 0.08, light: 1, saturation: 1 },
  complementary: { hue: 0.5, light: 1, saturation: 1 },
  mono: { hue: 0, light: 1.35, saturation: 0.75 },
};

function applyScheme(u, palette) {
  const accent = SCHEME_ACCENTS[palette?.scheme];

  u.formHue.value = palette?.formHue ?? 0;
  u.hueDrift.value = palette?.drift ?? 0;
  u.paletteStart.value = palette?.windowStart ?? 0;
  u.paletteSpan.value = palette?.windowSpan ?? 1;
  u.paletteFlip.value = palette?.flip ? 1 : 0;

  if (!accent) {
    return;
  }

  u.crownColor.value.getHSL(hsl);
  u.accentColor.value.setHSL(
    (hsl.h + accent.hue) % 1,
    Math.min(1, hsl.s * accent.saturation),
    Math.min(0.92, hsl.l * accent.light)
  );

  if (palette.scheme === 'mono') {
    u.tipColor.value.setHSL(hsl.h, hsl.s * 0.35, Math.min(0.95, hsl.l + 0.35));
  }
}

export function syncUniforms(u, config, palette = null) {
  syncScatterDirection(u, config);

  SCALARS.forEach((key) => {
    if (config[key] !== undefined) {
      u[key].value = config[key];
    }
  });
  COLORS.forEach((key) => {
    if (config[key]) {
      const color = u[key].value.set(config[key]);

      if (palette && TINTED.has(key)) {
        color.getHSL(hsl);
        color.setHSL(
          (hsl.h + palette.hue + 1) % 1,
          Math.min(1, hsl.s * palette.saturation),
          Math.min(1, hsl.l * palette.light)
        );
      }
    }
  });
  applyScheme(u, palette);
}

export function syncSpecimen(u, specimen) {
  u.center.value.fromArray(specimen.center);
}
