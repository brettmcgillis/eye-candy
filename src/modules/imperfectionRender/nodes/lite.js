import {
  Fn,
  If,
  abs,
  clamp,
  cos,
  dot,
  float,
  floor,
  fract,
  max,
  min,
  mix,
  select,
  sign,
  sin,
  smoothstep,
  step,
  vec2,
  vec3,
} from 'three/tsl';

import { RECTS } from '@modules/imperfection';

import createCells from './cells';
import { PI, REF, fmod, srgbToLinear } from './common';
import { dirIndex } from './zones';

const FLOW_PERIOD = [400, 1900];
const HATCH_DARK = 0.8;
const DASH_EDGE = 0.3;
const TEX_FLOOR = 0.06;
const TEX_CAP = 0.2;
const LITE_WET_DOWN = 0.4;
const LITE_CELL = vec2(0.12, 0.16);
const LITE_OFFS = vec2(0.03, 0.07);
const LITE_Q = 0.18;
const LIFE_SLOTS = 3;
const WIPE_IN = 0.09;
const WIPE_OUT = 0.08;
const HERO_FRAY = 0.45;
const BAR_RUN = [30, 180];

// lite.glsl: paint and smear in one pass, one field lookup per pixel.
export default function createLite(
  u,
  c,
  field,
  zones,
  smear,
  blocks,
  { engine = 'grid' } = {}
) {
  const partition = createCells(u, c, zones, { engine });
  const {
    hash11,
    hash12,
    hash22,
    loopEvent,
    loopNoise,
    loopScroll,
    noise,
    noise1,
  } = c;
  const { baseField } = field;
  const { blockDensity, directionField, wetness } = zones;
  const { hueThread, paintShade, pnoise, pnoise1, shade } = smear;
  const { driftAt, frayPx, wipeFront } = blocks;

  const liteSmear = (P, ang, len, spread0, dark, wet) => {
    const seed = 1;
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
    const hb = hash22(vec2(strand, seed * 7 + 1.3));
    const lw = floor(hash11(strand.mul(3.17).add(seed)).mul(3)).add(1);
    const line = floor(t.div(lw));
    const hl = hash22(vec2(line, seed * 3 + 7.7));
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
          hash11(strand.mul(5.91).add(seed * 3.3))
        )
          .div(L)
          .add(0.5)
      )
    );
    const Pd = M.mul(L);
    const o = hb.y
      .add(u.ragged.mul(rough).mul(hl.x.sub(0.5)))
      .mul(L)
      .sub(sgn.mul(loopScroll(1, Pd)));
    const sid0 = floor(s.add(o).div(L));
    const s00 = sid0.mul(L).sub(o);
    const e = abs(fract(t.div(W)).mul(2).sub(1));
    const cut = step(
      s.sub(s00),
      u.taper.mul(L).mul(e.add(hl.y.sub(0.5).mul(0.4)))
    );
    const sid = sid0.sub(cut);
    const s0 = s00.sub(cut.mul(L));

    const a0 = s.sub(s0);
    const a1 = s0.add(L).sub(s);
    const low = a0.lessThan(a1);
    const sidN = sid.add(select(low, -1, 1));
    const s0N = s0.add(select(low, L.negate(), L));
    const upEnd = low.equal(sgn.greaterThan(0));
    const run = fract(hb.x.mul(7.31));
    const reach = wet
      .mul(mix(u.wetLenMin, u.wetLenMax, run.mul(run).mul(run)))
      .mul(loopNoise(strand.mul(0.37).add(5), 2).mul(u.wetBreath).add(1))
      .mul(select(upEnd, 1, LITE_WET_DOWN));
    const w2 = select(
      reach.greaterThan(0),
      smoothstep(0, reach, max(min(a0, a1), 0))
        .oneMinus()
        .mul(0.5),
      0
    );

    const sm = fmod(sid, M);
    const smN = fmod(sidN, M);
    const hseg = hash12(vec2(strand.mul(1.37).add(seed), sm));
    const hsegN = hash12(vec2(strand.mul(1.37).add(seed), smN));
    const hk = hash12(vec2(line.mul(1.91).add(seed), sm));
    const hkN = hash12(vec2(line.mul(1.91).add(seed), smN));
    const drag = (hs, hkk) =>
      mix(u.dragMin, 1, hs).mul(hkk.mul(hkk).mul(u.lineDrag).oneMinus());
    const sq = mix(s, s0.add(L.mul(u.srcFrac)), drag(hseg, hk));
    const sqN = mix(s, s0N.add(L.mul(u.srcFrac)), drag(hsegN, hkN));
    const off = mix(
      hl.y,
      noise1(t.div(mix(2, 5, hb.y)).add(strand.mul(7.3))),
      wet
    ).sub(0.5);
    const tq = t.add(
      off.mul(u.threadSpread).mul(rough).mul(wet.mul(-0.3).add(1))
    );
    const q = d.mul(mix(sq, sqN, w2)).add(n.mul(tq));

    const fs = fmod(s.add(o), Pd);
    const spread = spread0.mul(u.texGain);
    const Nl = max(1, floor(Pd.div(mix(8, 90, hl.x.mul(hl.x))).add(0.5)));
    const lid = fmod(floor(fs.mul(Nl).div(Pd).add(hl.y)), Nl);
    const hline = hash12(vec2(line.mul(0.73).add(seed), lid));
    const band = noise(vec2(t.div(18), s.div(600).add(seed))).sub(0.5);
    const mn = max(1, floor(Pd.div(mix(5, 14, hb.x)).add(0.5)));
    const mott = pnoise(
      vec2(t.div(1.2).add(seed * 3), fs.mul(mn).div(Pd)),
      mn,
      DASH_EDGE
    ).sub(0.5);
    const tex = clamp(spread, TEX_FLOOR, TEX_CAP);
    const lum = spread
      .mul(
        band
          .mul(0.8)
          .add(u.lineGrain.mul(wet.mul(-0.6).add(1)).mul(hline.sub(0.5)))
      )
      .add(1)
      .add(tex.mul(u.mottle).mul(mott).mul(wet.mul(-0.7).add(1)));
    const segLum = (hs) => {
      const l = max(
        lum
          .add(spread.mul(0.9).mul(hs.sub(0.5)))
          .mul(
            select(
              fract(hs.mul(7.31)).lessThan(dark.sub(0.08).mul(3)),
              HATCH_DARK,
              1
            )
          ),
        0.2
      );
      return l.mul(l).mul(l);
    };
    const lumOut = mix(segLum(hseg), segLum(hsegN), w2);

    const tnn = max(1, floor(Pd.div(mix(10, 60, hl.y)).add(0.5)));
    const thr = clamp(
      u.seamDither
        .mul(pnoise1(fs.mul(tnn).div(Pd), tnn, hl.x.mul(50)).sub(0.5))
        .add(0.5),
      0.08,
      0.92
    );
    const hb2 = hash11(
      floor(tq.div(mix(2, 4, hb.y)))
        .mul(3.71)
        .add(seed)
    );
    const rn = max(1, floor(Pd.div(mix(30, 90, fract(hb2.mul(7.3)))).add(0.5)));
    const hue = step(u.threadRed.oneMinus(), hb2)
      .mul(mix(0.5, 1, fract(hb2.mul(13))))
      .mul(smoothstep(0.35, 0.6, pnoise1(fs.mul(rn).div(Pd), rn, hb2.mul(40))));
    return { hue, lum: lumOut, q, thr };
  };

  const liteBlock = (uv, P) => {
    const seed = 5;
    const { f, id, origin, size } = partition(
      uv,
      LITE_CELL,
      LITE_OFFS,
      float(seed)
    );
    const hl = hash12(id.mul(3.31).add(seed * 1.7));
    const alive = u.anim.greaterThan(0).and(hl.lessThan(u.liveFrac));
    const ev = select(
      alive,
      loopEvent(LIFE_SLOTS, hl.mul(113).add(seed)),
      vec2(0, 0.5)
    );
    const kid = id.add(vec2(17.31, 5.77).mul(select(alive, ev.x.add(1), 0)));
    const a = hash22(kid.add(seed)).mul(0.45).mul(u.blockFill.oneMinus());
    const b = mix(
      a.add(
        mix(
          vec2(0.35),
          vec2(0.95).sub(a),
          hash22(kid.mul(1.71).add(seed + 5.3))
        )
      ),
      vec2(1),
      u.blockFill
    );
    const m = u.frayPx.mul(0.35).add(u.bleedPx).div(size.mul(REF));
    const outside = f.x
      .lessThan(a.x.sub(m.x))
      .or(f.y.lessThan(a.y.sub(m.y)))
      .or(f.x.greaterThan(b.x.add(m.x)))
      .or(f.y.greaterThan(b.y.add(m.y)));
    const cB =
      engine === 'grid'
        ? id.add(a.add(b).mul(0.5)).mul(size).sub(LITE_OFFS)
        : origin.add(a.add(b).mul(0.5).mul(size));
    const cz = c.zone(cB);
    const hh = hash12(kid.mul(2.13).add(seed * 3.7));
    const horP = zones.horP(cz);
    const hor = fract(hh.mul(13.7)).lessThan(horP);
    const d = select(hor, vec2(1, 0), vec2(0, 1));
    const aG = select(hor, a, a.yx);
    const bG = select(hor, b, b.yx);
    const fG = select(hor, f, f.yx);
    const across = select(hor, P.y, P.x);
    const line = floor(across.div(u.linePx));
    const lenPx = select(hor, size.x, size.y).mul(REF);
    const lo = aG.x.sub(frayPx(line, hh.mul(31).add(1)).div(lenPx));
    const hi = bG.x.add(frayPx(line, hh.mul(31).add(2)).div(lenPx));
    const dir = select(
      fract(hh.mul(23.1)).lessThan(select(hor, 0.5, 0.7)),
      -1,
      1
    );
    const uu0 = fG.x.sub(lo).div(hi.sub(lo));
    const uu = select(dir.lessThan(0), uu0.oneMinus(), uu0);
    const blen = hi.sub(lo).mul(lenPx);
    const dash = hash12(
      vec2(
        line.mul(1.3).add(hh),
        floor(dot(P, d).div(mix(6, 26, hash11(line.add(hh)))))
      )
    );
    const pin = ev.y.div(WIPE_IN);
    const pout = ev.y.sub(1 - WIPE_OUT).div(WIPE_OUT);
    const wipedOut = alive.and(
      pin
        .lessThan(1)
        .and(uu.greaterThan(wipeFront(pin, line, hh)))
        .or(
          pout
            .greaterThan(0)
            .and(
              select(
                fract(hh.mul(17.9)).lessThan(0.5),
                uu.lessThan(wipeFront(pout, line, hh.add(0.5))),
                hash12(
                  vec2(line, floor(uu.mul(blen).div(24)).add(hh.mul(7)))
                ).lessThan(pout)
              )
            )
        )
    );
    const hit = outside
      .or(hh.greaterThan(blockDensity(cz).mul(u.blockAmount)))
      .or(fG.y.lessThan(aG.y))
      .or(fG.y.greaterThan(bG.y))
      .or(fG.x.lessThan(lo))
      .or(fG.x.greaterThan(hi))
      .or(dash.lessThan(u.dryEnd.mul(smoothstep(0.82, 1, uu))))
      .or(wipedOut)
      .not()
      .and(u.blocksEnabled.greaterThan(0.5));

    const src = cB
      .add(
        hash22(kid.add(seed * 9.1))
          .sub(0.5)
          .mul(vec2(0.1, 0.06))
      )
      .add(vec2(0, 0.02));
    const warmZone = zones.warmZone(cz);
    const l = mix(0.85, 1.15, fract(hh.mul(57.1)))
      .mul(
        mix(0.4, 0.2, warmZone)
          .mul(hash11(line.mul(1.37).add(hh.mul(9))).sub(0.5))
          .add(1)
      )
      .mul(smoothstep(0, 0.06, uu).oneMinus().mul(-0.1).add(1));
    const dr = driftAt(P, d, hh.mul(17));
    return {
      hit,
      lum: l.mul(l).mul(l).mul(dr.x),
      q: src.add(uv.sub(cB).mul(LITE_Q)),
      tilt: dr.y,
    };
  };

  const liteHero = (i, uv, P, col) => {
    const out = vec3(col).toVar();
    const bx = u.rectBox.element(i);
    const m = u.frayPx
      .mul(0.35)
      .add(u.bleedPx)
      .mul(HERO_FRAY / REF);
    const near = uv.x
      .greaterThanEqual(bx.x.sub(m))
      .and(uv.y.greaterThanEqual(bx.y.sub(m)))
      .and(uv.x.lessThanEqual(bx.z.add(m)))
      .and(uv.y.lessThanEqual(bx.w.add(m)));
    If(near, () => {
      const ang = (RECTS[i].quarter * PI) / 4;
      const d = vec2(Math.cos(ang), Math.sin(ang));
      const n = vec2(-Math.sin(ang), Math.cos(ang));
      const line = floor(dot(P, n).div(u.linePx));
      const fr = vec2(frayPx(line, i * 7 + 1), frayPx(line, i * 7 + 2)).mul(
        HERO_FRAY / REF
      );
      const ax =
        Math.abs(Math.cos(ang) * Math.sin(ang)) > 0.4
          ? vec2(0)
          : vec2(Math.abs(Math.cos(ang)), Math.abs(Math.sin(ang)));
      const lo = bx.xy.sub(ax.mul(fr.x));
      const hi = bx.zw.add(ax.mul(fr.y));
      const inside = uv.x
        .greaterThanEqual(lo.x)
        .and(uv.y.greaterThanEqual(lo.y))
        .and(uv.x.lessThanEqual(hi.x))
        .and(uv.y.lessThanEqual(hi.y));
      If(inside, () => {
        const run = mix(BAR_RUN[0], BAR_RUN[1], hash11(line.mul(1.7).add(i)));
        const s = dot(P, d)
          .add(
            hash11(line.add(i * 3.1))
              .mul(8)
              .mul(run)
          )
          .add(loopScroll(1, run.mul(8)));
        const tone = hash12(
          vec2(line.mul(0.91).add(i), fmod(floor(s.div(run)), 8))
        ).sub(0.5);
        const l = u.rectInfo.element(i).y.mul(2).mul(tone).add(1);
        const painted = shade(
          srgbToLinear(u.rectCol.element(i)),
          l.mul(l).mul(l)
        );
        out.assign(
          select(
            float(i).greaterThanEqual(u.fieldRects),
            mix(out, painted, u.glaze),
            painted
          )
        );
      });
    });
    return out;
  };

  const liteMain = Fn(([uv, uvZ, P]) => {
    const q = vec2(0).toVar();
    const thr = float(0.5).toVar();
    const lum = float(1).toVar();
    const hue = float(0).toVar();
    const tilt = float(0).toVar();
    const bk = liteBlock(uv, P);
    If(bk.hit, () => {
      q.assign(bk.q);
      lum.assign(bk.lum);
      tilt.assign(bk.tilt);
    }).Else(() => {
      const df = directionField(uvZ);
      const sm = liteSmear(
        P,
        df.ang,
        df.len,
        df.spread,
        df.dark,
        wetness(uvZ, dirIndex(df.ang)).mul(u.wet)
      );
      q.assign(sm.q.div(REF));
      thr.assign(sm.thr);
      lum.assign(sm.lum);
      hue.assign(sm.hue);
    });
    const f = baseField(q, thr.add(2), RECTS.length - 2);
    const col = vec3(paintShade(hueThread(f.rgb, hue), lum, tilt)).toVar();
    If(u.blocksEnabled.greaterThan(0.5), () => {
      for (let i = 0; i < RECTS.length; i += 1)
        col.assign(liteHero(i, uv, P, col));
    });
    return col;
  }).setLayout({
    name: 'impLiteMain',
    type: 'vec3',
    inputs: [
      { name: 'uv', type: 'vec2' },
      { name: 'uvZ', type: 'vec2' },
      { name: 'P', type: 'vec2' },
    ],
  });

  return { liteMain };
}
