import {
  Fn,
  If,
  cos,
  dFdx,
  dFdy,
  dot,
  exp,
  float,
  floor,
  fract,
  max,
  mix,
  normalize,
  pow,
  sin,
  smoothstep,
  vec2,
  vec3,
} from 'three/tsl';

import { REF, fmod } from './common';

const FIRE_COL_W = 0.06;
const FIRE_CYCLES = 4;
const FIRE_RISE = 2;
const SHIM_COL_W = 0.018;
const SHIM_CYCLES = 37;
const SHIM_RISE = 9;

// grade.glsl: L4, the core's glow and low-fire flicker, then a hue-split
// gain.
export default function createGrade(u, c, zones) {
  const GLOW_CENTER = vec2(...zones.places.glowCentre);
  const GLOW_RADIUS = vec2(...zones.places.glowRadius);
  const FIRE_RADIUS = vec2(...zones.places.fireRadius);
  const { hash12, loopPhase } = c;

  const fireNoise = (seed, cycles, shift) => {
    const n = 4 * cycles;
    const x = loopPhase().mul(n).sub(shift);
    const i = floor(x);
    const f = fract(x);
    const a = hash12(vec2(fmod(i, n), seed));
    const b = hash12(vec2(fmod(i.add(1), n), seed));
    return mix(a, b, f.mul(f).mul(f.mul(-2).add(3)))
      .mul(2)
      .sub(1)
      .mul(u.anim);
  };

  const fireField = Fn(([uv, w, cycles, rise, seed]) => {
    const x = uv.x.div(w).sub(0.5);
    const k = floor(x);
    const f = fract(x);
    const sh = uv.y.mul(rise);
    const field = (kk) => {
      const n = cycles.mul(4);
      const xx = loopPhase()
        .mul(n)
        .sub(sh.add(kk.mul(0.37)));
      const i = floor(xx);
      const ff = fract(xx);
      const s = seed.add(kk.mul(1.618));
      const a = hash12(vec2(fmod(i, n), s));
      const b = hash12(vec2(fmod(i.add(1), n), s));
      return mix(a, b, ff.mul(ff).mul(ff.mul(-2).add(3)))
        .mul(2)
        .sub(1)
        .mul(u.anim);
    };
    return mix(field(k), field(k.add(1)), f.mul(f).mul(f.mul(-2).add(3)));
  }).setLayout({
    name: 'impFireField',
    type: 'float',
    inputs: [
      { name: 'uv', type: 'vec2' },
      { name: 'w', type: 'float' },
      { name: 'cycles', type: 'float' },
      { name: 'rise', type: 'float' },
      { name: 'seed', type: 'float' },
    ],
  });

  const layerGlow = Fn(([uv, col]) => {
    const out = vec3(col).toVar();
    const warm = smoothstep(0, 0.08, out.r.sub(out.b));
    const fd = uv.sub(GLOW_CENTER).div(FIRE_RADIUS);
    const fm = exp(dot(fd, fd).negate()).mul(warm);
    const slow = float(0).toVar();
    If(fm.greaterThan(0.01), () => {
      slow.assign(fireField(uv, FIRE_COL_W, FIRE_CYCLES, FIRE_RISE, 3.1));
      const fast = fireField(uv, SHIM_COL_W, SHIM_CYCLES, SHIM_RISE, 7.7);
      const F = fm.mul(u.flicker.mul(slow).add(u.shimmer.mul(fast))).add(1);
      out.mulAssign(pow(vec3(F), vec3(0.8, 1.2, 1.6)));
    });
    const d = uv.sub(GLOW_CENTER).div(GLOW_RADIUS);
    const g = u.glow.mul(exp(dot(d, d).negate())).mul(slow.mul(0.4).add(1));
    const light = u.accent.glowLight.mul(g).mul(warm);
    return out.oneMinus().mul(light.oneMinus()).oneMinus();
  }).setLayout({
    name: 'impGlow',
    type: 'vec3',
    inputs: [
      { name: 'uv', type: 'vec2' },
      { name: 'col', type: 'vec3' },
    ],
  });

  const layerGrade = (col) => {
    const warm = smoothstep(
      -0.4,
      0.4,
      col.r.sub(col.b).div(col.r.add(col.b).add(1e-3))
    );
    return col.mul(mix(u.gradeCool, u.gradeWarm, warm));
  };

  // Impasto: the finished paint's lightness as a height, lit from a low
  // angle, with a wet gloss. Screen derivatives need uniform control flow,
  // so this runs at the pass's top level, never inside a branch.
  const impasto = (col, side) => {
    const h = dot(col, vec3(0.299, 0.587, 0.114))
      .mul(u.impastoRelief)
      .mul(side.div(REF));
    const n = normalize(vec3(dFdx(h).negate(), dFdy(h), 1));
    const az = u.impastoAzimuth.mul(Math.PI / 180);
    const el = u.impastoElevation.mul(Math.PI / 180);
    const light = vec3(cos(el).mul(cos(az)), cos(el).mul(sin(az)), sin(el));
    const shade = max(dot(n, light), 0).div(sin(el));
    const half = normalize(light.add(vec3(0, 0, 1)));
    const gloss = pow(max(dot(n, half), 0), 60).mul(u.impastoGloss);
    return mix(col, col.mul(shade).add(gloss), u.impasto);
  };

  return { fireNoise, impasto, layerGlow, layerGrade };
}
