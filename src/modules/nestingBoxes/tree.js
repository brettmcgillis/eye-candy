/* eslint-disable no-bitwise */
import { MAX_LEVELS } from './renderOptions.mjs';

export const MAX_LEAVES = 2 ** MAX_LEVELS;
export const MAX_NODES = MAX_LEAVES * 2;

const TAU = Math.PI * 2;
const WRAP = 710;
const WRAP_SLIVER = WRAP - 113 * TAU;

export const ZERO_DRIFT = Object.freeze({
  placement: [0, 0, 0],
  shrink: 0,
  size: [0, 0, 0],
  tint: 0,
});

const fract = (v) => v - Math.floor(v);

// CPU twin of nestingBoxesRender's wrappedAngle: the same uint arithmetic, so
// a node lands where the compute kernel puts it.
export function wrappedAngle(id, frequency) {
  const turns = Math.imul(id, Math.floor(frequency)) >>> 0;
  const whole = (turns % WRAP) + Math.floor(turns / WRAP) * WRAP_SLIVER;
  const part = id * fract(frequency);
  return whole + part - Math.floor(part / TAU) * TAU;
}

export const sinShifted = (a, phase) =>
  Math.sin(a) * Math.cos(phase) + Math.cos(a) * Math.sin(phase);

// The node boxes at `level` (heap ids 2^level … 2^(level+1) − 1), walked down
// from the root the way the kernel re-walks each node's root path. `drift`
// is what motion.drift returns for the frame.
export default function treeLevel(config, { drift = ZERO_DRIFT, level } = {}) {
  const depth = Math.min(level ?? config.levels, config.levels);
  const placementPhase = [
    config.placementPhaseX,
    config.placementPhaseY,
    config.placementPhaseZ,
  ];
  const sizePhase = [config.sizePhaseX, config.sizePhaseY, config.sizePhaseZ];
  const shrink = config.shrink + drift.shrink;
  const seed = config.seed >>> 0;

  let centers = new Float64Array(3);
  let radii = new Float64Array([
    config.rootRadiusX,
    config.rootRadiusY,
    config.rootRadiusZ,
  ]);

  for (let d = 1; d <= depth; d += 1) {
    const count = 2 ** d;
    const first = count;
    const weight = (d / config.levels) ** config.driftBias;
    const nextCenters = new Float64Array(count * 3);
    const nextRadii = new Float64Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const id = first + i;
      const parent = i >> 1;
      const bb = (id + seed) >>> 0;
      const pa = wrappedAngle(bb, config.placementFrequency);
      const sa = wrappedAngle(bb, config.sizeFrequency);
      for (let a = 0; a < 3; a += 1) {
        const ra = sinShifted(
          pa,
          placementPhase[a] + drift.placement[a] * weight
        );
        const rb = sinShifted(sa, sizePhase[a] + drift.size[a] * weight);
        const rad = radii[parent * 3 + a];
        const nrad = rad * (rb * config.shrinkJitter + shrink);
        nextRadii[i * 3 + a] = nrad;
        nextCenters[i * 3 + a] = centers[parent * 3 + a] + (rad - nrad) * ra;
      }
    }
    centers = nextCenters;
    radii = nextRadii;
  }

  return { centers, count: 2 ** depth, first: 2 ** depth, level: depth, radii };
}

export function levelBounds({ centers, count, radii }) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < count; i += 1) {
    for (let a = 0; a < 3; a += 1) {
      const c = centers[i * 3 + a];
      const r = Math.abs(radii[i * 3 + a]);
      min[a] = Math.min(min[a], c - r);
      max[a] = Math.max(max[a], c + r);
    }
  }
  return { max, min };
}

// Every level's bounds merged: a growing tree passes through all of them,
// and a box larger than its parent can poke out of the root.
export function treeBounds(config, options) {
  const merged = {
    max: [-Infinity, -Infinity, -Infinity],
    min: [Infinity, Infinity, Infinity],
  };
  for (let level = 0; level <= config.levels; level += 1) {
    const b = levelBounds(treeLevel(config, { ...options, level }));
    for (let a = 0; a < 3; a += 1) {
      merged.min[a] = Math.min(merged.min[a], b.min[a]);
      merged.max[a] = Math.max(merged.max[a], b.max[a]);
    }
  }
  return merged;
}
