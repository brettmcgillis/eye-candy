import { fbm2 } from '@utils/noise2d';

import { createRng } from './rng';

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smoothstep = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Luma of an RGB(A) byte grid over white, so a shape carried only by alpha
// (a logo, a cut-out) still reads, resampled bilinearly in canvas units.
function imageSampler({ data, height, width, channels = 4 }, canvas, fit) {
  const luma = new Float32Array(width * height);
  for (let i = 0; i < width * height; i += 1) {
    const o = i * channels;
    const alpha = channels === 4 ? data[o + 3] / 255 : 1;
    const l =
      (0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2]) / 255;
    luma[i] = l * alpha + (1 - alpha);
  }
  const scaleX = width / canvas.width;
  const scaleY = height / canvas.height;
  const scale =
    fit === 'contain' ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
  const offsetX = (width - canvas.width * scale) / 2;
  const offsetY = (height - canvas.height * scale) / 2;
  const at = (ix, iy) =>
    luma[
      Math.min(height - 1, Math.max(0, iy)) * width +
        Math.min(width - 1, Math.max(0, ix))
    ];

  return (x, y) => {
    const px = x * scale + offsetX - 0.5;
    const py = y * scale + offsetY - 0.5;
    if (px < -0.5 || py < -0.5 || px > width - 0.5 || py > height - 0.5) {
      return 1;
    }
    const ix = Math.floor(px);
    const iy = Math.floor(py);
    const fx = px - ix;
    const fy = py - iy;
    const top = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * fx;
    const bottom = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * fx;
    return top + (bottom - top) * fy;
  };
}

function proceduralSampler(config, canvas) {
  const seed = config.fieldNoise + 1;
  const rng = createRng(`field:${config.fieldNoise}`);
  const octaves = config.fieldOctaves;
  const scale = config.fieldScale;
  const cx = canvas.width / 2000;
  const cy = canvas.height / 2000;
  const center = [cx + rng.signed() * cx * 0.4, cy + rng.signed() * cy * 0.4];
  const angle = rng() * TAU;
  const dir = [Math.cos(angle), Math.sin(angle)];
  const blobs = Array.from(
    { length: Math.max(1, Math.round(scale * 2)) },
    () => ({
      r: (0.08 + rng() * 0.22) * Math.min(cx, cy) * 2,
      x: rng() * cx * 2,
      y: rng() * cy * 2,
    })
  );
  const noise = (x, y, salt = 0) => fbm2(x, y, { octaves, seed: seed + salt });

  const warp = (u, v) => {
    if (config.fieldWarp <= 0) return [u, v];
    const w = config.fieldWarp / scale;
    return [
      u + (noise(u * scale + 5.2, v * scale + 1.3, 7) - 0.5) * w,
      v + (noise(u * scale + 9.7, v * scale + 3.1, 13) - 0.5) * w,
    ];
  };

  const shapes = {
    blobs(u, v) {
      let d = Infinity;
      blobs.forEach((b) => {
        d = Math.min(d, Math.hypot(u - b.x, v - b.y) - b.r);
      });
      return 1 - smoothstep(-0.03, 0.03, d);
    },
    fbm: (u, v) => noise(u * scale, v * scale),
    radial: (u, v) =>
      clamp01(Math.hypot(u - center[0], v - center[1]) / Math.hypot(cx, cy)),
    ridged: (u, v) => 1 - Math.abs(noise(u * scale, v * scale) * 2 - 1),
    rings: (u, v) =>
      0.5 +
      0.5 * Math.cos(Math.hypot(u - center[0], v - center[1]) * TAU * scale),
    stripes: (u, v) =>
      0.5 + 0.5 * Math.cos((u * dir[0] + v * dir[1]) * TAU * scale),
  };
  const shape = shapes[config.field] ?? shapes.fbm;

  return (x, y) => {
    const [u, v] = warp(x / 1000, y / 1000);
    return shape(u, v);
  };
}

// The source image's colour at (x, y), over white, bilinear, with the same
// fit as the luma the variance driver reads.
function imageRgbSampler({ data, height, width, channels = 4 }, canvas, fit) {
  const scaleX = width / canvas.width;
  const scaleY = height / canvas.height;
  const scale =
    fit === 'contain' ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
  const offsetX = (width - canvas.width * scale) / 2;
  const offsetY = (height - canvas.height * scale) / 2;
  const texel = (ix, iy) => {
    const o =
      (Math.min(height - 1, Math.max(0, iy)) * width +
        Math.min(width - 1, Math.max(0, ix))) *
      channels;
    const alpha = channels === 4 ? data[o + 3] / 255 : 1;
    return [0, 1, 2].map((c) => data[o + c] * alpha + 255 * (1 - alpha));
  };

  return (x, y) => {
    const px = x * scale + offsetX - 0.5;
    const py = y * scale + offsetY - 0.5;
    if (px < -0.5 || py < -0.5 || px > width - 0.5 || py > height - 0.5) {
      return [255, 255, 255];
    }
    const ix = Math.floor(px);
    const iy = Math.floor(py);
    const fx = px - ix;
    const fy = py - iy;
    const [a, b, c, d] = [
      texel(ix, iy),
      texel(ix + 1, iy),
      texel(ix, iy + 1),
      texel(ix + 1, iy + 1),
    ];
    return a.map((v, i) => {
      const top = v + (b[i] - v) * fx;
      const bottom = c[i] + (d[i] - c[i]) * fx;
      return top + (bottom - top) * fy;
    });
  };
}

// colorMode 'source': (x, y) → [r, g, b] 0..255 from the source image, or
// null without one (the shader falls back to the field's grey).
export function createSourceColor(config, canvas, { image = null } = {}) {
  if (config.field !== 'image' || !image) return null;
  const sample = imageRgbSampler(image, canvas, config.imageFit);
  if (!config.imageInvert) return sample;
  return (x, y) => sample(x, y).map((c) => 255 - c);
}

// value(x, y) in canvas units → 0..1. The variance driver and value colouring
// both read it; `none` is flat so nothing variance-driven ever splits.
export default function createField(config, canvas, { image = null } = {}) {
  let raw;
  if (config.field === 'none') raw = () => 0.5;
  else if (config.field === 'image') {
    raw = image ? imageSampler(image, canvas, config.imageFit) : () => 0.5;
  } else raw = proceduralSampler(config, canvas);

  const contrast = config.fieldContrast;
  const invert = config.field === 'image' && config.imageInvert;
  return (x, y) => {
    const v = raw(x, y);
    const shaped = clamp01(0.5 + ((invert ? 1 - v : v) - 0.5) * contrast);
    return shaped;
  };
}
