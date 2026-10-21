import { chain, simplifyLoop, smooth } from './lines';

const BLUR_PX = 3;
const MIN_RUN_PX = 15;

// Luma 0..1 of the render, box-blurred over `radius` px so a texture's
// grain gives contours rather than speckle.
function blurredLuma({ data, height, width }, radius) {
  const luma = new Float32Array(width * height);
  for (let i = 0; i < luma.length; i += 1) {
    luma[i] =
      (0.2126 * data[i * 4] +
        0.7152 * data[i * 4 + 1] +
        0.0722 * data[i * 4 + 2]) /
      255;
  }
  if (radius < 1) return luma;
  const pass = (from, to, dx, dy) => {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let sum = 0;
        let n = 0;
        for (let k = -radius; k <= radius; k += 1) {
          const sx = x + dx * k;
          const sy = y + dy * k;
          if (sx >= 0 && sy >= 0 && sx < width && sy < height) {
            sum += from[sy * width + sx];
            n += 1;
          }
        }
        // eslint-disable-next-line no-param-reassign
        to[y * width + x] = sum / n;
      }
    }
  };
  const tmp = new Float32Array(luma.length);
  pass(luma, tmp, 1, 0);
  pass(tmp, luma, 0, 1);
  return luma;
}

// Marching squares at `level`, skipping any cell with a corner off the ghost.
function maskedSegments(values, covered, width, height, level) {
  const segments = [];
  const at = (x, y) => values[y * width + x];
  const on = (x, y) => covered[y * width + x];
  const cross = (x0, y0, x1, y1) => {
    const a = at(x0, y0);
    const t = (level - a) / (at(x1, y1) - a);
    return [x0 + (x1 - x0) * t + 0.5, y0 + (y1 - y0) * t + 0.5];
  };
  for (let y = 0; y < height - 1; y += 1) {
    for (let x = 0; x < width - 1; x += 1) {
      if (on(x, y) && on(x + 1, y) && on(x, y + 1) && on(x + 1, y + 1)) {
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
  }
  return segments;
}

const runLength = (run) =>
  run.reduce(
    (sum, p, i) =>
      i ? sum + Math.hypot(p.x - run[i - 1].x, p.y - run[i - 1].y) : 0,
    0
  );

// The render's own markings as line work: brightness contours inside the
// ghost at `levels` equal-area tones (each band holds as much of the ghost
// as the next), so eye rims, textures and painted detail come through
// whatever skin made them. Output pixels.
export default function textureRuns({ coverage, image, levels, pixelRatio }) {
  const { covered, height, width } = coverage;
  const luma = blurredLuma(
    image,
    Math.max(1, Math.round(BLUR_PX * pixelRatio))
  );
  const inside = [];
  for (let i = 0; i < luma.length; i += 5) {
    if (covered[i]) inside.push(luma[i]);
  }
  if (inside.length < 10) return [];
  inside.sort((a, b) => a - b);
  const tones = Array.from(
    { length: levels },
    (_, k) => inside[Math.floor((inside.length * (k + 1)) / (levels + 1))]
  ).filter((tone, k, all) => k === 0 || tone - all[k - 1] > 1e-3);
  return tones.flatMap((tone) =>
    chain(maskedSegments(luma, covered, width, height, tone))
      .map((loop) =>
        smooth(simplifyLoop(loop, 0.5)).map(([x, y]) => ({
          x: x / pixelRatio,
          y: y / pixelRatio,
        }))
      )
      .filter((run) => runLength(run) >= MIN_RUN_PX)
  );
}
