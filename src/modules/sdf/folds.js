import { float, mod, vec2 } from 'three/tsl';

// Domain folds, ported from mrange's Shadertoy helpers. The originals take
// `inout` parameters; these return the folded value instead, because WGSL has
// no multi-component swizzle assignment — `p.xz = v` is not writable, so the
// caller assigns component by component.

export const rot2 = (p, a) => {
  const c = float(a).cos();
  const s = float(a).sin();
  return vec2(c.mul(p.x).add(s.mul(p.y)), s.negate().mul(p.x).add(c.mul(p.y)));
};

export const fold1 = (p, size) => {
  const half = float(size).mul(0.5);
  return mod(float(p).add(half), size).sub(half);
};

export const foldMirror2 = (p, size) => {
  const half = vec2(size).mul(0.5);
  const cell = p.add(half).div(size).floor();
  const folded = mod(p.add(half), size).sub(half);
  return folded.mul(mod(cell, vec2(2)).mul(2).sub(vec2(1)));
};
