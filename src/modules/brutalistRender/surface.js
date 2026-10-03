/* eslint-disable camelcase */
import {
  abs,
  cos,
  cross,
  dot,
  exp,
  float,
  floor,
  fract,
  fwidth,
  max,
  mx_cell_noise_float,
  mx_noise_float,
  normalView,
  positionView,
  sin,
  smoothstep,
  vec2,
} from 'three/tsl';

// Fades a pattern out once a pixel spans more than its feature: distant
// board seams and tie holes would otherwise shimmer.
export const detailFade = (coord, feature) =>
  smoothstep(feature, feature.mul(0.25), fwidth(coord));

// The shuttering a wall was cast against, in metres: horizontal boards with
// seams and a tone each, pour lifts with cold joints, tie-hole grids.
export function castPattern({ p, seed, u, uniforms }) {
  const v = p.y;
  const bw = uniforms.boardWidth;
  const lift = uniforms.pourLift;
  const liftIndex = floor(v.div(lift));
  const boardIndex = floor(v.div(bw));
  const boardFade = detailFade(v, bw.mul(0.6));

  const f = fract(v.div(bw));
  const seam = smoothstep(float(0.012).div(bw), 0, f.min(f.oneMinus()))
    .mul(uniforms.boardForm)
    .mul(boardFade);
  const grain = mx_noise_float(vec2(u.mul(1.6), v.mul(38)))
    .mul(uniforms.boardForm)
    .mul(boardFade);

  const holeU = float(0.6);
  const holeV = lift.mul(0.5);
  const du = fract(u.div(holeU)).sub(0.5).mul(holeU);
  const dv = fract(v.div(holeV).add(0.5)).sub(0.5).mul(holeV);
  const holeFade = detailFade(u, float(0.1));
  const hole = smoothstep(0.028, 0.02, vec2(du, dv).length())
    .mul(uniforms.tieHoles)
    .mul(holeFade);
  const run = smoothstep(0.03, 0.006, abs(du))
    .mul(smoothstep(0, -0.02, dv))
    .mul(exp(dv.div(lift.mul(0.3))))
    .mul(uniforms.tieHoles)
    .mul(holeFade);

  const liftTone = mx_cell_noise_float(vec2(liftIndex, seed.mul(97))).sub(0.5);
  const boardTone = mx_cell_noise_float(vec2(boardIndex, liftIndex.add(13)))
    .sub(0.5)
    .mul(boardFade);
  const belowJoint = fract(v.div(lift)).oneMinus().mul(lift);

  return { belowJoint, boardTone, grain, hole, liftTone, run, seam };
}

// Rain off every top edge: vertical runs, strongest under the edge and
// fading over `streakLength`, broken up by two scales of noise.
export function rainStreaks({ p, seed, top, u, uniforms }) {
  const below = max(top.sub(p.y), 0);
  const source = exp(below.negate().div(uniforms.streakLength));
  const broad = mx_noise_float(
    vec2(u.mul(0.9).add(seed.mul(37)), p.y.mul(0.035))
  );
  const fine = mx_noise_float(vec2(u.mul(5.5), p.y.mul(0.22)));
  const streak = smoothstep(
    0.05,
    0.65,
    broad.mul(0.6).add(fine.mul(0.4)).add(0.2)
  )
    .mul(source)
    .mul(uniforms.streaks);
  const runs = smoothstep(
    0.25,
    0.9,
    mx_noise_float(vec2(u.mul(1.7), p.y.mul(0.06).add(3.1)))
  ).mul(uniforms.age.mul(0.45));
  return { runs, streak };
}

// The analytic hillside of @modules/brutalist's burialAt, so the splash
// band and the moss follow the ground up a buried wall.
export function burialHeight(p, uniforms) {
  const t = p.x
    .mul(cos(uniforms.burialAngle))
    .add(p.z.mul(sin(uniforms.burialAngle)));
  const span = uniforms.burialSpan;
  return uniforms.burialAmount
    .mul(smoothstep(span.negate(), span, t))
    .mul(smoothstep(span.mul(10), span.mul(4), t));
}

// A procedural height's normal perturbation, in view space.
export function bumpNormal(height) {
  const dpdx = positionView.dFdx();
  const dpdy = positionView.dFdy();
  const r1 = cross(dpdy, normalView);
  const r2 = cross(normalView, dpdx);
  const det = dot(dpdx, r1);
  const grad = r1.mul(height.dFdx()).add(r2.mul(height.dFdy())).mul(det.sign());
  return normalView.mul(abs(det)).sub(grad).normalize();
}
