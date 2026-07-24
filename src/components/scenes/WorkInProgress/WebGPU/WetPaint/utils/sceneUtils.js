import * as THREE from 'three';

// Measured from the raw sprayCanSeparated.glb (real height ~6.72 raw units;
// a real spray can runs ~20cm) — shared by the interactive can (WetPaint.jsx)
// and the discarded/scattered cans (EmptyCanScatter.jsx) so both render the
// can at the same real-world size.
export const REALISTIC_CAN_SCALE = 0.03;

// Measured from SidewalkCrackedCurb.glb (see components/Ground.jsx): the
// sidewalk slab's thickness and depth, shared here because scatter/can/
// streetlight placement all need to sit ON the sidewalk surface.
export const SIDEWALK_HEIGHT = 0.149;
export const SIDEWALK_DEPTH = 2.207;

// Deterministic RNG so scattered layouts (litter, empty cans) are stable
// across re-renders/preset switches instead of reshuffling every mount.
// A plain linear congruential generator — same "no bitwise ops" flavor as
// the hash2d() trick in DumpsterFire's SidewalkGround.jsx — good enough for
// visual scatter, not for anything security-sensitive.
export function createSeededRandom(seed) {
  let state = (seed || 1) % 233280;

  const next = () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };

  return {
    next,
    range: (min, max) => min + next() * (max - min),
    pick: (items) => items[Math.floor(next() * items.length) % items.length],
  };
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// h/s/v in [0,1] -> {r,g,b} in [0,1]. Used by the color wheel.
export function hsvToRgb(h, s, v) {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      return { r: v, g: t, b: p };
    case 1:
      return { r: q, g: v, b: p };
    case 2:
      return { r: p, g: v, b: t };
    case 3:
      return { r: p, g: q, b: v };
    case 4:
      return { r: t, g: p, b: v };
    default:
      return { r: v, g: p, b: q };
  }
}

// {r,g,b} in [0,1] -> {h,s,v} in [0,1]. Used to sync the wheel dot to the
// current RGB color when a slider changes it directly.
export function rgbToHsv(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const v = max;
  const s = max === 0 ? 0 : delta / max;

  if (delta === 0) return { h: 0, s, v };

  let h;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h /= 6;
  if (h < 0) h += 1;

  return { h, s, v };
}

export function colorToRgba(color, alpha) {
  const c = color instanceof THREE.Color ? color : new THREE.Color(color);
  const r = Math.round(c.r * 255);
  const g = Math.round(c.g * 255);
  const b = Math.round(c.b * 255);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Diagonal gradient from near-black to `color`, used on the R/G/B slider
// panels so each channel visually reads as a fader from 0 to full intensity
// (todo item 30/31) without needing to know which real UV axis the panel's
// groove runs along — a diagonal reads as "a gradient" regardless.
export function createGradientTexture(color) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#141414');
  gradient.addColorStop(1, colorToRgba(color, 1));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
