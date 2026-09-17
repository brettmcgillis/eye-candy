/* eslint-disable no-param-reassign */
import {
  float,
  int,
  mx_cell_noise_float as mxCellNoise,
  pow,
  screenSize,
  select,
  smoothstep,
  uniform,
  vec2,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

export function createUniforms(options = {}) {
  return {
    cellSize: uniform(options.cellSize ?? 12),
    levels: uniform(int(options.levels ?? 3)),
    threshold: uniform(options.threshold ?? 0.55),
    varianceThreshold: uniform(options.varianceThreshold ?? 0.12),
    noiseScale: uniform(options.noiseScale ?? 1.5),
    seed: uniform(options.seed ?? 0),
    jitterAmount: uniform(options.jitterAmount ?? 0.12),
    outlineWidth: uniform(options.outlineWidth ?? 0.08),
    outlineStrength: uniform(options.outlineStrength ?? 0.5),
    pointerUV: uniform(options.pointerUV ?? new THREE.Vector2(-1, -1)),
    pointerRadius: uniform(options.pointerRadius ?? 0.25),
    pointerStrength: uniform(options.pointerStrength ?? 0),
  };
}

export function updateUniforms(uniforms, values) {
  if (values.cellSize !== undefined) uniforms.cellSize.value = values.cellSize;
  if (values.levels !== undefined) uniforms.levels.value = values.levels;
  if (values.threshold !== undefined)
    uniforms.threshold.value = values.threshold;
  if (values.varianceThreshold !== undefined)
    uniforms.varianceThreshold.value = values.varianceThreshold;
  if (values.noiseScale !== undefined)
    uniforms.noiseScale.value = values.noiseScale;
  if (values.seed !== undefined) uniforms.seed.value = values.seed;
  if (values.jitterAmount !== undefined)
    uniforms.jitterAmount.value = values.jitterAmount;
  if (values.outlineWidth !== undefined)
    uniforms.outlineWidth.value = values.outlineWidth;
  if (values.outlineStrength !== undefined)
    uniforms.outlineStrength.value = values.outlineStrength;
  if (values.pointerUV !== undefined)
    uniforms.pointerUV.value.set(values.pointerUV.x, values.pointerUV.y);
  if (values.pointerRadius !== undefined)
    uniforms.pointerRadius.value = values.pointerRadius;
  if (values.pointerStrength !== undefined)
    uniforms.pointerStrength.value = values.pointerStrength;
}

// Aspect-corrected screen-UV distance from a point to the pointer, so the
// falloff reads as a circle regardless of viewport shape. `uv` must be the
// current *cell's* center (not the raw per-fragment position) — every
// fragment inside a cell has to agree on the split decision, or the cell
// boundary stops lining up with the grid and reads as a circular seam
// cutting across cells instead of following their edges.
export function pointerDistance(uv, uniforms) {
  const aspect = screenSize.x.div(screenSize.y);
  const delta = uv.sub(uniforms.pointerUV);
  return vec2(delta.x.mul(aspect), delta.y).length();
}

// Standalone pointer driver: no noise or scene sampling at all — a cell
// keeps splitting purely because it's within `pointerRadius` of the cursor,
// halved again each level so deeper levels only fire progressively closer
// to the pointer (a magnifying-glass falloff instead of a flat radius).
// `pointerStrength`'s sign flips the direction (finer vs. coarser toward the
// cursor); a strength of exactly 0 still runs the "finer" direction so the
// driver does something visible the moment it's selected. Only meaningful
// when `driver: 'pointer'` — the `noise`/`variance` drivers ignore the
// pointer entirely, so switching `driver` is a clean, mutually-exclusive
// choice instead of a lingering bias from whatever `pointerStrength` was
// last set to.
export function pointerSplit(cellCenterUV, level, uniforms) {
  const levelRadius = uniforms.pointerRadius.div(pow(2, float(level)));
  const inside = pointerDistance(cellCenterUV, uniforms).lessThan(levelRadius);
  return select(uniforms.pointerStrength.lessThan(0), inside.not(), inside);
}

// Small hashed per-cell brightness offset so neighboring cells read as
// distinct tiles even when the content behind them is flat.
export function brightnessJitter(idNode, uniforms) {
  const jitterHash = mxCellNoise(idNode.add(vec2(91.7, 47.3)));
  return jitterHash.mul(2).sub(1).mul(uniforms.jitterAmount).add(1);
}

// Smoothstepped distance-to-border darkening — `edgeDistMin` is whatever
// shape-local "how close to the cell's edge" measure the caller computed.
export function outlineFactor(edgeDistMin, uniforms) {
  return smoothstep(0, uniforms.outlineWidth, edgeDistMin)
    .oneMinus()
    .mul(uniforms.outlineStrength)
    .oneMinus();
}
