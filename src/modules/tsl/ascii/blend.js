import {
  If,
  abs,
  clamp,
  float,
  max,
  min,
  mix,
  sqrt,
  step,
  vec3,
  vec4,
} from 'three/tsl';

// pmndrs/postprocessing's blend functions: `dst` is the layer below, `src`
// the effect's output.
const layer = (c) => (dst, src, opacity) =>
  mix(dst, vec4(c(dst.rgb, src.rgb), max(dst.a, src.a)), opacity);

const BLENDS = {
  normal: (dst, src, opacity) => mix(dst, src, opacity),
  add: layer((a, b) => a.add(b)),
  multiply: layer((a, b) => a.mul(b)),
  screen: layer((a, b) => a.add(b).sub(min(a.mul(b), 1))),
  overlay: layer((a, b) =>
    mix(
      b.mul(a).mul(2),
      float(1).sub(b.oneMinus().mul(a.oneMinus()).mul(2)),
      step(0.5, a)
    )
  ),
  softLight: layer((a, b) => {
    const b2 = b.mul(2);
    const d = a.add(b2.sub(1));
    const w = step(0.5, b);
    const lo = a.sub(b2.oneMinus().mul(a).mul(a.oneMinus()));
    const hi = mix(
      d.mul(sqrt(a).sub(a)),
      d.mul(a).mul(a.mul(16).sub(12).mul(a).add(3)),
      w.mul(step(0.25, a).oneMinus())
    );
    return mix(lo, hi, w);
  }),
  hardLight: layer((dst, src) => {
    const a = min(dst, 1);
    const b = min(src, 1);
    return mix(
      a.mul(b).mul(2),
      float(1).sub(a.oneMinus().mul(b.oneMinus()).mul(2)),
      step(0.5, b)
    );
  }),
  colorBurn: layer((a, b) =>
    mix(
      step(0, b).mul(
        float(1).sub(min(vec3(1), a.oneMinus().div(max(b, 1e-9))))
      ),
      vec3(1),
      step(1, a)
    )
  ),
  colorDodge: layer((a, b) =>
    step(0, a).mul(
      mix(min(vec3(1), a.div(max(b.oneMinus(), 1e-9))), vec3(1), step(1, b))
    )
  ),
  linearBurn: layer((a, b) => clamp(b.add(a).sub(1), 0, 1)),
  darken: layer((a, b) => min(a, b)),
  lighten: layer((a, b) => max(a, b)),
  difference: layer((a, b) => abs(a.sub(b))),
  exclusion: layer((a, b) => a.add(b).sub(a.mul(b).mul(2))),
};

export const ASCII_BLEND_MODES = Object.keys(BLENDS);

export const blendLayer = (mode, dst, src, opacity) =>
  (BLENDS[mode] ?? BLENDS.normal)(dst, src, opacity);

// The grain layer's own blend modes, picked at runtime by `mode`.
export function blendNoise(base, n, mode) {
  const b = clamp(base, 0, 1);
  const s = vec3(n);
  const r = vec3(b).toVar();
  If(mode.equal(0), () => {
    r.assign(b.add(n.sub(0.5)));
  })
    .ElseIf(mode.equal(1), () => {
      r.assign(b.mul(s));
    })
    .ElseIf(mode.equal(2), () => {
      r.assign(float(1).sub(b.oneMinus().mul(s.oneMinus())));
    })
    .ElseIf(mode.equal(3), () => {
      r.assign(
        mix(
          b.mul(s).mul(2),
          float(1).sub(b.oneMinus().mul(s.oneMinus()).mul(2)),
          step(0.5, b)
        )
      );
    })
    .ElseIf(mode.equal(4), () => {
      r.assign(s.mul(-2).add(1).mul(b).mul(b).add(s.mul(b).mul(2)));
    })
    .ElseIf(mode.equal(5), () => {
      r.assign(max(b.add(s).sub(1), 0));
    })
    .ElseIf(mode.equal(6), () => {
      r.assign(float(1).sub(b.oneMinus().div(max(s, 1e-3))));
    })
    .ElseIf(mode.equal(7), () => {
      r.assign(b.div(max(s.oneMinus(), 1e-3)));
    });
  return clamp(r, 0, 1);
}
