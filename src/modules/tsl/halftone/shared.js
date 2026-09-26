/* eslint-disable no-param-reassign */
import {
  dot,
  fract,
  sin,
  smoothstep,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

export const LUMA = vec3(0.2126, 0.7152, 0.0722);

export const HALFTONE_VARIANTS = [
  'dots',
  'whiteDots',
  'dotsAndSquares',
  'rings',
  'cmyk',
  'cellWall',
  'gooey',
  'displacedRings',
];

// Each variant's defaults are the values its source demo shipped with. Colors
// are the sRGB hexes of the demo's linear shader constants.
const VARIANT_DEFAULTS = {
  dots: { pixelSize: 16 },
  whiteDots: { pixelSize: 12, dotSize: 0.5, paperColor: '#ffffff' },
  dotsAndSquares: { pixelSize: 12, dotSize: 0.5, paperColor: '#ffffff' },
  rings: { pixelSize: 12, dotSize: 0.5, inkColor: '#ffa000' },
  cmyk: { pixelSize: 8, dotSize: 0.7, paperColor: '#ffffff' },
  cellWall: { pixelSize: 16, dotSize: 0.8 },
  gooey: { pixelSize: 16, inkColor: '#000000', paperColor: '#ffffff' },
  displacedRings: {
    pixelSize: 12,
    dotSize: 2.5,
    inkColor: '#0000ff',
    paperColor: '#e1e1e1',
  },
};

const BASE_DEFAULTS = {
  pixelSize: 8,
  dotSize: 0.7,
  offset: true,
  useLuma: true,
  ringThickness: 0.1,
  gooeyness: 0.8,
  cmykAngles: [15, 45, 0, 75],
  cmykStrengths: [0.95, 0.95, 0.95, 1.1],
  inkColor: '#ffffff',
  paperColor: '#000000',
  mouseStrength: 50,
  showTrail: false,
};

export function resolveOptions(variant, options) {
  const merged = { ...BASE_DEFAULTS, ...VARIANT_DEFAULTS[variant] };
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined) merged[key] = value;
  });
  return merged;
}

const flag = (value) => (value ? 1 : 0);

export function createUniforms(values) {
  return {
    pixelSize: uniform(values.pixelSize),
    dotSize: uniform(values.dotSize),
    offset: uniform(flag(values.offset)),
    useLuma: uniform(flag(values.useLuma)),
    ringThickness: uniform(values.ringThickness),
    gooeyness: uniform(values.gooeyness),
    cmykAngles: uniform(new THREE.Vector4(...values.cmykAngles)),
    cmykStrengths: uniform(new THREE.Vector4(...values.cmykStrengths)),
    inkColor: uniform(new THREE.Color(values.inkColor)),
    paperColor: uniform(new THREE.Color(values.paperColor)),
    mouseStrength: uniform(values.mouseStrength),
    showTrail: uniform(flag(values.showTrail)),
  };
}

const SCALARS = ['pixelSize', 'dotSize', 'ringThickness', 'gooeyness'];
const FLAGS = ['offset', 'useLuma', 'showTrail'];

export function updateUniforms(uniforms, values) {
  SCALARS.forEach((key) => {
    if (values[key] !== undefined) uniforms[key].value = values[key];
  });
  FLAGS.forEach((key) => {
    if (values[key] !== undefined) uniforms[key].value = flag(values[key]);
  });
  if (values.mouseStrength !== undefined)
    uniforms.mouseStrength.value = values.mouseStrength;
  if (values.cmykAngles) uniforms.cmykAngles.value.set(...values.cmykAngles);
  if (values.cmykStrengths)
    uniforms.cmykStrengths.value.set(...values.cmykStrengths);
  if (values.inkColor) uniforms.inkColor.value.set(values.inkColor);
  if (values.paperColor) uniforms.paperColor.value.set(values.paperColor);
}

export const isOn = (flagUniform) => flagUniform.greaterThan(0.5);

export const luma = (color) => dot(LUMA, color.rgb);

export function antialiasedStep(edge, width, value) {
  return smoothstep(edge.sub(width), edge.add(width), value);
}

export function hash(point) {
  return fract(sin(dot(point, vec2(12.9898, 78.233))).mul(43758.5453123));
}

export const opaque = (rgb) => vec4(rgb, 1);
