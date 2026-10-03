import { createRng } from '@modules/flora';
import { fbm2 } from '@utils/noise2d';

import { coverUv, prepareImage } from './image';
import { referencePlane } from './noise';

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

function shapeDriver(config, aspect) {
  const rng = createRng(`shape:${config.fieldSeed}`);
  const seed = Math.round(config.fieldSeed) + 1;
  const scale = config.shapeScale;
  const octaves = Math.round(config.shapeOctaves);
  const center = [
    aspect * (0.5 + rng.signed() * 0.2),
    0.5 + rng.signed() * 0.2,
  ];
  const angle = rng() * TAU;
  const dir = [Math.cos(angle), Math.sin(angle)];
  const blobs = Array.from(
    { length: Math.max(2, Math.round(scale * 3)) },
    () => ({
      phase: rng() * TAU,
      r: 0.06 + rng() * 0.18,
      x: rng() * aspect,
      y: rng(),
    })
  );
  const reach = Math.hypot(aspect, 1) / 2;
  const noise = (u, v) => fbm2(u * scale, v * scale, { octaves, seed });

  const kinds = {
    blobs(u, v, t) {
      let sum = 0;
      blobs.forEach((b) => {
        const x = b.x + Math.sin(t * 0.7 + b.phase) * b.r;
        const y = b.y + Math.cos(t * 0.5 + b.phase) * b.r;
        const d = Math.hypot(u - x, v - y);
        sum += Math.exp(-((d / b.r) ** 2));
      });
      return clamp01(sum);
    },
    fbm: (u, v, t) => noise(u + t, v),
    radial: (u, v, t) =>
      clamp01(
        Math.hypot(u - center[0], v - center[1]) / reach +
          0.1 * Math.sin(t * TAU)
      ),
    ridged: (u, v, t) => 1 - Math.abs(noise(u + t, v) * 2 - 1),
    rings: (u, v, t) =>
      0.5 +
      0.5 *
        Math.cos((Math.hypot(u - center[0], v - center[1]) * scale - t) * TAU),
    stripes: (u, v, t) =>
      0.5 + 0.5 * Math.cos(((u * dir[0] + v * dir[1]) * scale - t) * TAU),
  };
  const kind = kinds[config.shapeKind] ?? kinds.fbm;
  return (u, v, t) => kind(u, v, t * config.shapeSpeed);
}

function focalDriver(config, aspect) {
  const rng = createRng(`focal:${config.fieldSeed}`);
  const points = Array.from({ length: Math.round(config.focalCount) }, () => ({
    ax: 0.1 + rng() * 0.2,
    ay: 0.1 + rng() * 0.2,
    fx: 0.6 + rng() * 0.8,
    fy: 0.6 + rng() * 0.8,
    phase: rng() * TAU,
    x: aspect * (0.15 + rng() * 0.7),
    y: 0.15 + rng() * 0.7,
  }));
  const falloff = config.focalFalloff;
  return (u, v, t) => {
    const s = t * config.focalSpeed * TAU;
    let sum = 0;
    points.forEach((p) => {
      const x = p.x + Math.sin(s * p.fx + p.phase) * p.ax;
      const y = p.y + Math.cos(s * p.fy + p.phase * 1.3) * p.ay;
      const d = Math.hypot(u - x, v - y) / falloff;
      sum += Math.exp(-d * d);
    });
    return clamp01(sum);
  };
}

// A webcam frame is prepared once however many builds read it.
const preparedCache = new WeakMap();
function preparedOf(image, blur) {
  const entry = preparedCache.get(image);
  if (entry?.blur === blur) return entry.prepared;
  const prepared = prepareImage(image, blur);
  preparedCache.set(image, { blur, prepared });
  return prepared;
}

function noiseOffset(seed) {
  if (!seed) return [0, 0, 0];
  const rng = createRng(`noise:${seed}`);
  return [rng() * 997, rng() * 997, rng() * 997];
}

// The field as value(u, v, t) in 0..1, u across 0..aspect and v up 0..1 in
// frame heights. Each driver gives 0..1 and they average by weight, so a
// weight of 1 with the rest at 0 solos it.
export default function createField(config, { aspect, image = null }) {
  const [ox, oy, oz] = noiseOffset(config.fieldSeed);
  const scale = config.noiseScale;
  const prepared =
    image && config.weightImage > 0
      ? preparedOf(image, config.imageBlur)
      : null;
  const toImage = prepared ? coverUv(aspect, prepared.aspect) : null;
  const shape = shapeDriver(config, aspect);
  const focal = focalDriver(config, aspect);
  const weights = [
    config.weightNoise,
    config.weightShape,
    prepared ? config.weightImage : 0,
    config.weightFocal,
  ];
  const total = weights.reduce((sum, w) => sum + w, 0);
  const warp = config.warpAmount / config.warpScale;
  const ws = config.warpScale;
  const contrast = config.fieldContrast;

  // The field frozen at time t, as (u, v) → 0..1.
  function at(t) {
    const z = t * config.noiseSpeed + oz;
    const noise = weights[0] > 0 ? referencePlane(z) : null;
    const warpU = warp > 0 ? referencePlane(z) : null;
    const warpV = warp > 0 ? referencePlane(z + 4.4) : null;
    return (u0, v0) => {
      let u = u0;
      let v = v0;
      if (warp > 0) {
        u += (warpU(u0 * ws + 5.2, v0 * ws + 1.3) - 0.5) * 2 * warp;
        v += (warpV(u0 * ws + 9.7, v0 * ws + 3.1) - 0.5) * 2 * warp;
      }
      let sum = 0;
      if (noise) sum += weights[0] * noise(u * scale + ox, v * scale + oy);
      if (weights[1] > 0) sum += weights[1] * shape(u, v, t);
      if (weights[2] > 0) {
        const luma = prepared.luma(...toImage(u, v));
        sum += weights[2] * (config.imageInvert ? 1 - luma : luma);
      }
      if (weights[3] > 0) sum += weights[3] * focal(u, v, t);
      const f = total > 0 ? sum / total : 0.5;
      return clamp01(0.5 + (f - 0.5) * contrast);
    };
  }

  return {
    at,
    color: prepared ? (u, v) => prepared.color(...toImage(u, v)) : null,
    value: (u, v, t) => at(t)(u, v),
  };
}

export function gridSize(config, aspect) {
  const ny = Math.max(2, Math.round(config.resolution));
  return { nx: Math.max(2, Math.round(ny * aspect)), ny };
}

// The field sampled at the grid's vertices, row-major from the bottom row;
// vertex (i, j) sits at u = aspect·i/nx, v = j/ny.
export function sampleGrid(field, { aspect, nx, ny, time }) {
  const value = field.at(time);
  const values = new Float32Array((nx + 1) * (ny + 1));
  for (let j = 0; j <= ny; j += 1) {
    const v = j / ny;
    for (let i = 0; i <= nx; i += 1) {
      values[j * (nx + 1) + i] = value((aspect * i) / nx, v);
    }
  }
  return values;
}

// The source's colour at each vertex, RGBA, or null without a source.
export function sampleColors(field, { aspect, nx, ny }) {
  if (!field.color) return null;
  const rgba = new Float32Array((nx + 1) * (ny + 1) * 4);
  for (let j = 0; j <= ny; j += 1) {
    for (let i = 0; i <= nx; i += 1) {
      const o = (j * (nx + 1) + i) * 4;
      const [r, g, b] = field.color((aspect * i) / nx, j / ny);
      rgba[o] = r;
      rgba[o + 1] = g;
      rgba[o + 2] = b;
      rgba[o + 3] = 1;
    }
  }
  return rgba;
}
