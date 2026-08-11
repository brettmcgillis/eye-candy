import { clamp, dot, select, smoothstep, vec2 } from 'three/tsl';

// Shared TSL distance-field primitives — used by both the square grid
// (motifShader.js) and the triangular grid (triangularMotifs.js).

export const ARC_RADIUS = 0.5;

// Distance to a quarter-circle spine centered at `corner`, radius half the
// tile — reaches the adjacent edge/leg midpoints on both the square and
// triangular grids (both are built from the same unit-square corners).
export function arcSpineDistance(p, corner) {
  return p
    .sub(vec2(...corner))
    .length()
    .sub(ARC_RADIUS)
    .abs();
}

// Distance to the line segment a→b (clamped projection), used for the
// triangular grid's straight-chord motif.
export function segmentDistance(p, a, b) {
  const pa = p.sub(vec2(...a));
  const ba = vec2(...b).sub(vec2(...a));
  const h = clamp(dot(pa, ba).div(dot(ba, ba)), 0, 1);
  return pa.sub(ba.mul(h)).length();
}

// Periodic "distance to nearest stripe center" triangle wave, thresholded
// with an fwidth-derived AA band so line width reads consistently at any
// zoom/pitch (same fwidth+smoothstep AA idiom as three.js's shapeCircle).
export function stripeMask(dSpine, pitchU, strokeWidthU) {
  const tri = dSpine.div(pitchU).add(0.5).fract().sub(0.5).abs().mul(2);
  const widthNorm = strokeWidthU.div(pitchU);
  const aa = dSpine.fwidth().div(pitchU).max(0.001);
  return smoothstep(widthNorm.sub(aa), widthNorm.add(aa), tri).oneMinus();
}

// fillMode: 'solid' fill — thresholds the SAME dSpine field line mode uses
// into one constant-width band around the spine (instead of a periodic
// stripe stack), so the filled region traces the whole arc/chord curve and
// connects across tile edges exactly where the line-mode strokes do —
// continuous flowing bands ("swim lanes"), not isolated per-corner discs.
export function solidBandMask(dSpine, halfWidthU) {
  const aa = dSpine.fwidth().max(0.0005);
  return smoothstep(halfWidthU.add(aa), halfWidthU.sub(aa), dSpine);
}

// Folds a list of TSL nodes into a select() chain keyed by `indexNode`
// (0, 1, 2, ...) — avoids hand-nesting select() once per motif branch,
// needed twice per shader (line field + solid field) and up to 6-wide for
// the triangular grid's motif set.
export function selectByIndex(indexNode, values) {
  let result = values[values.length - 1];
  for (let i = values.length - 2; i >= 0; i -= 1) {
    result = select(indexNode.equal(i), values[i], result);
  }
  return result;
}
