import { float, select, smoothstep } from 'three/tsl';

// WGSL leaves smoothstep with edge0 > edge1 undefined, so every descending ramp
// the reference writes as a reversed smoothstep has to ramp up and invert.
export const rampDown = (high, low, x) => smoothstep(low, high, x).oneMinus();

export const powInv = (t, power) =>
  t.clamp(0, 1).oneMinus().pow(power).oneMinus();

export const easeOut = (t) => {
  const v = t.clamp(0, 1).oneMinus();
  return v.mul(v).oneMinus();
};

// A ramp that leaves the origin flat instead of kinked. Zero smoothing divides
// by zero in the reference too, but the comparison always takes the linear
// branch there, so clamping the divisor only tidies up the discarded half.
export const smoothStart = (t, smoothing) => {
  const s = float(smoothing).max(1e-6).toVar();
  return select(
    t.greaterThanEqual(s),
    t.sub(s.mul(0.5)),
    t.mul(t).mul(0.5).div(s)
  );
};

export const safeNormalize = (n) => {
  const l = n.length().toVar();
  return select(l.greaterThan(1e-10), n.div(l.max(1e-10)), n);
};
