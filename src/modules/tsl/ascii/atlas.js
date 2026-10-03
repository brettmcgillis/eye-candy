/* eslint-disable no-param-reassign */
import * as THREE from 'three/webgpu';

const GLYPH_SIZE = 96;
const SDF_SPREAD = 12;
const FONT = `${Math.floor(GLYPH_SIZE * 0.58)}px "Helvetica Neue", Arial, "Apple Symbols", sans-serif`;

function drawGlyphs(chars) {
  const canvas = document.createElement('canvas');
  canvas.width = GLYPH_SIZE * chars.length;
  canvas.height = GLYPH_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = FONT;
  chars.forEach((char, i) => {
    ctx.fillText(char, i * GLYPH_SIZE + GLYPH_SIZE / 2, GLYPH_SIZE / 2);
  });
  return { canvas, ctx };
}

// Row 0 is the canvas top: the kernel's cell-local y runs downward too.
function toTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.flipY = false;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

const charsOf = (charset) => {
  const chars = Array.from(charset ?? '');
  return chars.length ? chars : [' '];
};

export function buildGlyphAtlas(charset) {
  const chars = charsOf(charset);
  return { count: chars.length, texture: toTexture(drawGlyphs(chars).canvas) };
}

// Felzenszwalb-Huttenlocher 1D squared distance transform.
function edt1d(f, d, v, z, n) {
  let k = 0;
  v[0] = 0;
  z[0] = -1e20;
  z[1] = 1e20;
  for (let q = 1; q < n; q += 1) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k -= 1;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k += 1;
    v[k] = q;
    z[k] = s;
    z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q += 1) {
    while (z[k + 1] < q) k += 1;
    const dx = q - v[k];
    d[q] = dx * dx + f[v[k]];
  }
}

function edt2d(grid, w, h) {
  const n = Math.max(w, h);
  const d = new Float64Array(n);
  const v = new Int32Array(n);
  const z = new Float64Array(n + 1);
  const buf = new Float64Array(n);
  for (let x = 0; x < w; x += 1) {
    for (let y = 0; y < h; y += 1) buf[y] = grid[y * w + x];
    edt1d(buf, d, v, z, h);
    for (let y = 0; y < h; y += 1) grid[y * w + x] = d[y];
  }
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) buf[x] = grid[y * w + x];
    edt1d(buf, d, v, z, w);
    for (let x = 0; x < w; x += 1) grid[y * w + x] = d[x];
  }
}

// Red channel: 0.5 on the glyph edge, above inside, below outside, over
// ±SDF_SPREAD px. Interpolating two glyphs' fields and thresholding morphs
// one shape into the other.
export function buildSdfAtlas(charset) {
  const chars = charsOf(charset);
  const { canvas, ctx } = drawGlyphs(chars);
  const size = GLYPH_SIZE;
  const src = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const out = new Uint8ClampedArray(canvas.width * canvas.height * 4);
  const mask = new Uint8Array(size * size);
  const inside = new Float64Array(size * size);
  const outside = new Float64Array(size * size);
  const INF = 1e20;

  chars.forEach((_, g) => {
    let anyIn = false;
    let anyOut = false;
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const isIn = src.data[(y * src.width + g * size + x) * 4 + 3] > 127;
        const p = y * size + x;
        mask[p] = isIn ? 1 : 0;
        inside[p] = isIn ? 0 : INF;
        outside[p] = isIn ? INF : 0;
        anyIn ||= isIn;
        anyOut ||= !isIn;
      }
    }
    edt2d(inside, size, size);
    edt2d(outside, size, size);

    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const p = y * size + x;
        let signed;
        if (!anyIn) signed = -SDF_SPREAD;
        else if (!anyOut) signed = SDF_SPREAD;
        else signed = mask[p] ? Math.sqrt(outside[p]) : -Math.sqrt(inside[p]);
        const value = Math.min(
          1,
          Math.max(0, 0.5 + (signed / SDF_SPREAD) * 0.5)
        );
        const o = (y * canvas.width + g * size + x) * 4;
        const byte = Math.round(value * 255);
        out[o] = byte;
        out[o + 1] = byte;
        out[o + 2] = byte;
        out[o + 3] = 255;
      }
    }
  });

  ctx.putImageData(new ImageData(out, canvas.width, canvas.height), 0, 0);
  return { count: chars.length, texture: toTexture(canvas) };
}
