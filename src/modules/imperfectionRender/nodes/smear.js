import {
  Fn,
  If,
  abs,
  clamp,
  cos,
  dot,
  exp,
  float,
  floor,
  fract,
  max,
  min,
  mix,
  pow,
  select,
  sign,
  sin,
  smoothstep,
  sqrt,
  step,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { PI, REF, fmod } from './common';

const DARK_LUM = 0.78;
const TAPER_JITTER = 0.4;
const HATCH_DARK = 0.8;
const DASH_EDGE = 0.3;
const SKIP_RATE = 0.16;
const TEX_FLOOR = 0.06;
const TEX_CAP = 0.2;
const SKIP_CAP = 0.14;
const SKIP_COOL = 3;
const FLOW_PERIOD = [400, 1900];
const DRIP_CELL = 260;
const DRIP_SLOTS = 4;
const DRIP_LEN = [50, 230];
const DRIP_WET = 0.1;
export const GRID_Q = 0.6;
export const HERO_Q = 0.25;
const HERO_LUM_POW = 0.6;

const smooth = (f) => f.mul(f).mul(f.mul(-2).add(3));

// smear.glsl: the smear operator, the paint jobs and the shading they share.
export default function createSmear(u, c, field) {
  const { hash11, hash12, hash22, hash33, loopEvent, loopScroll, noise } = c;
  const { baseField } = field;

  const pnoise = Fn(([x, per, edge]) => {
    const i = floor(x);
    const f = fract(x);
    const s = vec2(
      smooth(f.x),
      smoothstep(edge.mul(-0.5).add(0.5), edge.mul(0.5).add(0.5), f.y)
    );
    const y0 = fmod(i.y, per);
    const y1 = fmod(i.y.add(1), per);
    const a = hash12(vec2(i.x, y0));
    const b = hash12(vec2(i.x.add(1), y0));
    const cc = hash12(vec2(i.x, y1));
    const d = hash12(vec2(i.x.add(1), y1));
    return mix(mix(a, b, s.x), mix(cc, d, s.x), s.y);
  }).setLayout({
    name: 'impPNoise',
    type: 'float',
    inputs: [
      { name: 'x', type: 'vec2' },
      { name: 'per', type: 'float' },
      { name: 'edge', type: 'float' },
    ],
  });

  const pnoise1 = Fn(([x, per, seed]) => {
    const i = floor(x);
    const f = fract(x);
    return mix(
      hash12(vec2(fmod(i, per), seed)),
      hash12(vec2(fmod(i.add(1), per), seed)),
      smooth(f)
    );
  }).setLayout({
    name: 'impPNoise1',
    type: 'float',
    inputs: [
      { name: 'x', type: 'float' },
      { name: 'per', type: 'float' },
      { name: 'seed', type: 'float' },
    ],
  });

  const shade = (col, lum) => {
    const warm = smoothstep(0, 0.15, col.r.sub(col.b));
    const e = mix(vec3(1), vec3(0.75, 1.3, 1.7), warm);
    return col.mul(pow(vec3(lum), e));
  };

  const hueThread = (col, h) => {
    const warm = step(col.b.mul(1.6), col.r);
    return mix(col, col.mul(vec3(1, 0.45, 0.4)), warm.mul(h));
  };

  // paintShade(c, lum, dr): dr.x scales the streak brightness, dr.y tilts
  // the hue inside the paint's family.
  const paintShade = (col, lum, tilt, drift = null) => {
    const sh = shade(col, drift ? lum.mul(drift) : lum);
    return sh.mul(
      vec3(
        1,
        tilt.mul(2).add(1),
        tilt.mul(select(sh.b.greaterThan(sh.r), 1, -1)).add(1)
      )
    );
  };

  // smearFlow, inline: where did this pixel's paint come from. flow is a
  // JS boolean (the background runs, blocks hold still).
  const smearFlow = (P, ang, len, spread0, dark, seed, flow) => {
    const d = vec2(cos(ang), sin(ang));
    const n = vec2(d.y.negate(), d.x);
    const s = dot(P, d);
    const t = dot(P, n);

    const W = mix(
      u.strandMin,
      u.strandMax,
      hash11(floor(t.div(48)).mul(1.31).add(seed))
    ).mul(select(abs(d.x.mul(d.y)).greaterThan(0.4), u.hatchWidth, 1));
    const strand = floor(t.div(W)).add(floor(t.div(48)).mul(97));
    const hb = hash22(vec2(strand, seed.mul(7).add(1.3)));
    const lw = floor(hash11(strand.mul(3.17).add(seed)).mul(3)).add(1);
    const line = floor(t.div(lw));
    const hl = hash22(vec2(line, seed.mul(3).add(7.7)));

    const L = mix(len.x, len.y, hb.x.mul(hb.x));
    const rough = clamp(spread0.div(u.lumSpread), 0.25, 1.5);
    const sgn = select(
      abs(d.y).greaterThan(0.3),
      sign(d.y).negate(),
      sign(d.x)
    );
    const M = max(
      1,
      floor(
        mix(
          FLOW_PERIOD[0],
          FLOW_PERIOD[1],
          hash11(strand.mul(5.91).add(seed.mul(3.3)))
        )
          .div(L)
          .add(0.5)
      )
    );
    const Pd = M.mul(L);
    const o0 = hb.y.add(u.ragged.mul(rough).mul(hl.x.sub(0.5))).mul(L);
    const o = flow ? o0.sub(sgn.mul(loopScroll(1, Pd))) : o0;
    const sid0 = floor(s.add(o).div(L));
    const s00 = sid0.mul(L).sub(o);
    const e = abs(fract(t.div(W)).mul(2).sub(1));
    const cut = step(
      s.sub(s00),
      u.taper.mul(L).mul(e.add(hl.y.sub(0.5).mul(TAPER_JITTER)))
    );
    const sid = sid0.sub(cut);
    const s0 = s00.sub(cut.mul(L));
    const sidm = fmod(sid, M);

    const hseg = hash12(vec2(strand.mul(1.37).add(seed), sidm)).toVar();
    const hk = hash12(vec2(line.mul(1.91).add(seed), sidm));
    const k = mix(u.dragMin, 1, hseg).mul(
      hk.mul(hk).mul(u.lineDrag).oneMinus()
    );
    const sq = mix(s, s0.add(L.mul(u.srcFrac)), k).toVar();
    const fs = fmod(s.add(o), Pd).toVar();

    const drip = float(0).toVar();
    const dripLum = float(0).toVar();
    if (flow) {
      If(u.anim.greaterThan(0), () => {
        const cid = floor(s.div(DRIP_CELL));
        const ev = loopEvent(
          DRIP_SLOTS,
          hash12(vec2(strand.mul(0.71).add(seed), cid)).mul(61)
        );
        const hd = hash33(vec3(strand.add(seed.mul(13)), cid, ev.x));
        const Lm = mix(DRIP_LEN[0], DRIP_LEN[1], hd.z);
        const so = cid
          .mul(DRIP_CELL)
          .add(hd.y.mul(Lm.negate().add(DRIP_CELL)))
          .add(select(sgn.lessThan(0), Lm, 0));
        const head = Lm.mul(smoothstep(0, 0.8, ev.y));
        const tail = Lm.mul(smoothstep(0.5, 1, ev.y));
        const x = sgn.mul(s.sub(so));
        const wf = mix(0.45, 1, fract(hd.y.mul(7.7)));
        const tip = min(head, 50).mul(
          e.div(wf).add(u.ragged.mul(hl.y.sub(0.5)))
        );
        drip.assign(
          step(hd.x, u.dripOn)
            .mul(step(e, wf))
            .mul(step(tail, x))
            .mul(step(x, head.sub(tip)))
        );
        sq.assign(mix(sq, so.sub(sgn.mul(4)), drip));
        fs.assign(mix(fs, fmod(x.sub(head), Pd), drip));
        hseg.assign(mix(hseg, 0.5, drip));
        dripLum.assign(
          drip.mul(
            u.dripLum
              .mul(fract(hd.z.mul(13.1)).sub(0.5))
              .mul(2)
              .add(
                float(DRIP_WET)
                  .div(max(spread0, 0.02))
                  .mul(smoothstep(0, 6, head.sub(tip).sub(x)).oneMinus())
              )
          )
        );
      });
    }

    const spread = spread0.mul(u.texGain);

    const dc = floor(t.div(6));
    const hdk = hash33(vec3(dc.add(seed.mul(5)), sidm, strand));
    const dx = t
      .sub(dc.add(0.2).add(hdk.y.mul(0.6)).mul(6))
      .div(mix(0.7, 1.5, hdk.z));
    const dprof = exp(dx.mul(dx).negate());
    const darkF = select(
      hdk.x.lessThan(dark.mul(1.6).mul(rough).mul(drip.oneMinus())),
      mix(1, DARK_LUM, dprof),
      1
    );
    const hatchF = select(
      fract(hseg.mul(7.31)).lessThan(dark.sub(0.08).mul(3)),
      HATCH_DARK,
      1
    );

    const tq = t.add(hl.y.sub(0.5).mul(u.threadSpread).mul(rough));
    const q = d.mul(sq).add(n.mul(tq));
    const hb2 = hash11(
      floor(tq.div(mix(2, 4, hb.y)))
        .mul(3.71)
        .add(seed)
    );

    const Ll = mix(8, 90, hl.x.mul(hl.x));
    const Nl = max(1, floor(Pd.div(Ll).add(0.5)));
    const lid = fmod(floor(fs.mul(Nl).div(Pd).add(hl.y)), Nl);
    const hline = hash12(vec2(line.mul(0.73).add(seed), lid));
    const band = noise(vec2(t.div(18), s.div(600).add(seed))).sub(0.5);
    const strandVar = hseg
      .sub(0.5)
      .mul(0.9)
      .add(band.mul(0.8))
      .add(u.lineGrain.mul(hline.sub(0.5)))
      .add(dripLum);
    const sw = mix(2, 5, hb.y);
    const sn = max(1, floor(Pd.div(mix(20, 60, hl.x)).add(0.5)));
    const soft = pnoise(
      vec2(t.div(sw).add(seed.mul(5)), fs.mul(sn).div(Pd)),
      sn,
      1
    ).sub(0.5);
    const mn = max(1, floor(Pd.div(mix(5, 14, hb.x)).add(0.5)));
    const mott = pnoise(
      vec2(t.div(1.2).add(seed.mul(3)), fs.mul(mn).div(Pd)),
      mn,
      DASH_EDGE
    ).sub(0.5);
    const texVar = u.softLines.mul(soft).add(u.mottle.mul(mott));
    const kn = max(1, floor(Pd.div(mix(2, 3, hb.y)).add(0.5)));
    const kw = mix(2, 5, hb.x);
    const kp = vec2(t.div(kw), fs.mul(kn).div(Pd));
    const kh = hash12(
      vec2(floor(kp.x).mul(1.9).add(seed), fmod(floor(kp.y), kn))
    );
    const kf = sin(fract(kp).mul(PI));
    const skipOn = kh.lessThan(
      smoothstep(0.05, 0.1, dark).mul(SKIP_COOL).add(1).mul(SKIP_RATE)
    );
    const skipV = select(
      skipOn,
      select(fract(kh.mul(31.7)).greaterThan(0.4), -1, 0.7).mul(
        sqrt(kf.x.mul(kf.y))
      ),
      0
    );
    const gn = max(1, floor(Pd.div(mix(2, 6, hl.x)).add(0.5)));
    const grit = hash12(
      vec2(floor(t).mul(2.1).add(seed), fmod(floor(fs.mul(gn).div(Pd)), gn))
    ).sub(0.5);

    const tex = clamp(spread, TEX_FLOOR, TEX_CAP);
    const lum0 = spread
      .mul(strandVar)
      .add(1)
      .add(tex.mul(texVar.add(u.grit.mul(grit))))
      .add(min(tex, SKIP_CAP).mul(u.skip).mul(skipV))
      .mul(darkF)
      .mul(hatchF);
    const lumP = max(lum0, 0.2);
    const lum = lumP.mul(lumP).mul(lumP);

    const tnn = max(1, floor(Pd.div(mix(10, 60, hl.y)).add(0.5)));
    const tn = pnoise1(fs.mul(tnn).div(Pd), tnn, hl.x.mul(50)).sub(0.5);
    const thr = clamp(u.seamDither.mul(tn).add(0.5), 0.08, 0.92);
    const rn = max(1, floor(Pd.div(mix(30, 90, fract(hb2.mul(7.3)))).add(0.5)));
    const rOn = smoothstep(
      0.35,
      0.6,
      pnoise1(fs.mul(rn).div(Pd), rn, hb2.mul(40))
    );
    const hue = step(u.threadRed.oneMinus(), hb2)
      .mul(mix(0.5, 1, fract(hb2.mul(13))))
      .mul(rOn);

    return { hue, lum, q, thr };
  };

  // L1: the background, flowing. Returns rgb + warmth (the field's).
  const smearJob = Fn(([P, ang, len, spread, dark]) => {
    const sm = smearFlow(P, ang, len, spread, dark, float(1), true);
    const f = baseField(sm.q.div(REF), sm.thr.add(2), u.fieldRects);
    return vec4(paintShade(hueThread(f.rgb, sm.hue), sm.lum, float(0)), f.a);
  }).setLayout({
    name: 'impSmearJob',
    type: 'vec4',
    inputs: [
      { name: 'P', type: 'vec2' },
      { name: 'ang', type: 'float' },
      { name: 'len', type: 'vec2' },
      { name: 'spread', type: 'float' },
      { name: 'dark', type: 'float' },
    ],
  });

  // A grid block: the field at p0 plus a compressed image of the smear.
  const gridJob = Fn(([P, ang, spread, seed, p0, lumK, tilt]) => {
    const sm = smearFlow(
      P,
      ang,
      vec2(30, 220),
      spread,
      u.darkLines,
      seed,
      false
    );
    const f = baseField(p0.add(sm.q.div(REF).mul(GRID_Q)), 2.5, u.fieldRects);
    return vec4(paintShade(f.rgb, sm.lum.mul(lumK), tilt), f.a);
  }).setLayout({
    name: 'impGridJob',
    type: 'vec4',
    inputs: [
      { name: 'P', type: 'vec2' },
      { name: 'ang', type: 'float' },
      { name: 'spread', type: 'float' },
      { name: 'seed', type: 'float' },
      { name: 'p0', type: 'vec2' },
      { name: 'lumK', type: 'float' },
      { name: 'tilt', type: 'float' },
    ],
  });

  const grainLum = Fn(([P, ang, spread, seed]) => {
    return smearFlow(P, ang, vec2(40, 300), spread, float(0.08), seed, false)
      .lum;
  }).setLayout({
    name: 'impGrainLum',
    type: 'float',
    inputs: [
      { name: 'P', type: 'vec2' },
      { name: 'ang', type: 'float' },
      { name: 'spread', type: 'float' },
      { name: 'seed', type: 'float' },
    ],
  });

  // A hero rectangle: its own paint, softer grain.
  const heroJob = Fn(([P, ang, spread, seed, p0, lumK, tilt]) => {
    const sm = smearFlow(
      P,
      ang,
      vec2(40, 300),
      spread,
      float(0.08),
      seed,
      false
    );
    const f = baseField(
      p0.add(sm.q.sub(P).div(REF).mul(HERO_Q)),
      0.5,
      u.fieldRects
    );
    return vec4(
      paintShade(f.rgb, pow(sm.lum, HERO_LUM_POW).mul(lumK), tilt),
      f.a
    );
  }).setLayout({
    name: 'impHeroJob',
    type: 'vec4',
    inputs: [
      { name: 'P', type: 'vec2' },
      { name: 'ang', type: 'float' },
      { name: 'spread', type: 'float' },
      { name: 'seed', type: 'float' },
      { name: 'p0', type: 'vec2' },
      { name: 'lumK', type: 'float' },
      { name: 'tilt', type: 'float' },
    ],
  });

  return {
    grainLum,
    gridJob,
    heroJob,
    hueThread,
    paintShade,
    pnoise,
    pnoise1,
    shade,
    smearJob,
  };
}
