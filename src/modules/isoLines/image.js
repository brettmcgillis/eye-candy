export const SOURCE_IMAGE_MAX = 480;
const FIELD_MAX = 320;

/* eslint-disable no-param-reassign */
function boxBlur(src, w, h, radius) {
  if (radius <= 0) return src;
  const r = Math.max(1, Math.round(radius));
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const pass = (from, to, horizontal) => {
    const [outer, inner] = horizontal ? [h, w] : [w, h];
    for (let a = 0; a < outer; a += 1) {
      let sum = 0;
      const at = (b) => {
        const c = Math.min(inner - 1, Math.max(0, b));
        return horizontal ? from[a * w + c] : from[c * w + a];
      };
      for (let b = -r; b <= r; b += 1) sum += at(b);
      for (let b = 0; b < inner; b += 1) {
        const i = horizontal ? a * w + b : b * w + a;
        to[i] = sum / (2 * r + 1);
        sum += at(b + r + 1) - at(b - r);
      }
    }
  };
  pass(src, tmp, true);
  pass(tmp, out, false);
  pass(out, tmp, true);
  pass(tmp, out, false);
  return out;
}

// The source as luma (over white, so a cut-out carried by alpha still reads)
// stretched between its own 2nd and 98th percentiles, so a flat webcam frame
// still spans the full range of levels; blurred, since contours of raw
// pixels fray; and colour. Sampled bilinearly in image uv.
export function prepareImage({ channels = 4, data, height, width }, blur = 0) {
  const scale = Math.min(1, FIELD_MAX / Math.max(width, height));
  const w = Math.max(2, Math.round(width * scale));
  const h = Math.max(2, Math.round(height * scale));
  let luma = new Float32Array(w * h);
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
  luma = boxBlur(luma, w, h, blur);
  const sorted = Float32Array.from(luma).sort();
  const low = sorted[Math.floor(sorted.length * 0.02)];
  const high = sorted[Math.floor(sorted.length * 0.98)];
  const range = Math.max(high - low, 0.05);
  for (let i = 0; i < luma.length; i += 1) {
    luma[i] = Math.min(Math.max((luma[i] - low) / range, 0), 1);
  }

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
    luma: (u, v) => sample(luma, 1, u, v),
  };
}

// Domain uv (u across 0..aspect, v up 0..1) to image uv, covering the domain
// at the picture's own aspect.
export function coverUv(aspect, imageAspect) {
  const wide = imageAspect > aspect;
  const sx = wide ? aspect / imageAspect : 1;
  const sy = wide ? 1 : imageAspect / aspect;
  return (u, v) => [0.5 + (u / aspect - 0.5) * sx, 0.5 + (0.5 - v) * sy];
}
