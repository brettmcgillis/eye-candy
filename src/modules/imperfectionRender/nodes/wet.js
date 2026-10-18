import {
  Fn,
  If,
  abs,
  cos,
  dot,
  exp,
  float,
  floor,
  ivec2,
  max,
  mix,
  select,
  sign,
  sin,
  smoothstep,
  sqrt,
  step,
  textureLoad,
  vec2,
  vec3,
} from 'three/tsl';

import { PI, REF, fmod } from './common';

const WET_TAPS = 12;
const WET_UP = 0.72;
const WET_PEAK = 1.5;
const WET_NEAR = 2;
const WET_SIGMA = [0.1, 0.26];

export const wetPack = (meta, wet) =>
  meta.add(floor(wet.clamp(0, 1).mul(63).add(0.5)).mul(16));

export const wetUnpack = (a0) => {
  const a = floor(a0.add(0.5));
  return vec3(fmod(a, 4), fmod(floor(a.div(4)), 4), floor(a.div(16)).div(63));
};

const wetFamily = (col) =>
  smoothstep(-0.12, 0.12, col.r.sub(col.b).div(col.r.add(col.b).add(1e-3)));

// Upstream: up for drips and both diagonals, left for horizontal grain.
const wetDir = (dir) => {
  const a = dir.mul(0.25 * PI);
  return select(dir.lessThan(0.5), vec2(-1, 0), vec2(cos(a), sin(a)));
};

// wet.glsl's Image-pass smear over Buffer A. `buffer` is the paint pass's
// texture; it is addressed by top-left screen coordinates, the shader works
// in bottom-left fragCoord like the reference, so reads flip y.
export default function createWet(u, c, buffer, zones, { lic = false } = {}) {
  const { hash11, hash22, loopNoise, noise1, zone } = c;

  const layerWet = Fn(([fc, res, side]) => {
    const flip = (p) => vec2(p.x, res.y.sub(p.y));
    const fetch = (p) => textureLoad(buffer, ivec2(flip(p)));
    const tap = (p) => buffer.sample(flip(p).div(res)).level(0).rgb;

    const c0 = fetch(fc);
    const m = wetUnpack(c0.a);
    const wet = m.z.mul(u.wet);
    const sc = side.div(REF);
    const d = wetDir(m.x);
    const n = vec2(d.y.negate(), d.x);
    const uvC = fc.sub(res.sub(side).mul(0.5)).div(side);
    const crisp = u.crisp
      .mul(zones.crisp(zone(uvC)))
      .mul(step(1.5, m.x))
      .mul(step(m.x, 2.5));

    const out = vec3(c0.rgb).toVar();

    const ln = floor(dot(fc, n));
    const hl = hash11(ln.mul(0.618).add(m.x.mul(7.1)));
    const hj = hash22(
      vec2(
        ln,
        floor(
          dot(fc, d)
            .div(mix(3, 9, hl))
            .add(hl.mul(5))
        )
      )
    )
      .mul(2)
      .sub(1);
    const j = d
      .mul(hj.x)
      .add(n.mul(hj.y).mul(crisp.oneMinus()))
      .mul(u.aaJitter);
    const e = mix(
      vec2(1, sign(d.x.mul(d.y).add(d.y.mul(0.5)))).mul(0.5),
      d.mul(0.5),
      crisp
    );
    const edged = tap(fc.add(j).add(e))
      .add(tap(fc.add(j).sub(e)))
      .mul(0.5);
    const cc = select(u.aaEdge.greaterThan(0.5), edged, c0.rgb);
    out.assign(cc);

    If(wet.greaterThan(0), () => {
      const Pr = fc.div(sc);
      const t = dot(Pr, n);
      const s = dot(Pr, d);
      const W = mix(3, 9, hash11(floor(t.div(16)).add(m.x.mul(17))));
      const hs = hash11(floor(t.div(W)).mul(1.37).add(m.x.mul(31)).add(0.5));
      const run = noise1(s.div(140).add(hs.mul(50)));
      const L = wet
        .mul(mix(u.wetLenMin, u.wetLenMax, run.mul(run).mul(run)))
        .mul(loopNoise(hs.mul(97), 2).mul(u.wetBreath).add(1))
        .mul(sc)
        .mul(crisp.mul(-0.6).add(1));
      const cr = u.wetCross.mul(wet).mul(sc).mul(crisp.oneMinus());
      const sig = mix(WET_SIGMA[0], WET_SIGMA[1], wet);
      const isig = float(1).div(sig.mul(sig));
      const r0 = sqrt(max(cc, 0));
      const f0 = wetFamily(cc);
      const acc = vec3(r0).toVar();
      const wsum = float(1).toVar();
      const walk = lic && {
        at: { down: vec2(fc).toVar(), up: vec2(fc).toVar() },
        dir: { down: vec2(d).toVar(), up: vec2(d).toVar() },
        run: { down: float(0).toVar(), up: float(0).toVar() },
      };
      for (let k = 0; k < WET_TAPS; k += 1) {
        const up = k % 2 === 1;
        const pair = Math.floor(k / 2);
        const y = (pair + 0.5) / (WET_TAPS / 2);
        const uk = y ** WET_PEAK;
        const sk = L.mul((up ? WET_UP : WET_UP - 1) * uk);
        const cj = cr.mul(
          (pair % 2 === 0 ? 1 : -1) *
            (0.3 + 0.7 * (y * 5.3 - Math.floor(y * 5.3)))
        );
        let o = d.mul(sk).add(n.mul(cj));
        if (walk) {
          const side0 = up ? 'up' : 'down';
          const dk = walk.dir[side0];
          const tp = walk.at[side0]
            .add(dk.mul(sk.sub(walk.run[side0])))
            .toVar();
          const dn0 = wetDir(wetUnpack(fetch(tp).a).x);
          const dn = select(
            dot(dn0, dk).lessThan(0),
            dn0.negate(),
            dn0
          ).toVar();
          o = tp.sub(fc).add(vec2(dk.y.negate(), dk.x).mul(cj)).toVar();
          walk.at[side0].assign(tp);
          walk.run[side0].assign(sk);
          walk.dir[side0].assign(dn);
        }
        const col = tap(fc.add(o));
        const r = sqrt(max(col, 0));
        const dc = r.sub(r0);
        const near = smoothstep(
          0.5 * WET_NEAR,
          WET_NEAR,
          abs(sk).div(sc)
        ).oneMinus();
        const w = exp(
          dot(dc, dc).mul(isig).mul(near.mul(-0.85).add(1)).negate()
        )
          .mul(1 - 0.7 * uk)
          .mul(
            mix(
              smoothstep(0.2, 0.5, abs(wetFamily(col).sub(f0))).oneMinus(),
              1,
              near
            )
          );
        acc.addAssign(r.mul(w));
        wsum.addAssign(w);
      }
      const avg = acc.div(wsum);
      out.assign(avg.mul(avg));
    });
    return out;
  }).setLayout({
    name: 'impLayerWet',
    type: 'vec3',
    inputs: [
      { name: 'fc', type: 'vec2' },
      { name: 'res', type: 'vec2' },
      { name: 'side', type: 'float' },
    ],
  });

  return { layerWet, wetUnpack };
}
