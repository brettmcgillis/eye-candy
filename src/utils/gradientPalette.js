import {
  ClampToEdgeWrapping,
  Color,
  DataTexture,
  LinearFilter,
  MirroredRepeatWrapping,
  NearestFilter,
  SRGBColorSpace,
} from 'three';

import GRADIENTS from './gradients.json';

export const PALETTE_NONE = 'None';
export const PALETTE_NAMES = GRADIENTS.map((g) => g.name);

const LUT_WIDTH = 256;

export function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [Math.floor(n / 65536) % 256, Math.floor(n / 256) % 256, n % 256];
}

export function rgbToHex(rgb) {
  return `#${rgb
    .map((c) => Math.round(c).toString(16).padStart(2, '0'))
    .join('')}`;
}

export function getPaletteStops(name) {
  const gradient = GRADIENTS.find((g) => g.name === name);
  return gradient && gradient.colors.length > 0 ? gradient.colors : null;
}

const clamp01 = (t) => Math.max(0, Math.min(1, t));

export function sampleStops(stops, t) {
  const scaled = clamp01(t) * (stops.length - 1);
  const lower = Math.floor(scaled);
  const upper = Math.min(lower + 1, stops.length - 1);
  const blend = scaled - lower;
  const a = hexToRgb(stops[lower]);
  const b = hexToRgb(stops[upper]);
  return a.map((c, i) => c + (b[i] - c) * blend);
}

export function pickStop(stops, t) {
  return hexToRgb(stops[Math.round(clamp01(t) * (stops.length - 1))]);
}

export function samplePalette(stops, t, exact = false) {
  return exact ? pickStop(stops, t) : sampleStops(stops, t);
}

export function samplePaletteColors(stops, count, exact = false) {
  return Array.from({ length: count }, (_, i) =>
    samplePalette(stops, count > 1 ? i / (count - 1) : 0, exact)
  );
}

export function rgbToColor(rgb, target = new Color()) {
  return target.setRGB(
    rgb[0] / 255,
    rgb[1] / 255,
    rgb[2] / 255,
    SRGBColorSpace
  );
}

// A sampler must always be bound, so a missing palette falls back to white.
export function createNeutralPaletteTexture() {
  const texture = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

// gradients.json stops are authored in sRGB; marking the LUT sRGB is what
// keeps palettes from reading washed out. Mirrored wrap lets a shifted or
// repeated coordinate fold back through gradients that were not authored to
// loop. Exact mode bakes the nearest stop per texel and samples it unfiltered,
// so the GPU steps land where pickStop puts them on the CPU.
export function createPaletteTexture(name, { exact = false } = {}) {
  const stops = getPaletteStops(name);
  if (!stops) return null;

  const data = new Uint8Array(LUT_WIDTH * 4);
  for (let i = 0; i < LUT_WIDTH; i += 1) {
    data.set([...samplePalette(stops, i / (LUT_WIDTH - 1), exact), 255], i * 4);
  }

  const filter = exact ? NearestFilter : LinearFilter;
  const texture = new DataTexture(data, LUT_WIDTH, 1);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = filter;
  texture.magFilter = filter;
  texture.wrapS = MirroredRepeatWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}
