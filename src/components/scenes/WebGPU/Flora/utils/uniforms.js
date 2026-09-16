/* eslint-disable no-param-reassign */
import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

const SCALARS = [
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
}

export function syncSpecimen(u, specimen) {
  u.center.value.fromArray(specimen.center);
}
