/* eslint-disable no-param-reassign */
import { dot, fract, sin, uniform, uniformArray, vec2, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { rgbToHslValues } from './color';

export const LUMA = vec3(0.2126, 0.7152, 0.0722);
export const luma = (rgb) => dot(LUMA, rgb);

export const DITHER_PATTERNS = [
  'whiteNoise',
  'bayer2',
  'bayer4',
  'bayer8',
  'blueNoise',
];
export const DITHER_QUANTIZE = [
  'threshold',
  'grayscale',
  'color',
  'palette',
  'hueLightness',
];

// Game Boy DMG greens — the article's own palette.png lives on its CDN.
export const DEFAULT_PALETTE = ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'];

// The 16 saturated hues from the article's hue-lightness demo.
export const DEFAULT_HUE_PALETTE = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 0],
  [1, 0, 1],
  [0, 1, 1],
  [1, 0.5, 0],
  [0.5, 0, 1],
  [0.5, 1, 0],
  [1, 0, 0.5],
  [0, 0.5, 1],
  [0, 1, 0.5],
  [1, 0.75, 0],
  [0.75, 0, 1],
  [0, 1, 0.75],
  [1, 0, 0.75],
];

// Each demo nudged the threshold differently before quantizing; these are
// their values. `offset`/`strength` apply as `(threshold + offset) * strength`.
const THRESHOLD_OFFSETS = { whiteNoise: 0, blueNoise: 0.85 };
const QUANTIZE_DEFAULTS = {
  threshold: { ditherOffset: 0.7, ditherStrength: 1, colorNum: 2 },
  grayscale: { ditherOffset: -0.88, ditherStrength: 1, colorNum: 4 },
  color: { ditherOffset: -0.88, ditherStrength: 1, colorNum: 2 },
  palette: { ditherOffset: -0.88, ditherStrength: 0.2 },
  hueLightness: { ditherOffset: 1 / 64 + 0.13, ditherStrength: 1 },
};
const CRT_DEFAULTS = {
  ditherOffset: 0,
  ditherStrength: 0.6,
  colorNum: 16,
  pixelSize: 4,
};

const BASE_DEFAULTS = {
  pixelSize: 1,
  colorNum: 4,
  maskBorder: 0.9,
  maskIntensity: 0.6,
  maskBlending: true,
  curve: 0.25,
  spread: 0.0025,
  scanlineStrength: 1,
  scanlineDensity: 2150,
  scanlineSpeed: 100,
  shake: 1,
};

export function resolveOptions({ pattern, quantize, crt }, options) {
  const merged = { ...BASE_DEFAULTS, ...QUANTIZE_DEFAULTS[quantize] };
  if (quantize === 'threshold' && pattern in THRESHOLD_OFFSETS)
    merged.ditherOffset = THRESHOLD_OFFSETS[pattern];
  if (crt) Object.assign(merged, CRT_DEFAULTS);
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) merged[key] = value;
  });
  return merged;
}

const flag = (value) => (value ? 1 : 0);

const linearColor = (value) =>
  Array.isArray(value)
    ? new THREE.Color().setRGB(...value, THREE.LinearSRGBColorSpace)
    : new THREE.Color(value);

const paletteEntry = (value) => {
  const { r, g, b } = linearColor(value);
  return new THREE.Vector3(r, g, b);
};

const hslOf = (value) => {
  const { r, g, b } = linearColor(value);
  return new THREE.Vector3(...rgbToHslValues(r, g, b));
};

const SCALARS = [
  'pixelSize',
  'colorNum',
  'ditherOffset',
  'ditherStrength',
  'maskBorder',
  'maskIntensity',
  'curve',
  'spread',
  'scanlineStrength',
  'scanlineDensity',
  'scanlineSpeed',
  'shake',
];

export function createUniforms(values, palette, huePalette) {
  const uniforms = Object.fromEntries(
    SCALARS.map((key) => [key, uniform(values[key])])
  );
  uniforms.maskBlending = uniform(flag(values.maskBlending));
  uniforms.palette = uniformArray(palette.map(paletteEntry), 'vec3');
  uniforms.huePalette = uniformArray(huePalette.map(hslOf), 'vec3');
  return uniforms;
}

export function updateUniforms(uniforms, values) {
  SCALARS.forEach((key) => {
    if (values[key] !== undefined) uniforms[key].value = values[key];
  });
  if (values.maskBlending !== undefined)
    uniforms.maskBlending.value = flag(values.maskBlending);
  values.palette?.forEach((entry, index) => {
    uniforms.palette.array[index]?.copy(paletteEntry(entry));
  });
  values.huePalette?.forEach((entry, index) => {
    uniforms.huePalette.array[index]?.copy(hslOf(entry));
  });
}

export function hash(point) {
  return fract(sin(dot(point, vec2(12.9898, 78.233))).mul(43758.5453));
}
