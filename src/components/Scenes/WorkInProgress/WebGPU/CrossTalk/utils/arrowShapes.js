import * as THREE from 'three/webgpu';

import { assignVariants } from './variantAssignment';

// Six flat polygon arrows — the "regular arrows" style, alongside
// signVariants.js's real road-sign-image style (see GravityArrow.jsx's
// `signStyle` prop). Local space: +X is the pointing direction, tip at
// (length, 0), symmetric about y=0.

// notch > 0 makes the shaft poke forward past headStart before the
// boundary jumps back-and-out to the wide flare corner, then forward again
// to the tip — the concave "wings" look of a chevron road-arrow. notch = 0
// collapses to a plain flat-backed arrowhead (no jump-back, no concavity).
function arrowVertices({ length, shaftWidth, headWidth, headStart, notch }) {
  const notchX = headStart + notch;
  return [
    [0, -shaftWidth / 2], // 0 shaft back-bottom
    [notchX, -shaftWidth / 2], // 1 shaft front-bottom / notch valley
    [headStart, -headWidth / 2], // 2 flare corner bottom
    [length, 0], // 3 tip
    [headStart, headWidth / 2], // 4 flare corner top
    [notchX, shaftWidth / 2], // 5 notch valley / shaft front-top
    [0, shaftWidth / 2], // 6 shaft back-top
  ];
}

function sub(p, q) {
  return [p[0] - q[0], p[1] - q[1]];
}
function add(p, q) {
  return [p[0] + q[0], p[1] + q[1]];
}
function scaleVec(p, s) {
  return [p[0] * s, p[1] * s];
}
function normalize(p) {
  const len = Math.hypot(p[0], p[1]) || 1;
  return [p[0] / len, p[1] / len];
}

// Builds a THREE.Shape from arrowVertices, rounding the vertices in
// `radii` (Map of vertex index -> radius) by inserting a quadraticCurveTo
// that uses the original (sharp) vertex as its control point — the same
// construction as SVG's "Q" command, verified against a rendered preview
// (both an SVG mockup and the actual shipped ShapeGeometry re-rendered
// through real Three.js) before this shipped.
function buildArrowShape(params) {
  const verts = arrowVertices(params);
  const radii = new Map();
  if (params.cornerRound) {
    radii.set(2, params.cornerRound);
    radii.set(4, params.cornerRound);
  }
  if (params.tipRound) radii.set(3, params.tipRound);

  const shape = new THREE.Shape();
  const n = verts.length;
  for (let i = 0; i < n; i += 1) {
    const prev = verts[(i - 1 + n) % n];
    const cur = verts[i];
    const next = verts[(i + 1) % n];
    const radius = radii.get(i);
    if (radius) {
      const toPrev = normalize(sub(prev, cur));
      const toNext = normalize(sub(next, cur));
      const a = add(cur, scaleVec(toPrev, radius));
      const b = add(cur, scaleVec(toNext, radius));
      if (i === 0) shape.moveTo(a[0], a[1]);
      else shape.lineTo(a[0], a[1]);
      shape.quadraticCurveTo(cur[0], cur[1], b[0], b[1]);
    } else if (i === 0) {
      shape.moveTo(cur[0], cur[1]);
    } else {
      shape.lineTo(cur[0], cur[1]);
    }
  }
  shape.closePath();
  return shape;
}

const VARIANT_PARAMS = [
  {
    length: 44,
    shaftWidth: 9,
    headWidth: 28,
    headStart: 18,
    notch: 5,
    cornerRound: 0,
    tipRound: 0,
  },
  {
    length: 40,
    shaftWidth: 7,
    headWidth: 24,
    headStart: 14,
    notch: 9,
    cornerRound: 0,
    tipRound: 0,
  },
  {
    length: 44,
    shaftWidth: 10,
    headWidth: 27,
    headStart: 21,
    notch: 4,
    cornerRound: 8,
    tipRound: 6,
  },
  {
    length: 42,
    shaftWidth: 8,
    headWidth: 22,
    headStart: 22,
    notch: 0,
    cornerRound: 0,
    tipRound: 0,
  },
  {
    length: 46,
    shaftWidth: 13,
    headWidth: 32,
    headStart: 22,
    notch: 0,
    cornerRound: 0,
    tipRound: 0,
  },
  {
    length: 42,
    shaftWidth: 6,
    headWidth: 20,
    headStart: 20,
    notch: 3,
    cornerRound: 1.5,
    tipRound: 2.5,
  },
];

// Built once at module load — six ShapeGeometry instances shared by every
// GravityArrow across every window, never per-instance/per-render.
export const ARROW_VARIANTS = VARIANT_PARAMS.map((params) => ({
  geometry: new THREE.ShapeGeometry(buildArrowShape(params)),
}));

// Assigned as a group, not independently per window — see
// variantAssignment.js for why (independent hash-per-window picks collide
// far more than intuition expects).
export function assignArrowVariants(windows) {
  return assignVariants(windows, ARROW_VARIANTS);
}
