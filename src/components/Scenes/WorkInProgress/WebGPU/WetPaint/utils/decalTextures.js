import * as THREE from 'three';

import { colorToRgba, hsvToRgb } from './sceneUtils';

// Texture generators + uv<->value mapping helpers for the can's label-style
// settings decals (todo items 41/51). The pick math and the drawing live
// side by side here so they can't drift apart: WheelDecal picks with
// hueSatFromWheelUv and places its indicator with wheelUvFromHueSat, both
// defined against the same drawn gradient.

// Fraction of the wheel plane's half-size the wheel disc occupies.
export const WHEEL_RADIUS_UV = 0.46;
// Horizontal margin of slider tracks inside their plane, in uv units.
export const SLIDER_TRACK_MARGIN_UV = 0.06;

const LABEL_FONT = 'bold 44px sans-serif';

function roundedBackground(ctx, width, height) {
  ctx.fillStyle = 'rgba(16,16,16,0.92)';
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, Math.min(24, height / 4));
  ctx.fill();
}

function makeTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// uv (0..1, v up) -> {hue, saturation} on the drawn wheel, or null outside
// it. Canvas y runs down while uv v runs up, so the drawn conic angle is
// mirrored — atan2(-dy, dx) compensates; see wheelUvFromHueSat for the
// inverse.
export function hueSatFromWheelUv(uv) {
  const dx = uv.x - 0.5;
  const dy = uv.y - 0.5;
  const radius = Math.sqrt(dx * dx + dy * dy);
  if (radius > WHEEL_RADIUS_UV) return null;
  return {
    hue: (Math.atan2(-dy, dx) / (Math.PI * 2) + 1) % 1,
    saturation: Math.min(1, radius / WHEEL_RADIUS_UV),
  };
}

export function wheelUvFromHueSat(hue, saturation) {
  const angle = hue * Math.PI * 2;
  const radius = saturation * WHEEL_RADIUS_UV;
  return {
    x: 0.5 + Math.cos(angle) * radius,
    y: 0.5 - Math.sin(angle) * radius,
  };
}

export function sliderValueFromUv(uv) {
  const m = SLIDER_TRACK_MARGIN_UV;
  return THREE.MathUtils.clamp((uv.x - m) / (1 - 2 * m), 0, 1);
}

export function sliderUvFromValue(value) {
  const m = SLIDER_TRACK_MARGIN_UV;
  return m + value * (1 - 2 * m);
}

export function createWheelDecalTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  roundedBackground(ctx, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * WHEEL_RADIUS_UV;

  const hueWheel = ctx.createConicGradient(0, cx, cy);
  for (let i = 0; i <= 6; i += 1) {
    const { r, g, b } = hsvToRgb(i / 6, 1, 1);
    hueWheel.addColorStop(i / 6, colorToRgba(new THREE.Color(r, g, b), 1));
  }
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = hueWheel;
  ctx.fillRect(0, 0, size, size);

  const desaturate = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  desaturate.addColorStop(0, 'rgba(255,255,255,1)');
  desaturate.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = desaturate;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();

  return makeTexture(canvas);
}

// Label-style slider strip: name on the left, gradient track across.
export function createSliderDecalTexture({ label, trackStops }) {
  const width = 512;
  const height = 96;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  roundedBackground(ctx, width, height);

  const m = SLIDER_TRACK_MARGIN_UV * width;
  const trackY = height * 0.62;
  const trackH = height * 0.22;

  const gradient = ctx.createLinearGradient(m, 0, width - m, 0);
  trackStops.forEach(([stop, color]) => gradient.addColorStop(stop, color));
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(m, trackY, width - 2 * m, trackH, trackH / 2);
  ctx.fill();

  ctx.fillStyle = '#e8e8e8';
  ctx.font = LABEL_FONT;
  ctx.textBaseline = 'middle';
  ctx.fillText(label, m, height * 0.28);

  return makeTexture(canvas);
}

// Two-option chip row (e.g. CLEAN | SPLAT). Highlighted chip = activeIndex.
export function createToggleDecalTexture({ options, activeIndex }) {
  const width = 512;
  const height = 96;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  roundedBackground(ctx, width, height);

  const pad = 10;
  const chipWidth = (width - pad * 3) / 2;
  options.forEach((option, i) => {
    const x = pad + i * (chipWidth + pad);
    ctx.fillStyle = i === activeIndex ? '#e8e8e8' : '#2e2e2e';
    ctx.beginPath();
    ctx.roundRect(x, pad, chipWidth, height - pad * 2, 16);
    ctx.fill();

    ctx.fillStyle = i === activeIndex ? '#111111' : '#9a9a9a';
    ctx.font = LABEL_FONT;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(option, x + chipWidth / 2, height / 2 + 2);
    ctx.textAlign = 'left';
  });

  return makeTexture(canvas);
}
