import { chain, simplifyLoop, smooth } from './lines';

const INF = 1e20;

// Felzenszwalb–Huttenlocher squared distance transform of one row/column,
// into the caller's scratch arrays.
/* eslint-disable no-param-reassign */
function edt1d(f, n, d, v, z) {
  let k = 0;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  for (let q = 1; q < n; q += 1) {
    let s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) {
      k -= 1;
      s = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    }
    k += 1;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q += 1) {
    while (z[k + 1] < q) k += 1;
    d[q] = (q - v[k]) ** 2 + f[v[k]];
  }
}
/* eslint-enable no-param-reassign */

// Euclidean distance (pixels) from every pixel to the nearest one where
// `seed` holds.
function distanceTo(seed, width, height) {
  const grid = new Float64Array(width * height);
  for (let i = 0; i < grid.length; i += 1) grid[i] = seed(i) ? 0 : INF;
  const size = Math.max(width, height);
  const f = new Float64Array(size);
  const d = new Float64Array(size);
  const v = new Int32Array(size);
  const z = new Float64Array(size + 1);
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) f[y] = grid[y * width + x];
    edt1d(f, height, d, v, z);
    for (let y = 0; y < height; y += 1) grid[y * width + x] = d[y];
  }
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) f[x] = grid[y * width + x];
    edt1d(f, width, d, v, z);
    for (let x = 0; x < width; x += 1) grid[y * width + x] = Math.sqrt(d[x]);
  }
  return grid;
}

// Marching squares at `level` over a pixel grid, in pixel-centre coordinates.
function gridSegments(values, width, height, level) {
  const segments = [];
  const at = (x, y) => values[y * width + x];
  const cross = (x0, y0, x1, y1) => {
    const a = at(x0, y0);
    const t = (level - a) / (at(x1, y1) - a);
    return [x0 + (x1 - x0) * t + 0.5, y0 + (y1 - y0) * t + 0.5];
  };
  for (let y = 0; y < height - 1; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      const corners = [
        [x, y],
        [x + 1, y],
        [x + 1, y + 1],
        [x, y + 1],
      ];
      const hits = [];
      for (let e = 0; e < 4; e += 1) {
        const [ax, ay] = corners[e];
        const [bx, by] = corners[(e + 1) % 4];
        if (at(ax, ay) > level !== at(bx, by) > level) {
          hits.push(cross(ax, ay, bx, by));
        }
      }
      if (hits.length === 2) segments.push(hits);
      if (hits.length === 4) {
        segments.push([hits[0], hits[1]], [hits[2], hits[3]]);
      }
    }
  }
  return segments;
}

// The distances (drawing-buffer px) Outline's band shows a line at, by mode:
// `outline` its outer edge, `rings` every stride across it, and the soft
// modes (glow and the patterns) rings that crowd toward the silhouette as
// their light does.
function levelsFor({ mode, stride, thickness }) {
  if (mode === 'outline') return [thickness];
  if (mode === 'rings') {
    const step = Math.max(1, Math.min(stride, thickness));
    return Array.from(
      { length: Math.floor(thickness / step) },
      (_, k) => (k + 1) * step
    );
  }
  return Array.from({ length: 6 }, (_, k) => thickness * ((k + 1) / 6) ** 1.6);
}

// The skin's Outline post effect as line work: iso-lines of the distance
// from the silhouette (outward, or inward for `inside`), in output pixels.
export default function outlineRuns({ coverage, outline, pixelRatio }) {
  const { covered, height, width } = coverage;
  const distance = outline.inside
    ? distanceTo((i) => !covered[i], width, height)
    : distanceTo((i) => covered[i], width, height);
  return levelsFor(outline).flatMap((level) =>
    chain(gridSegments(distance, width, height, level)).map((loop) =>
      smooth(simplifyLoop(loop, 0.6)).map(([x, y]) => ({
        x: x / pixelRatio,
        y: y / pixelRatio,
      }))
    )
  );
}

// What the outline layer draws for a skin: its own Outline settings under
// `skin`, a forced mode, or nothing. Widths are drawing-buffer pixels, as
// Outline measures them; the overrides are given in output pixels.
export function outlineOf(options, skin) {
  const choice = options.svgOutline ?? 'skin';
  if (choice === 'none') return null;
  if (choice === 'skin' && !skin?.outlineEnabled) return null;
  const ratio = options.pixelRatio ?? 1;
  return {
    inside: choice === 'skin' ? Boolean(skin.outlineInside) : false,
    mode: choice === 'skin' ? skin.outlineMode : choice,
    stride: options.svgOutlineStride
      ? options.svgOutlineStride * ratio
      : (skin?.outlineRingStride ?? 10),
    thickness: options.svgOutlineWidth
      ? options.svgOutlineWidth * ratio
      : (skin?.outlineThickness ?? 16),
  };
}
