/* eslint-disable no-param-reassign */
import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  CELL_TARGETS,
  COLOR_KEYS,
  RENDER_OPTIONS,
  resolveSurfaceColors,
} from '@modules/blockParty';

import { createPaletteLut, writePaletteLut } from './palette';

export const SURFACE_COLOR_KEYS = COLOR_KEYS;

export const SCALAR_KEYS = [
  'cardBob',
  'cardBobRate',
  'cellStrength',
  'neonFlicker',
  'neonFlickerRate',
  'neonIntensity',
  'overshoot',
  'paletteRepeat',
  'paletteShift',
  'patternScale',
  'patternStrength',
  'patternWidth',
  'pitLineWidth',
  'pitStrataStrength',
  'pulseDepth',
  'pulseRate',
  'revealBand',
  'riserShade',
  'ringIntensity',
  'stairAlphaStep',
  'towerBandStrength',
  'towerBanding',
  'towerBreathe',
  'towerBreatheRate',
  'towerInk',
  'wellFalloff',
];

// Selects reach the shaders as numbers so switching one never rebuilds a
// material. The order here is the shader's, not the control's.
export const ENUMS = {
  easing: ['smooth', 'linear', 'expo', 'back'],
  emergeStyle: ['rise', 'unfold'],
  groundPattern: ['none', 'dots', 'grid', 'crosshatch'],
};

const defaultOf = (key) => RENDER_OPTIONS[key].default;

export function createCityUniforms() {
  const paletteTexture = createPaletteLut();

  return {
    build: uniform(1),
    cellAccents: uniform(0),
    cellCards: uniform(0),
    cellTowers: uniform(0),
    paletteOn: uniform(0),
    paletteReverse: uniform(0),
    paletteTexture,
    time: uniform(0),
    worldPerPixel: uniform(0.01),
    ...Object.fromEntries(
      SURFACE_COLOR_KEYS.map((key) => [
        key,
        uniform(new THREE.Color(defaultOf(key))),
      ])
    ),
    ...Object.fromEntries(
      SCALAR_KEYS.map((key) => [key, uniform(defaultOf(key))])
    ),
    ...Object.fromEntries(Object.keys(ENUMS).map((key) => [key, uniform(0)])),
  };
}

// Everything a config sets that is not geometry. `stops` is the resolved
// palette, or null for the authored colours.
export function applyCityConfig(uniforms, config, stops) {
  const colors = resolveSurfaceColors(config, stops);
  const targets = CELL_TARGETS[config.colorTarget] ?? CELL_TARGETS.none;
  const lutKey = `${stops?.join(',') ?? ''}|${config.paletteExact}`;

  SURFACE_COLOR_KEYS.forEach((key) => uniforms[key].value.set(colors[key]));
  SCALAR_KEYS.forEach((key) => {
    uniforms[key].value = config[key] ?? defaultOf(key);
  });
  Object.entries(ENUMS).forEach(([key, values]) => {
    uniforms[key].value = Math.max(values.indexOf(config[key]), 0);
  });

  uniforms.paletteOn.value = stops ? 1 : 0;
  uniforms.paletteReverse.value = config.paletteReverse ? 1 : 0;
  uniforms.cellTowers.value = targets.towers;
  uniforms.cellCards.value = targets.cards;
  uniforms.cellAccents.value = targets.accents;

  if (uniforms.lutKey !== lutKey) {
    uniforms.lutKey = lutKey;
    writePaletteLut(uniforms.paletteTexture, stops, config.paletteExact);
  }

  return colors;
}
