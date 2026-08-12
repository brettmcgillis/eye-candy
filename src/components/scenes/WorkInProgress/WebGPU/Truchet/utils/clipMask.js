import {
  abs,
  clamp,
  cos,
  dot,
  max,
  min,
  positionWorld,
  select,
  sign,
  sin,
  smoothstep,
  vec2,
} from 'three/tsl';

import { selectByIndex } from './sdf';

// Keys must equal their Leva option string uppercased with no separators
// (see useTileMesh.js's clipShapeCode: clipShape.toUpperCase()) — e.g.
// 'roundedSquare' -> 'ROUNDEDSQUARE', not 'ROUNDED_SQUARE'. A mismatched key
// here silently falls back to NONE (this is what broke roundedSquare).
export const CLIP_SHAPE = {
  NONE: 0,
  CIRCLE: 1,
  SQUARE: 2,
  ROUNDEDSQUARE: 3,
  HEXAGON: 4,
};

function rotate2D(p, angle) {
  const c = cos(angle);
  const s = sin(angle);
  return vec2(p.x.mul(c).sub(p.y.mul(s)), p.x.mul(s).add(p.y.mul(c)));
}

function circleSDF(p, radius) {
  return p.length().sub(radius);
}

function squareSDF(p, radius) {
  return max(abs(p.x), abs(p.y)).sub(radius);
}

// Standard rounded-box SDF, corner radius as a fraction (0-1) of `radius` so
// it scales with the shape instead of needing its own world-unit control.
function roundedSquareSDF(p, radius, cornerRadiusFraction) {
  const cornerRadius = radius.mul(cornerRadiusFraction);
  const b = radius.sub(cornerRadius);
  const qx = abs(p.x).sub(b);
  const qy = abs(p.y).sub(b);
  const outside = vec2(max(qx, 0), max(qy, 0)).length();
  const inside = min(max(qx, qy), 0);
  return outside.add(inside).sub(cornerRadius);
}

// Regular flat-top hexagon SDF (Inigo Quilez's formula). `radius` is the
// apothem (distance to the flat edges), same convention as squareSDF's
// radius — matches the hex tile grid closely enough to border it; nudge
// clipRotation if the flats don't land where you want.
const HEX_FOLD = vec2(-0.866025404, 0.5);
const HEX_TANGENT = 0.577350269; // tan(30deg), == 1 / sqrt(3)
function hexagonSDF(p, radius) {
  const ap = vec2(abs(p.x), abs(p.y));
  const fold = min(dot(HEX_FOLD, ap), 0).mul(2);
  const folded = ap.sub(HEX_FOLD.mul(fold));
  const clampedX = clamp(
    folded.x,
    radius.mul(-HEX_TANGENT),
    radius.mul(HEX_TANGENT)
  );
  const q = vec2(folded.x.sub(clampedX), folded.y.sub(radius));
  return q.length().mul(sign(q.y));
}

// Signed distance (world units) from the current pixel to the clip
// boundary — negative inside, positive outside, 0 exactly on the boundary.
// Shared by clipAlpha (hide outside) and clipBorderMask (ring straddling
// the boundary) so both agree exactly on where the edge is.
function clipSignedDistance({
  borderInsetU,
  clipCornerRadiusU,
  clipRotationU,
  clipShapeU,
  patternExtentU,
}) {
  const radius = patternExtentU.mul(borderInsetU.oneMinus());
  const p = rotate2D(positionWorld.xy, clipRotationU.negate());
  return selectByIndex(clipShapeU, [
    circleSDF(p, radius), // NONE — unused, gated out by the callers below
    circleSDF(p, radius),
    squareSDF(p, radius),
    roundedSquareSDF(p, radius, clipCornerRadiusU),
    hexagonSDF(p, radius),
  ]);
}

// 1 inside the clip shape, 0 outside — AA-thresholded so the boundary reads
// clean at any zoom.
export function clipAlpha(params) {
  const dist = clipSignedDistance(params);
  const aa = dist.fwidth().max(0.001);
  const inside = smoothstep(aa, aa.negate(), dist);
  return select(params.clipShapeU.equal(CLIP_SHAPE.NONE), 1, inside);
}

// 1 in a `thicknessU`-wide ring straddling the boundary, 0 elsewhere — the
// frame drawn when a border is enabled.
export function clipBorderMask(params, thicknessU) {
  const dist = clipSignedDistance(params);
  const aa = dist.fwidth().max(0.001);
  const band = smoothstep(thicknessU.add(aa), thicknessU.sub(aa), abs(dist));
  return select(params.clipShapeU.equal(CLIP_SHAPE.NONE), 0, band);
}
