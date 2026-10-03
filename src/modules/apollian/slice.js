import { traceContours } from '@modules/isoLines';

import createField, { boundRadius, packingFor } from './fields';
import { add3, directionOf, dot3, planeBasis, scale3, sub3 } from './math';
import { colorSource } from './palette';

// The slice plane and the frame laid on it. Frame coordinates are
// traceContours': y in [-1, 1], x in [-aspect, aspect]; one frame unit is
// `half` object units, sized so the bound fits whichever side is shorter.
export function sliceFrame(config, aspect) {
  const n = directionOf(config.sliceAzimuth, config.sliceElevation);
  const { u, v } = planeBasis(n, config.sliceSpin);
  const half = boundRadius(config) / config.sliceZoom / Math.min(aspect, 1);
  const centre = add3(
    scale3(n, config.sliceOffset),
    add3(scale3(u, config.slicePanX), scale3(v, config.slicePanY))
  );
  return { aspect, centre, half, n, u, v };
}

export const pointOn = (frame, x, y, offset = 0) =>
  add3(
    add3(frame.centre, scale3(frame.n, offset)),
    add3(scale3(frame.u, x * frame.half), scale3(frame.v, y * frame.half))
  );

export function layerOffsets(config) {
  if (config.sliceMode !== 'stack') return [0];
  const count = config.stackCount;
  return Array.from(
    { length: count },
    (_, i) => (i - (count - 1) / 2) * config.stackSpacing
  );
}

function sampleLayer(field, frame, offset, config, { nx, ny }) {
  const s = new Float32Array((nx + 1) * (ny + 1));
  const t = new Float32Array(s.length);
  for (let j = 0; j <= ny; j += 1) {
    const y = -1 + (2 * j) / ny;
    for (let i = 0; i <= nx; i += 1) {
      const x = -frame.aspect + (2 * frame.aspect * i) / nx;
      const p = pointOn(frame, x, y, offset);
      const sample = field.sample(p);
      s[j * (nx + 1) + i] = sample.s;
      t[j * (nx + 1) + i] = colorSource(sample, p, config);
    }
  }
  return { s, t };
}

// The contour levels a mode draws, as multiples of `step` in s, and the
// linear map traceContours walks so level k is integer k.
function levelPlan(config, values) {
  if (config.sliceMode === 'bands') {
    const sign = config.bandSide === 'inside' ? -1 : 1;
    const count = config.bandCount;
    const lo = config.bandSide === 'both' ? -(count - 1) : 0;
    const limit = count - 0.5;
    return {
      keep: (k) => k >= lo && k <= count - 1,
      map: (s) =>
        Math.min(Math.max((sign * s) / config.bandStep, lo - 0.5), limit),
      step: sign * config.bandStep,
    };
  }
  let span = 1e-9;
  for (let i = 0; i < values.length; i += 1) {
    span = Math.max(span, Math.abs(values[i]));
  }
  span *= 1.01;
  return { keep: (k) => k === 0, map: (s) => s / span, step: span };
}

function traceLayer(layer, config, grid) {
  const plan = levelPlan(config, layer.s);
  const mapped = Float32Array.from(layer.s, plan.map);
  return traceContours(mapped, grid, { levelOffset: 0, levels: 1 })
    .filter(({ k }) => plan.keep(k))
    .map(({ closed, k, points }) => ({ closed, level: k, points }));
}

// Exact circles where the solid is the packing itself: a sphere's slice is
// a circle, and a band inside it is the slice of the sphere shrunk by k
// steps.
function packingCircles(config, frame, offset) {
  const { spheres } = packingFor(config);
  const gap = 1 - config.classicGap;
  const plane = dot3(frame.n, frame.centre) + offset;
  const bands =
    config.sliceMode === 'bands' && config.bandSide !== 'outside'
      ? config.bandCount
      : 1;
  const circles = [];
  for (let o = 0; o < spheres.length; o += 5) {
    const c = [spheres[o], spheres[o + 1], spheres[o + 2]];
    const r = spheres[o + 3] * gap;
    const h = dot3(frame.n, c) - plane;
    if (Math.abs(h) < r) {
      const rel = sub3(c, frame.centre);
      const x = dot3(rel, frame.u) / frame.half;
      const y = dot3(rel, frame.v) / frame.half;
      const sample = {
        depth: Math.min(Math.log2(1 / spheres[o + 3]) / 7, 1),
        trap: Math.min(spheres[o + 4] / 8, 1),
      };
      const t = colorSource(sample, c, config);
      for (let k = 0; k < bands; k += 1) {
        const rk = r - k * config.bandStep;
        if (rk <= Math.abs(h)) break;
        circles.push({
          level: k,
          r: Math.sqrt(rk * rk - h * h) / frame.half,
          t,
          x,
          y,
        });
      }
    }
  }
  return circles;
}

// Outside bands round the packing are offsets of a union, not circles, so
// they take the traced path like every other field.
export const exactPacking = (config) =>
  config.family === 'classic' &&
  (config.bound === 'sphere' || config.bound === 'open') &&
  !(config.sliceMode === 'bands' && config.bandSide !== 'inside');

// Everything the plot and the slice stills need: one layer per stacked
// plane (one for section and bands), each with its sampled grid, its traced
// contours and, for the packing, its exact circles.
export default function buildSlice(config, { aspect, resolution }) {
  const frame = sliceFrame(config, aspect);
  const field = createField(config, { withCut: false });
  const nx = Math.max(
    8,
    Math.round(aspect >= 1 ? resolution : resolution * aspect)
  );
  const ny = Math.max(
    8,
    Math.round(aspect >= 1 ? resolution / aspect : resolution)
  );
  const grid = { aspect, nx, ny };
  const exact = exactPacking(config);

  const layers = layerOffsets(config).map((offset, index) => {
    const sampled = sampleLayer(field, frame, offset, config, grid);
    return {
      circles: exact ? packingCircles(config, frame, offset) : [],
      index,
      lines: exact ? [] : traceLayer(sampled, config, grid),
      offset,
      ...sampled,
    };
  });
  return { frame, grid, layers };
}
