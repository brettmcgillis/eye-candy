import { centroid, lerp } from './geometry';

const clamp01 = (v) => Math.max(0, Math.min(1, v));

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

  const texel = (ix, iy) => {
    const o =
      (Math.min(height - 1, Math.max(0, iy)) * width +
        Math.min(width - 1, Math.max(0, ix))) *
      channels;
    const alpha = channels === 4 ? data[o + 3] / 255 : 1;
    return [0, 1, 2].map((c) => (data[o + c] / 255) * alpha + (1 - alpha));
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
    const a = texel(ix, iy);
    const b = texel(ix + 1, iy);
    const c = texel(ix, iy + 1);
    const d = texel(ix + 1, iy + 1);
    const colour = a.map((v, i) => {
      const top = v + (b[i] - v) * fx;
      return top + (c[i] + (d[i] - c[i]) * fx - top) * fy;
    });
    return invert ? colour.map((v) => 1 - v) : colour;
  };

  const lumaOf = ([r, g, b]) =>
    clamp01(0.5 + (0.299 * r + 0.587 * g + 0.114 * b - 0.5) * contrast);

  return { luma: (x, y) => lumaOf(rgb(x, y)), lumaOf, rgb };
}

// Mean, spread and colour of the image over a cell: the centre, rings a
// third and two thirds of the way to each corner, and each side's middle.
export function cellStats(poly, sampler) {
  const c = centroid(poly);
  const points = [c];
  poly.forEach((v, i) => {
    points.push(lerp(c, v, 0.33), lerp(c, v, 0.7));
    points.push(lerp(c, lerp(v, poly[(i + 1) % poly.length], 0.5), 0.6));
  });
  let sum = 0;
  let sumSq = 0;
  const colour = [0, 0, 0];
  points.forEach(([x, y]) => {
    const rgb = sampler.rgb(x, y);
    const l = sampler.lumaOf(rgb);
    sum += l;
    sumSq += l * l;
    colour[0] += rgb[0];
    colour[1] += rgb[1];
    colour[2] += rgb[2];
  });
  const mean = sum / points.length;
  return {
    luma: mean,
    rgb: colour.map((v) => v / points.length),
    spread: Math.sqrt(Math.max(0, sumSq / points.length - mean * mean)),
  };
}
