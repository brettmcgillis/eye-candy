import { Fn, Loop, float, fract, smoothstep, vec2, vec3 } from 'three/tsl';

import { fold1, foldMirror2, rot2 } from './folds';
import { sdBox } from './shapes';

// The inversion divides by |p|^2, which is exactly zero at every fold centre —
// the whole lattice axis in the tree's case. The Shadertoy originals carry the
// division unguarded and render a NaN pixel there; clamping the radius keeps
// the value finite for anything that has to *evaluate* the field rather than
// just shade it, at a magnitude far below what the fold can resolve.
const MIN_RADIUS_SQ = 1e-12;

// "Apollian" by mrange (https://www.shadertoy.com/view/4ds3zn) — the 4D
// Apollonian gasket. Callers slice it by supplying a w and rotating the
// xw/yw/zw planes before the call.
export const apollian4 = Fn(([pIn, s, folds]) => {
  const p = pIn.toVar();
  const scale = float(1).toVar();

  Loop({ end: folds, start: 0, type: 'int' }, () => {
    p.assign(fract(p.mul(0.5).add(0.5)).mul(2).sub(1));
    const k = s.div(p.dot(p).max(MIN_RADIUS_SQ));
    p.mulAssign(k);
    scale.mulAssign(k);
  });

  const ap = p.abs().div(scale);
  return ap.yw.length().min(ap.xz.length()).mul(0.55);
});

// "A gnarly apollian tree" by mrange (https://www.shadertoy.com/view/3ttGRs).
// The Apollonian inversion is the same; what makes it a tree is folding the
// domain into a mirrored, twisted lattice first, so each iteration branches.
export const apollianTree = Fn(
  ([pIn, scaleBase, scaleGain, twist, periodY, periodXZ, folds]) => {
    const p = pIn.toVar();
    const s = scaleBase.add(smoothstep(0.15, 1.5, pIn.y).mul(scaleGain));
    const scale = float(1).toVar();

    Loop({ end: folds, start: 0, type: 'int' }, () => {
      p.y.assign(fold1(p.y, periodY));
      const swept = rot2(foldMirror2(vec2(p.x, p.z), vec2(periodXZ)), twist);
      p.x.assign(swept.x);
      p.z.assign(swept.y);

      const k = s.div(p.dot(p).max(MIN_RADIUS_SQ));
      p.mulAssign(k);
      scale.mulAssign(k);
    });

    const d = sdBox(p.sub(0.1), vec3(1, 2, 1)).sub(0.5);
    return d.abs().sub(0.01).mul(0.25).div(scale);
  }
);
