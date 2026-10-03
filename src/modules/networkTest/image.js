import { hashUnit } from './noise';

export const SOURCE_IMAGE_MAX = 480;
const FIELD_MAX = 240;
const TRIES_PER_POINT = 60;
const R2_A = 0.7548776662466927;
const R2_B = 0.5698402909980532;

// The source as fields on a small grid: luma (over white, so a cut-out
// carried by alpha still reads) stretched between its own 2nd and 98th
// percentiles, so a flat webcam frame still spans black to white; Sobel edge
// strength normalised to its own peak; and colour. Built once per frame,
// sampled bilinearly.
export function prepareImage({ channels = 4, data, height, width }) {
  const scale = Math.min(1, FIELD_MAX / Math.max(width, height));
  const w = Math.max(2, Math.round(width * scale));
  const h = Math.max(2, Math.round(height * scale));
  const luma = new Float32Array(w * h);
  const rgb = new Float32Array(w * h * 3);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const sx = Math.min(width - 1, Math.floor((x + 0.5) / scale));
      const sy = Math.min(height - 1, Math.floor((y + 0.5) / scale));
      const o = (sy * width + sx) * channels;
      const alpha = channels === 4 ? data[o + 3] / 255 : 1;
      const i = y * w + x;
      for (let c = 0; c < 3; c += 1) {
        rgb[i * 3 + c] = (data[o + c] / 255) * alpha + (1 - alpha);
      }
      luma[i] =
        0.299 * rgb[i * 3] + 0.587 * rgb[i * 3 + 1] + 0.114 * rgb[i * 3 + 2];
    }
  }
  const sorted = Float32Array.from(luma).sort();
  const low = sorted[Math.floor(sorted.length * 0.02)];
  const high = sorted[Math.floor(sorted.length * 0.98)];
  const range = Math.max(high - low, 0.05);
  for (let i = 0; i < luma.length; i += 1) {
    luma[i] = Math.min(Math.max((luma[i] - low) / range, 0), 1);
  }
  const at = (x, y) =>
    luma[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
  const edge = new Float32Array(w * h);
  let peak = 1e-6;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const gx =
        at(x + 1, y - 1) +
        2 * at(x + 1, y) +
        at(x + 1, y + 1) -
        at(x - 1, y - 1) -
        2 * at(x - 1, y) -
        at(x - 1, y + 1);
      const gy =
        at(x - 1, y + 1) +
        2 * at(x, y + 1) +
        at(x + 1, y + 1) -
        at(x - 1, y - 1) -
        2 * at(x, y - 1) -
        at(x + 1, y - 1);
      const g = Math.hypot(gx, gy);
      edge[y * w + x] = g;
      peak = Math.max(peak, g);
    }
  }
  for (let i = 0; i < edge.length; i += 1) edge[i] /= peak;

  const sample = (grid, stride, u, v, c = 0) => {
    const px = Math.min(Math.max(u * w - 0.5, 0), w - 1);
    const py = Math.min(Math.max(v * h - 0.5, 0), h - 1);
    const x0 = Math.floor(px);
    const y0 = Math.floor(py);
    const x1 = Math.min(x0 + 1, w - 1);
    const y1 = Math.min(y0 + 1, h - 1);
    const fx = px - x0;
    const fy = py - y0;
    const g = (x, y) => grid[(y * w + x) * stride + c];
    const top = g(x0, y0) + (g(x1, y0) - g(x0, y0)) * fx;
    const bottom = g(x0, y1) + (g(x1, y1) - g(x0, y1)) * fx;
    return top + (bottom - top) * fy;
  };

  return {
    aspect: width / height,
    color: (u, v) => [0, 1, 2].map((c) => sample(rgb, 3, u, v, c)),
    edge: (u, v) => sample(edge, 1, u, v),
    luma: (u, v) => sample(luma, 1, u, v),
  };
}

// Light on a dark ground scatters where the picture is bright; ink on paper
// where it is dark; `imageInvert` flips either, so the default is never a
// negative of the picture.
export const scattersBright = (config) =>
  (config.mood !== 'ink') !== Boolean(config.imageInvert);

// The picture as a plane of points facing +z, fitted inside the domain's
// x/y box at its own aspect. Candidates come from one fixed quasi-random
// sequence and each is kept when the density beats its own die, so a frame
// that barely changes keeps nearly the same points: a webcam or a clip does
// not boil.
export function imagePoints(field, config, budget) {
  const bright = scattersBright(config);
  const density = (u, v) => {
    const luma = field.luma(u, v);
    const tone = bright ? luma : 1 - luma;
    const mixed = tone + (field.edge(u, v) - tone) * config.imageEdges;
    return Math.max(mixed, 0) ** config.imageContrast;
  };
  const spanX = config.domainX * config.imageScale;
  const spanY = config.domainY * config.imageScale;
  const halfW = Math.min(spanX, spanY * field.aspect);
  const halfH = halfW / field.aspect;
  const relief = config.imageDepth * config.domainZ;
  const seed = Math.round(config.pointSeed);
  const points = [];
  const colors = [];
  for (
    let i = 0;
    points.length < budget && i < budget * TRIES_PER_POINT;
    i += 1
  ) {
    const u = (0.5 + i * R2_A) % 1;
    const v = (0.5 + i * R2_B) % 1;
    if (density(u, v) > hashUnit(seed, i, 0, 211)) {
      const luma = field.luma(u, v);
      points.push([
        (u * 2 - 1) * halfW,
        (1 - v * 2) * halfH,
        (luma - 0.5) * 2 * relief,
      ]);
      colors.push(field.color(u, v));
    }
  }
  return { colors, halfH, halfW, points };
}
