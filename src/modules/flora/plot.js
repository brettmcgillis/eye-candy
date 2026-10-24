import { penPx, silhouetteRuns } from '@modules/plotKit';

import ornamentShading from './ornamentShading';
import { formatPath } from './svgProjection';

const CELL = 2;
const MASS = 0.1;

function boxBlur(source, width, height, radius) {
  const pass = (input, length, count, stride, step) => {
    const output = new Float32Array(input.length);
    for (let line = 0; line < count; line += 1) {
      const base = line * stride;
      let sum = 0;
      let taps = 0;
      for (let i = 0; i < Math.min(radius, length); i += 1) {
        sum += input[base + i * step];
        taps += 1;
      }
      for (let i = 0; i < length; i += 1) {
        const enter = i + radius;
        const leave = i - radius - 1;
        if (enter < length) {
          sum += input[base + enter * step];
          taps += 1;
        }
        if (leave >= 0) {
          sum -= input[base + leave * step];
          taps -= 1;
        }
        output[base + i * step] = sum / taps;
      }
    }
    return output;
  };
  return pass(pass(source, width, height, width, 1), height, width, 1, width);
}

// Each run's cells marked with its ink, and how many cells each ink holds.
function stampRuns(runs, inkOf, inkCount, width, height) {
  const owner = new Int16Array(width * height).fill(-1);
  const cells = new Float64Array(inkCount);
  runs.forEach(({ color, points }) => {
    const ink = inkOf.get(color);
    const put = (x, y) => {
      const cx = Math.floor(x / CELL);
      const cy = Math.floor(y / CELL);
      if (cx >= 0 && cy >= 0 && cx < width && cy < height) {
        owner[cy * width + cx] = ink;
        cells[ink] += 1;
      }
    };
    put(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (CELL / 2));
      for (let s = 1; s <= steps; s += 1) {
        put(a.x + ((b.x - a.x) * s) / steps, a.y + ((b.y - a.y) * s) / steps);
      }
    }
  });
  return { cells, owner };
}

const group = (id, color, stroke, d) =>
  d
    ? `<g id="${id}" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${d}" stroke="${color}" stroke-width="${stroke.toFixed(2)}"/></g>`
    : '';

export default function floraPlotLayers({
  coloring,
  coverage,
  height,
  image,
  options,
  ornaments,
  runs,
  width,
}) {
  const under = ornamentShading({
    coloring,
    coverage,
    height,
    image,
    options,
    ornaments,
    runs,
    width,
  });
  if (!options.svgSilhouette) return { under };
  const gw = Math.ceil(width / CELL);
  const gh = Math.ceil(height / CELL);
  const size = gw * gh;
  const inks = [];
  const inkOf = new Map();
  runs.forEach(({ color, layer }) => {
    if (!inkOf.has(color)) {
      inkOf.set(color, inks.length);
      inks.push({ color, crown: false });
    }
    if (layer !== 'stem') inks[inkOf.get(color)].crown = true;
  });
  if (inks.length === 0) return {};

  const { cells, owner } = stampRuns(runs, inkOf, inks.length, gw, gh);

  const radius = Math.max(1, Math.round(options.svgMassRadius / CELL));
  const best = new Float32Array(size);
  const map = new Int16Array(size).fill(-1);
  inks.forEach((_, ink) => {
    const onehot = new Float32Array(size);
    for (let c = 0; c < size; c += 1) if (owner[c] === ink) onehot[c] = 1;
    const density = boxBlur(onehot, gw, gh, radius);
    for (let c = 0; c < size; c += 1) {
      if (density[c] > MASS && density[c] > best[c]) {
        best[c] = density[c];
        map[c] = ink;
      }
    }
  });

  const stroke = penPx(options) ?? 0.6;
  const scale = 1 / CELL;

  let over = '';
  if (options.svgSilhouette) {
    const covered = new Uint8Array(size);
    for (let c = 0; c < size; c += 1) {
      if (map[c] >= 0 && inks[map[c]].crown) covered[c] = 1;
    }
    const minLength = options.svgMassRadius * 4;
    const d = silhouetteRuns({ covered, height: gh, width: gw }, scale)
      .filter((loop) => {
        let length = 0;
        for (let i = 1; i < loop.length; i += 1) {
          length += Math.hypot(
            loop[i].x - loop[i - 1].x,
            loop[i].y - loop[i - 1].y
          );
        }
        return length >= minLength;
      })
      .map((loop) => `${formatPath(loop)}Z`)
      .join('');
    const crown = inks
      .map((ink, index) => ({ ...ink, cells: cells[index] }))
      .filter((ink) => ink.crown)
      .sort((a, b) => b.cells - a.cells)[0];
    over = group('silhouette', crown?.color ?? inks[0].color, stroke, d);
  }

  return { over, under };
}
