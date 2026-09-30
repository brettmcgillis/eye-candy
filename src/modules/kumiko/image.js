import { centroid, lerp } from './geometry';

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const LUMA = [0.299, 0.587, 0.114];

// An RGBA byte image fitted over the panel's inner rect (millimetres),
// sampled bilinearly. Luma is taken over white so a cut-out still reads.
export function createImageSampler(
  { channels = 4, data, height, width },
  [x0, y0, x1, y1],
  { contrast = 1, fit = 'cover', invert = false } = {}
) {
  const scaleX = width / (x1 - x0);
  const scaleY = height / (y1 - y0);
  const scale =
    fit === 'contain' ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);
  const offsetX = (width - (x1 - x0) * scale) / 2;
  const offsetY = (height - (y1 - y0) * scale) / 2;

  // The frame composited over white (and inverted) once, so a sample is
  // plain reads.
  const pixels = width * height;
  const plane = new Float32Array(pixels * 3);
  const histogram = new Uint32Array(256);
  for (let i = 0; i < pixels; i += 1) {
    const o = i * channels;
    const alpha = channels === 4 ? data[o + 3] / 255 : 1;
    let l = 0;
    for (let c = 0; c < 3; c += 1) {
      const v = (data[o + c] / 255) * alpha + (1 - alpha);
      plane[i * 3 + c] = invert ? 1 - v : v;
      l += plane[i * 3 + c] * LUMA[c];
    }
    histogram[Math.min(255, Math.round(l * 255))] += 1;
  }
  const texel = (ix, iy, c) => {
    const x = Math.min(width - 1, Math.max(0, ix));
    const y = Math.min(height - 1, Math.max(0, iy));
    return plane[(y * width + x) * 3 + c];
  };

  const rgb = (x, y) => {
    const px = (x - x0) * scale + offsetX - 0.5;
    const py = (y - y0) * scale + offsetY - 0.5;
    if (px < -0.5 || py < -0.5 || px > width - 0.5 || py > height - 0.5) {
      return [1, 1, 1];
    }
    const ix = Math.floor(px);
    const iy = Math.floor(py);
    const fx = px - ix;
    const fy = py - iy;
    const colour = [0, 0, 0];
    for (let i = 0; i < 3; i += 1) {
      const a = texel(ix, iy, i);
      const c = texel(ix, iy + 1, i);
      const top = a + (texel(ix + 1, iy, i) - a) * fx;
      colour[i] = top + (c + (texel(ix + 1, iy + 1, i) - c) * fx - top) * fy;
    }
    return colour;
  };

  // Auto-levels: the frame's 2nd–98th percentile luma is stretched to 0–1
  // before contrast, so a dim or flat webcam frame still spans the ramp.
  const percentile = (q) => {
    let seen = 0;
    for (let i = 0; i < 256; i += 1) {
      seen += histogram[i];
      if (seen >= q * pixels) return i / 255;
    }
    return 1;
  };
  const low = percentile(0.02);
  const span = Math.max(0.05, percentile(0.98) - low);

  const lumaOf = ([r, g, b]) => {
    const l = (0.299 * r + 0.587 * g + 0.114 * b - low) / span;
    return clamp01(0.5 + (l - 0.5) * contrast);
  };

  return { luma: (x, y) => lumaOf(rgb(x, y)), lumaOf, rgb };
}

// Mean, range and colour of the image over a cell: the centre, rings a
// third and two thirds of the way to each corner, and each side's middle.
// Without `spread` a half-way ring is enough for the mean and colour.
export function cellStats(poly, sampler, { spread = true } = {}) {
  const c = centroid(poly);
  const points = [c];
  poly.forEach((v, i) => {
    if (!spread) {
      points.push(lerp(c, v, 0.5));
      return;
    }
    points.push(lerp(c, v, 0.33), lerp(c, v, 0.7));
    points.push(lerp(c, lerp(v, poly[(i + 1) % poly.length], 0.5), 0.6));
  });
  let sum = 0;
  let lo = 1;
  let hi = 0;
  const colour = [0, 0, 0];
  points.forEach(([x, y]) => {
    const rgb = sampler.rgb(x, y);
    const l = sampler.lumaOf(rgb);
    sum += l;
    lo = Math.min(lo, l);
    hi = Math.max(hi, l);
    colour[0] += rgb[0];
    colour[1] += rgb[1];
    colour[2] += rgb[2];
  });
  const mean = sum / points.length;
  return {
    luma: mean,
    rgb: colour.map((v) => v / points.length),
    range: hi - lo,
  };
}
