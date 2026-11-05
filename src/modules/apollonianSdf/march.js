import { Break, If, Loop, float } from 'three/tsl';

import {
  HIT_EPSILON,
  MARCH_STEPS,
  MAX_TRACE,
  MIN_STEP,
  SHADOW_STEPS,
} from './constants';

// These fractal fields are not 1-Lipschitz — the gnarly tree's gradient peaks
// around 2.3 — so a full-length step can tunnel through a thin branch. But
// mrange's estimators also carry a constant safety factor of their own (the
// tree's is `0.25 *`), so a `stepScale` *above* 1 is reclaiming slack that is
// already in the field rather than gambling with it. Below 1 buys back the
// margin the fold's gradient eats. Keinert's over-relaxed trace — step long,
// detect a gap between consecutive unbounding spheres, retreat — was measured
// on the tree and is not worth it here: its test fires on almost every step,
// because an estimator this conservative *never* produces overlapping spheres.
//
// Sphere-trace `df` and report where it landed. `iter` is the step count the
// ray survived, which the Shadertoy originals reuse as a free ambient term:
// rays that grind through many steps are the ones deep in a crevice.
export function marchSDF(df, ro, rd, options = {}) {
  const {
    epsilon = HIT_EPSILON,
    maxDist = MAX_TRACE,
    maxSteps = MARCH_STEPS,
    maxTrace = MAX_TRACE,
    stepScale = 1,
    tStart = 0.2,
  } = options;

  const t = float(tStart).toVar();
  const iter = float(maxSteps).toVar();
  const hit = float(0).toVar();

  Loop({ end: maxSteps, start: 0, type: 'int' }, ({ i }) => {
    const d = df(ro.add(rd.mul(t)));

    If(d.lessThan(float(epsilon).mul(t)), () => {
      iter.assign(i.toFloat());
      hit.assign(1);
      Break();
    });

    If(d.greaterThan(maxDist).or(t.greaterThan(maxTrace)), () => {
      iter.assign(i.toFloat());
      Break();
    });

    // Never step less than the hit threshold: if the ray were closer than
    // that it would already have hit above, so this can't overshoot — but it
    // does guarantee forward progress through the degenerate regions where
    // the estimator returns near-zero and the march would otherwise creep
    // until it exhausted its budget.
    t.addAssign(d.mul(stepScale).max(float(epsilon).mul(t)));
  });

  return { hit, iter, t };
}

// Inigo Quilez's soft shadow: the running min of `k*d/t` along the ray is how
// close the ray passed to an occluder, which stands in for a penumbra without
// ever sampling an area light.
export function softShadow(df, origin, dir, options = {}) {
  const {
    hardness = 16,
    maxDist = MAX_TRACE,
    stepScale = 1,
    steps = SHADOW_STEPS,
    tStart = 0.02,
  } = options;

  const t = float(tStart).toVar();
  const shade = float(1).toVar();

  Loop({ end: steps, start: 0, type: 'int' }, () => {
    const d = df(origin.add(dir.mul(t)));
    shade.assign(shade.min(d.mul(hardness).div(t)));

    If(d.lessThan(HIT_EPSILON).or(t.greaterThan(maxDist)), () => {
      shade.assign(shade.min(0));
      Break();
    });

    t.addAssign(d.mul(stepScale).max(MIN_STEP));
  });

  return shade.clamp(0, 1);
}
