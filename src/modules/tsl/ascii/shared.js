/* eslint-disable no-param-reassign */
import { dot, floor, fract, mix, uniform, vec2, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

export const DEFAULT_CHARSET = ' ·•+✦★○◯●';
export const DEFAULT_EDGE_CHARS = '-|/\\';

export const ASCII_COLOR_MODES = [
  'ink',
  'preserve',
  'videoOnWhite',
  'videoOnBackground',
];

export const ASCII_NOISE_MODES = [
  'additive',
  'multiply',
  'screen',
  'overlay',
  'softLight',
  'linearBurn',
  'colorBurn',
  'colorDodge',
];

// Colors are the sRGB hexes of the reference's linear [r,g,b] constants.
export const ASCII_DEFAULTS = {
  cellSize: 16,
  charset: DEFAULT_CHARSET,
  edgeChars: DEFAULT_EDGE_CHARS,
  invert: false,
  colorMode: 'videoOnWhite',
  ink: '#b3ffb3',
  background: '#000000',
  whiteCutoff: 0.8,
  brightness: 0,
  contrast: 1,
  gamma: 1,
  edges: true,
  edgeThreshold: 0.3,
  variety: 1,
  useMemory: false,
  morphRate: 1.2,
  glyphScale: 1,
  glyphBlend: false,
  magnet: 0.6,
  sdfMorph: false,
  sdfAA: 0.04,
  sdfThreshold: 0.5,
  colorVar: 0.1,
  noise: 0.06,
  noiseScale: 1,
  noiseMode: 'additive',
  asciiBlend: 'normal',
  asciiOpacity: 1,
  bleed: 0.5,
  bleedRadius: 24,
  bleedBlur: 0,
  bleedBlend: 'normal',
  bleedOpacity: 1,
};

export function resolveOptions(options = {}) {
  const merged = { ...ASCII_DEFAULTS };
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && key in merged) merged[key] = value;
  });
  return merged;
}

const SCALARS = [
  'cellSize',
  'whiteCutoff',
  'brightness',
  'contrast',
  'gamma',
  'edgeThreshold',
  'variety',
  'morphRate',
  'glyphScale',
  'magnet',
  'sdfAA',
  'sdfThreshold',
  'colorVar',
  'noise',
  'noiseScale',
  'asciiOpacity',
  'bleed',
  'bleedRadius',
  'bleedBlur',
  'bleedOpacity',
];
const FLAGS = ['invert', 'edges', 'useMemory', 'glyphBlend', 'sdfMorph'];
const MODES = { colorMode: ASCII_COLOR_MODES, noiseMode: ASCII_NOISE_MODES };
const COLORS = ['ink', 'background'];

const modeIndex = (list, value) => Math.max(0, list.indexOf(value));

export function createUniforms(values) {
  const u = {
    glyphCount: uniform(1),
    edgeCount: uniform(1),
    gridSize: uniform(new THREE.Vector2(1, 1)),
  };
  SCALARS.forEach((key) => {
    u[key] = uniform(values[key]);
  });
  FLAGS.forEach((key) => {
    u[key] = uniform(values[key] ? 1 : 0);
  });
  Object.entries(MODES).forEach(([key, list]) => {
    u[key] = uniform(modeIndex(list, values[key]));
  });
  COLORS.forEach((key) => {
    u[key] = uniform(new THREE.Color(values[key]));
  });
  return u;
}

export function updateUniforms(u, values) {
  SCALARS.forEach((key) => {
    if (values[key] !== undefined) u[key].value = values[key];
  });
  FLAGS.forEach((key) => {
    if (values[key] !== undefined) u[key].value = values[key] ? 1 : 0;
  });
  Object.entries(MODES).forEach(([key, list]) => {
    if (values[key] !== undefined) u[key].value = modeIndex(list, values[key]);
  });
  COLORS.forEach((key) => {
    if (values[key] !== undefined) u[key].value.set(values[key]);
  });
}

export const isOn = (flagUniform) => flagUniform.greaterThan(0.5);

const LUMA = vec3(0.299, 0.587, 0.114);
export const luma = (rgb) => dot(rgb, LUMA);

export function hash21(point) {
  const p = fract(point.mul(vec2(123.34, 345.45))).toVar();
  p.addAssign(dot(p, p.add(34.345)));
  return fract(p.x.mul(p.y));
}

export function valueNoise(point) {
  const i = floor(point);
  const f = fract(point);
  const a = hash21(i);
  const b = hash21(i.add(vec2(1, 0)));
  const c = hash21(i.add(vec2(0, 1)));
  const d = hash21(i.add(vec2(1, 1)));
  const s = f.mul(f).mul(f.mul(-2).add(3));
  return mix(mix(a, b, s.x), mix(c, d, s.x), s.y);
}
