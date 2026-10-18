import {
  Fn,
  dot,
  float,
  floor,
  fract,
  max,
  mix,
  pow,
  select,
  smoothstep,
  vec2,
  vec3,
} from 'three/tsl';

import { CANONICAL_U, CANONICAL_V } from '@modules/imperfection';

export const { PI } = Math;
export const TAU = Math.PI * 2;
export const REF = 1024;

// GLSL mod; TSL's mod is WGSL % and truncates.
export const fmod = (x, y) => x.sub(floor(x.div(y)).mul(y));

export const srgbToLinear = (c) => pow(c, vec3(2.2));
export const linearToSrgb = (c) => pow(max(c, 0), vec3(1 / 2.2));

const ROT_C = Math.cos(0.6);
const ROT_S = Math.sin(0.6);

const layout = (name, type, inputs) => ({
  name: `imp${name}`,
  type,
  inputs: Object.entries(inputs).map(([n, t]) => ({ name: n, type: t })),
});

// Hash without Sine (Dave Hoskins, MIT), with the paint seed added to every
// input: seed 0 is the reference painting bit for bit.
export default function createCommon(u) {
  const hash11 = Fn(([p0]) => {
    const p = fract(p0.add(u.paintSeed).mul(0.1031)).toVar();
    p.mulAssign(p.add(33.33));
    p.mulAssign(p.add(p));
    return fract(p);
  }).setLayout(layout('Hash11', 'float', { p: 'float' }));

  const hash12 = Fn(([p0]) => {
    const q = p0.add(u.paintSeed);
    const p3 = fract(vec3(q.x, q.y, q.x).mul(0.1031)).toVar();
    p3.addAssign(dot(p3, p3.yzx.add(33.33)));
    return fract(p3.x.add(p3.y).mul(p3.z));
  }).setLayout(layout('Hash12', 'float', { p: 'vec2' }));

  const hash22 = Fn(([p0]) => {
    const q = p0.add(u.paintSeed);
    const p3 = fract(
      vec3(q.x, q.y, q.x).mul(vec3(0.1031, 0.103, 0.0973))
    ).toVar();
    p3.addAssign(dot(p3, p3.yzx.add(33.33)));
    return fract(p3.xx.add(p3.yz).mul(p3.zy));
  }).setLayout(layout('Hash22', 'vec2', { p: 'vec2' }));

  const hash33 = Fn(([p0]) => {
    const p3 = fract(
      p0.add(u.paintSeed).mul(vec3(0.1031, 0.103, 0.0973))
    ).toVar();
    p3.addAssign(dot(p3, p3.yxz.add(33.33)));
    return fract(p3.xxy.add(p3.yxx).mul(p3.zyx));
  }).setLayout(layout('Hash33', 'vec3', { p: 'vec3' }));

  const noise = Fn(([x]) => {
    const i = floor(x);
    const f = fract(x);
    const s = f.mul(f).mul(f.mul(-2).add(3));
    const a = hash12(i);
    const b = hash12(i.add(vec2(1, 0)));
    const c = hash12(i.add(vec2(0, 1)));
    const d = hash12(i.add(vec2(1, 1)));
    return mix(mix(a, b, s.x), mix(c, d, s.x), s.y);
  }).setLayout(layout('Noise', 'float', { x: 'vec2' }));

  const fbm3 = Fn(([p0]) => {
    const p = vec2(p0).toVar();
    const v = float(0).toVar();
    let amp = 0.5;
    let norm = 0;
    for (let i = 0; i < 3; i += 1) {
      v.addAssign(noise(p).mul(amp));
      norm += amp;
      p.assign(
        vec2(
          p.x.mul(ROT_C).sub(p.y.mul(ROT_S)),
          p.x.mul(ROT_S).add(p.y.mul(ROT_C))
        )
          .mul(2.03)
          .add(17.1)
      );
      amp *= 0.5;
    }
    return v.div(norm);
  }).setLayout(layout('Fbm3', 'float', { p: 'vec2' }));

  const noise1 = Fn(([x]) => {
    const i = floor(x);
    const f = fract(x);
    return mix(hash11(i), hash11(i.add(1)), f.mul(f).mul(f.mul(-2).add(3)));
  }).setLayout(layout('Noise1', 'float', { x: 'float' }));

  const box = Fn(([p, a, b, soft]) => {
    const s = smoothstep(a.sub(soft), a.add(soft), p).mul(
      smoothstep(b.sub(soft), b.add(soft), p).oneMinus()
    );
    return s.x.mul(s.y);
  }).setLayout(
    layout('Box', 'float', { p: 'vec2', a: 'vec2', b: 'vec2', soft: 'float' })
  );

  // ---- anim.glsl: one seamless loop -------------------------------------
  const loopPhase = () => fract(u.time.div(u.loopSeconds));

  const loopScroll = (cycles, period) =>
    loopPhase()
      .mul(Math.floor(cycles + 0.5))
      .mul(period)
      .mul(u.anim);

  const loopNoise = Fn(([seed, cycles]) => {
    const n = max(floor(cycles.add(0.5)), 1).mul(4);
    const x = loopPhase().mul(n);
    const i = floor(x);
    const f = fract(x);
    const a = hash12(vec2(fmod(i, n), seed));
    const b = hash12(vec2(fmod(i.add(1), n), seed));
    return mix(a, b, f.mul(f).mul(f.mul(-2).add(3)))
      .mul(2)
      .sub(1)
      .mul(u.anim);
  }).setLayout(
    layout('LoopNoise', 'float', { seed: 'float', cycles: 'float' })
  );

  const loopEvent = Fn(([slots, seed]) => {
    const s = max(floor(slots.add(0.5)), 1);
    const x = loopPhase()
      .mul(s)
      .add(hash11(seed.mul(7.13)));
    return vec2(fmod(floor(x), s), fract(x));
  }).setLayout(layout('LoopEvent', 'vec2', { slots: 'float', seed: 'float' }));

  // Zones are authored on the reference's square; a layout reads them
  // through the inverse of its piecewise-linear warp.
  const unwarp = (x, knots, canonical) => {
    const [c0, c1, c2] = canonical;
    const span = (from, to, a, b) =>
      x
        .sub(from)
        .div(to.sub(from))
        .mul(b - a)
        .add(a);
    return select(
      x.lessThan(knots.x),
      x.div(knots.x).mul(c0),
      select(
        x.lessThan(knots.y),
        span(knots.x, knots.y, c0, c1),
        select(
          x.lessThan(knots.z),
          span(knots.y, knots.z, c1, c2),
          span(knots.z, float(1), c2, 1)
        )
      )
    );
  };

  const zone = Fn(([p]) => {
    const warped = vec2(
      unwarp(p.x, u.warpU, CANONICAL_U),
      unwarp(p.y, u.warpV, CANONICAL_V)
    );
    return select(u.warpOn.greaterThan(0.5), warped, p);
  }).setLayout(layout('Zone', 'vec2', { p: 'vec2' }));

  return {
    box,
    fbm3,
    hash11,
    hash12,
    hash22,
    hash33,
    loopEvent,
    loopNoise,
    loopPhase,
    loopScroll,
    noise,
    noise1,
    zone,
  };
}
