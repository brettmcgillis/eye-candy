import {
  Fn,
  If,
  Loop,
  abs,
  dot,
  exp2,
  float,
  floor,
  fract,
  max,
  min,
  mix,
  pow,
  select,
  smoothstep,
  step,
  vec2,
  vec3,
} from 'three/tsl';

import { REF, fmod } from './common';

const WEDGE_LANE = [3, 11];
const WEDGE_GROUP = 28;
const WEDGE_SEG = 72;
const WEDGE_NSEG = 8;
const WEDGE_FRAY = 0.05;
const WEDGE_STEP = 0.06;
const WEDGE_BREATH = 0.01;
const WEDGE_INK = [0.8, 1];
const WEDGE_UNDER = 0.88;
const WEDGE_THIN = 0.35;
const SOOT_SCRAPE = 0.4;
const SOOT_PERIOD = 512;
const SCRATCH_CELL = vec2(10, 120);
const SCRATCH_DENS = 0.62;
const SCRATCH_SLOTS = 1;
const SCRATCH_GROW = 0.12;
const SCRATCH_FADE = 0.75;
const SCRATCH_BROAD = 0.55;
const DRIP_COL = 7;
const DRIP_DENS = 0.5;
const DRIP_RUN = 0.45;
const DRIP_DRY = 0.78;
const FLECK_CELL = vec2(16, 3);
const FLECK_LEN = [2.5, 13];
const FLECK_RAG = 0.9;
const FLECK_SLOTS = 1;
const FLECK_GROW = 0.06;
const FLECK_FADE = 0.8;
const AA_PX = 0.75;
const SQRT_HALF = Math.SQRT1_2;

const fnLayout = (name, type, inputs) => ({
  name: `imp${name}`,
  type,
  inputs: Object.entries(inputs).map(([n, t]) => ({ name: n, type: t })),
});

// Coverage is perceptual: a gamma-shaped weight in linear light, so a
// half-loaded stroke reads half dark.
const cover = (z) => pow(z.oneMinus(), 2.2).oneMinus();

// accents.glsl: L3, drawn after the wet smear so they stay crisp. `uv` is the
// zone square, `P` screen reference px.
const plus = (a, b) => (typeof a === 'number' ? a + b : a.add(b));
const flagOn = (flag, extra) =>
  typeof extra === 'number'
    ? flag.greaterThan(0.5)
    : flag.greaterThan(0.5).and(extra.greaterThan(0.5));

export default function createAccents(u, c, zones) {
  const { places } = zones;
  const WEDGE_PT = vec2(...places.wedgePt);
  const [V0, V1, V2, V3] = places.wedgeV;
  const SOOT_TOP = places.sootTop;
  const SOOT_BOT = places.sootBot;
  const SOOT_X = places.sootX;
  const DRIP_U = places.dripU;
  const FLECK_TOP = places.fleckTop;
  const FLECK_X = places.fleckX;
  const {
    box,
    hash11,
    hash12,
    hash33,
    loopEvent,
    loopNoise,
    loopScroll,
    noise1,
  } = c;
  const A = u.accent;

  const edgyHash = (a, x) => {
    const i = floor(x);
    return mix(
      hash12(vec2(a, i)),
      hash12(vec2(a, i.add(1))),
      smoothstep(0.3, 0.7, fract(x))
    );
  };

  const accNoiseP = Fn(([x, n, seed]) => {
    const i = floor(x);
    const f = fract(x);
    const a = hash11(fmod(i, n).add(seed));
    const b = hash11(fmod(i.add(1), n).add(seed));
    return mix(a, b, f.mul(f).mul(f.mul(-2).add(3)));
  }).setLayout(
    fnLayout('AccNoiseP', 'float', { x: 'float', n: 'float', seed: 'float' })
  );

  const layerWedge = Fn(([uv, P, col]) => {
    const out = vec3(col).toVar();
    const dir = vec2(SQRT_HALF, SQRT_HALF);
    const nrm = vec2(dir.y, dir.x.negate());
    const vm = smoothstep(V0, V1, uv.y).mul(
      smoothstep(V2, V3, uv.y).oneMinus()
    );
    const b = dot(P, nrm);
    const d0 = dot(uv.sub(WEDGE_PT), nrm).add(
      loopNoise(3, 2).mul(WEDGE_BREATH)
    );
    If(
      vm.greaterThan(0).and(d0.greaterThanEqual(-WEDGE_FRAY - WEDGE_STEP)),
      () => {
        const grp = floor(b.div(WEDGE_GROUP));
        const lw = mix(
          WEDGE_LANE[0],
          WEDGE_LANE[1],
          hash11(grp.mul(1.91).add(2))
        );
        const lane = floor(b.div(lw)).add(grp.mul(53));
        const hl = hash11(lane.mul(1.37).add(5));
        const d = d0.add(loopNoise(lane.mul(0.37).add(9), 3).mul(0.004));
        const per = WEDGE_SEG * WEDGE_NSEG;
        const a = dot(P, dir)
          .add(loopScroll(1, per).mul(floor(hl.mul(2)).add(1)))
          .add(hl.mul(per));
        const k = floor(a.div(WEDGE_SEG));
        const f = fract(a.div(WEDGE_SEG));
        const hs = hash33(vec3(fmod(k, WEDGE_NSEG), lane, 3.3));
        const ext = smoothstep(hs.y.mul(0.3), hs.y.mul(0.3).add(0.05), f).mul(
          smoothstep(
            hs.z.mul(-0.3).add(1).sub(0.05),
            hs.z.mul(-0.3).add(1),
            f
          ).oneMinus()
        );
        const a0 = dot(P, dir);
        const sl = mix(0.6, 1.8, hash11(grp.mul(3.7).add(1))).mul(WEDGE_SEG);
        const pa = a0
          .div(sl)
          .add(hash11(grp).mul(3))
          .add(hl.sub(0.5).mul(0.35));
        const pf = fract(pa);
        const st = hash12(vec2(grp, floor(pa)))
          .sub(0.6)
          .mul(
            smoothstep(
              0,
              mix(0.15, 0.4, fract(hl.mul(3.1))),
              min(pf, pf.oneMinus())
            )
          )
          .add(0.6);
        const reach = hs.x
          .mul(hs.x)
          .mul(1.4)
          .sub(0.4)
          .mul(WEDGE_FRAY)
          .add(st.sub(0.6).mul(2 * WEDGE_STEP));
        const edge = ext
          .mul(smoothstep(-AA_PX, AA_PX, reach.add(d).mul(REF)))
          .mul(mix(1, 0.75, smoothstep(0, WEDGE_FRAY, d.negate())));
        const bi = floor(b.div(1.2));
        const hb = hash11(bi.mul(1.37));
        const dash = edgyHash(
          bi.mul(1.3).add(lane),
          a.div(mix(4, 18, fract(hb.mul(5.3))))
        );
        const dryS = smoothstep(0, 0.04, d).mul(ext).oneMinus();
        const bristle = mix(0.7, 1, hb).mul(
          mix(1, smoothstep(0.25, 0.6, dash), dryS.mul(0.5).add(0.35))
        );
        const ground = smoothstep(0, 0.03, d.add(st.sub(0.5).mul(WEDGE_STEP)))
          .mul(WEDGE_UNDER)
          .mul(mix(0.7, 1.22, hl))
          .mul(smoothstep(0.08, 0.2, d).mul(-WEDGE_THIN).add(1))
          .mul(smoothstep(0.03, 0.09, d).oneMinus().mul(0.12).add(1));
        const z = max(
          edge.mul(mix(WEDGE_INK[0], WEDGE_INK[1], hs.x)).mul(bristle),
          ground.mul(mix(0.8, 1, hb))
        ).mul(vm);
        If(z.greaterThan(0), () => {
          const ink = mix(
            A.wedgeInkDark,
            A.wedgeInkLight,
            fract(hl.mul(7.3))
          ).mul(hb.sub(0.5).mul(0.6).add(1));
          out.assign(mix(out, ink, cover(min(z, 0.98))));
        });
      }
    );
    return out;
  }).setLayout(
    fnLayout('Wedge', 'vec3', { uv: 'vec2', P: 'vec2', col: 'vec3' })
  );

  const sootTop = (x) => {
    const xs = x.add(loopScroll(1, SOOT_PERIOD));
    const hc = hash11(fmod(floor(xs), SOOT_PERIOD));
    return accNoiseP(xs.div(64), SOOT_PERIOD / 64, 1)
      .sub(0.5)
      .mul(0.022)
      .add(SOOT_TOP)
      .add(hc.sub(0.5).mul(0.006));
  };

  const layerSoot = Fn(([uv, P, col]) => {
    const out = vec3(col).toVar();
    const xs = P.x.add(loopScroll(1, SOOT_PERIOD));
    const top = sootTop(P.x);
    const hc = hash11(fmod(floor(xs), SOOT_PERIOD).add(0.5));
    const bot = accNoiseP(xs.div(64), SOOT_PERIOD / 64, 7)
      .sub(0.5)
      .mul(0.026)
      .add(SOOT_BOT)
      .add(hc.sub(0.5).mul(0.008));
    const zx = smoothstep(SOOT_X[0], SOOT_X[1], uv.x);
    const ez = smoothstep(-AA_PX, AA_PX, top.sub(uv.y).mul(REF)).mul(
      smoothstep(-AA_PX, AA_PX, uv.y.sub(bot).mul(REF))
    );
    If(ez.greaterThan(0).and(zx.greaterThan(0)), () => {
      const row = floor(P.y.div(1.5));
      const hr = hash11(row.mul(3.1));
      const L = exp2(floor(hr.mul(4)).add(3));
      const xr = P.x.add(
        loopScroll(1, SOOT_PERIOD).mul(floor(fract(hr.mul(7.3)).mul(2)).add(1))
      );
      const g = accNoiseP(
        xr.div(L).add(hash11(row).mul(50)),
        float(SOOT_PERIOD).div(L),
        row.mul(0.71)
      );
      const soot = A.soot.mul(g.mul(1.1).add(0.5));
      const thin = step(0.7, fract(hr.mul(13.7))).mul(SOOT_SCRAPE);
      out.assign(
        mix(
          out,
          soot,
          zx
            .mul(ez)
            .mul(mix(thin.negate().add(0.6), 0.94, smoothstep(0.3, 0.7, g)))
        )
      );
    });
    return out;
  }).setLayout(
    fnLayout('Soot', 'vec3', { uv: 'vec2', P: 'vec2', col: 'vec3' })
  );

  const inkDry = Fn(([P, t, s, seed, dry]) => {
    const bh = edgyHash(seed, P.x);
    const dl = mix(2, 6, fract(bh.mul(7.7)));
    const dash = edgyHash(
      floor(P.x).mul(1.7).add(seed),
      P.y.div(dl).add(bh.mul(5))
    );
    const start = smoothstep(0, fract(bh.mul(3.1)).mul(0.1).add(0.04), s);
    const env = smoothstep(0.18, 0.5, abs(t))
      .oneMinus()
      .mul(mix(1, 0.55, smoothstep(0.45, 1, s)))
      .mul(start);
    const v = env
      .mul(mix(0.6, 1, bh))
      .add(dash.sub(0.5).mul(mix(0.3, 0.9, dry)));
    return smoothstep(dry.mul(0.3).add(0.2), dry.mul(0.3).add(0.5), v);
  }).setLayout(
    fnLayout('InkDry', 'float', {
      P: 'vec2',
      t: 'float',
      s: 'float',
      seed: 'float',
      dry: 'float',
    })
  );

  const layerScratches = Fn(([uv, P, col]) => {
    const out = vec3(col).toVar();
    const z = zones.seam(uv);
    If(z.greaterThanEqual(0.01), () => {
      const density = z.mul(SCRATCH_DENS);
      const gi = floor(P.div(SCRATCH_CELL));
      const best = float(-1).toVar();
      const cov = float(0).toVar();
      const wash = float(0).toVar();
      for (let jj = 0; jj <= 2; jj += 1) {
        for (let ii = -1; ii <= 1; ii += 1) {
          const cell = gi.add(vec2(ii, jj));
          const h2a = hash33(vec3(cell.add(3.7), 22.2));
          const ev = loopEvent(SCRATCH_SLOTS, h2a.z.mul(61));
          const h = hash33(vec3(cell, ev.x.mul(7.31).add(13)));
          const h2 = vec2(fract(h2a.xy.add(h.yx.mul(ev.x))));
          const gr = ev.y.div(SCRATCH_GROW).clamp(0, 1);
          const grow = mix(
            1,
            gr.oneMinus().mul(gr.oneMinus()).oneMinus(),
            u.anim
          );
          const fade = smoothstep(SCRATCH_FADE, 1, ev.y).mul(u.anim).oneMinus();
          const x0 = cell.x
            .add(0.5)
            .add(h.x.sub(0.5).mul(0.8))
            .mul(SCRATCH_CELL.x);
          const top = cell.y.add(h.y).mul(SCRATCH_CELL.y);
          const len = mix(0.5, 2, h2.x).mul(SCRATCH_CELL.y);
          const s = top.sub(P.y).div(len);
          const broad = step(1 - SCRATCH_BROAD, h2.y);
          const hw = fract(h2.y.mul(9.7));
          const wpx = mix(mix(1.8, 3.6, hw), mix(8, 17, hw), broad);
          const w = wpx
            .mul(mix(1.15, 0.5, smoothstep(0.55, 1, s)))
            .mul(
              noise1(P.y.div(9).add(h.x.mul(70)))
                .mul(0.5)
                .add(0.75)
            )
            .mul(mix(0.3, 1, smoothstep(0, 0.08, grow.sub(s))));
          const t = P.x.sub(x0).div(w);
          const ta = float(0.35).div(w);
          const live = h2a.z
            .lessThanEqual(density)
            .and(h.z.greaterThan(best))
            .and(s.greaterThanEqual(0))
            .and(s.lessThanEqual(grow))
            .and(abs(t).lessThan(ta.add(0.5)));
          If(live, () => {
            best.assign(h.z);
            const dry = mix(0.28, 0.65, broad).add(
              smoothstep(0.4, 1, s).mul(0.3)
            );
            const px = vec2(0.35, 0);
            cov.assign(
              inkDry(P.sub(px), t.sub(ta), s, h.z.mul(29), dry)
                .add(inkDry(P.add(px), t.add(ta), s, h.z.mul(29), dry))
                .mul(0.5 * 0.85)
                .mul(fade)
            );
            wash.assign(
              broad
                .mul(smoothstep(0.05, 0.5, abs(t)).oneMinus())
                .mul(0.22)
                .mul(fade)
                .mul(smoothstep(0, 0.15, s))
                .mul(smoothstep(0.6, 1, s).oneMinus())
            );
          });
        }
      }
      const warmC = smoothstep(0, 0.1, out.r.sub(out.b));
      const ink = mix(A.scratchCool, A.scratchWarm, warmC).add(out.mul(0.05));
      const warmLight = smoothstep(0.05, 0.25, out.r.sub(out.b)).mul(
        smoothstep(0.2, 0.5, out.g)
      );
      const covL = cov.mul(warmLight.mul(-0.9).add(1));
      const washed = mix(out, ink, cover(wash.mul(warmLight.oneMinus())));
      out.assign(mix(washed, ink, cover(covL.mul(0.95))));
    });
    return out;
  }).setLayout(
    fnLayout('Scratches', 'vec3', { uv: 'vec2', P: 'vec2', col: 'vec3' })
  );

  const layerRedDrips = Fn(([uv, P, col]) => {
    const out = vec3(col).toVar();
    const inRange = uv.x
      .greaterThanEqual(plus(DRIP_U[0], -0.02))
      .and(uv.x.lessThanEqual(plus(DRIP_U[1], 0.02)))
      .and(uv.y.lessThanEqual(plus(SOOT_TOP, 0.04)))
      .and(uv.y.greaterThanEqual(plus(SOOT_BOT, -0.05)));
    If(inRange, () => {
      const ci = floor(P.x.div(DRIP_COL));
      const ev0 = loopEvent(u.redDripSlots, ci.mul(1.71).add(11));
      const ev = vec2(select(u.anim.lessThanEqual(0), 0, ev0.x), ev0.y);
      const h = hash33(vec3(ci, ev.x, 41));
      const h2 = hash33(vec3(ci, ev.x, 77));
      const zone = smoothstep(DRIP_U[0], plus(DRIP_U[0], 0.03), uv.x).mul(
        smoothstep(plus(DRIP_U[1], -0.04), DRIP_U[1], uv.x).oneMinus()
      );
      const group = smoothstep(
        0.3,
        0.7,
        noise1(
          ci
            .mul(DRIP_COL / 50)
            .add(ev.x.mul(17.3))
            .add(4)
        )
      );
      const x0 = ci.add(0.5).add(h.x.sub(0.5).mul(0.45)).mul(DRIP_COL);
      const topV = noise1(x0.div(40))
        .sub(0.5)
        .mul(0.016)
        .add(plus(SOOT_TOP, 0.01));
      const L = mix(7, 46, pow(h.y, 2.5));
      const r = ev.y.div(DRIP_RUN).clamp(0, 1);
      const run = L.mul(mix(1, pow(r.oneMinus(), 2.5).oneMinus(), u.anim));
      const dry = smoothstep(DRIP_DRY, 1, ev.y).mul(u.anim);
      const y = topV.sub(uv.y).mul(REF).add(h2.z.sub(0.5).mul(6));
      const wT = mix(1, 2.6, h2.x.mul(h2.x));
      const bl = wT.mul(3.5);
      const live = h.z
        .lessThanEqual(zone.mul(DRIP_DENS).mul(group))
        .and(y.greaterThanEqual(-1))
        .and(y.lessThanEqual(run.add(bl.mul(0.5))));
      If(live, () => {
        const wob = noise1(y.div(5).add(h.x.mul(40)))
          .sub(0.5)
          .mul(0.3)
          .add(1);
        const beadW = step(0.35, fract(h2.y.mul(7.1))).mul(
          mix(1.1, 1.5, fract(h.x.mul(13.7)))
        );
        const bead = smoothstep(
          run.sub(bl.mul(1.4)),
          run.sub(bl.mul(0.35)),
          y
        ).mul(
          smoothstep(run.sub(bl.mul(0.1)), run.add(bl.mul(0.5)), y).oneMinus()
        );
        const w0 = wT
          .mul(wob)
          .mul(mix(1, 0.6, y.div(max(run, 1)).clamp(0, 1)))
          .mul(smoothstep(0, 7, y).oneMinus().mul(0.8).add(1));
        const w = max(
          w0
            .mul(step(y, run))
            .mul(
              mix(
                1,
                smoothstep(run.mul(0.6), run, y).mul(-0.6).add(1),
                step(0.5, beadW).oneMinus()
              )
            ),
          wT
            .mul(beadW)
            .mul(bead)
            .mul(smoothstep(5, 12, run))
        );
        const dx = abs(P.x.add(0.5).sub(x0));
        const cv = smoothstep(
          w.mul(0.5).sub(0.6),
          w.mul(0.5).add(0.6),
          dx
        ).oneMinus();
        If(cv.greaterThan(0), () => {
          const body = max(bead, smoothstep(0, 8, y).oneMinus());
          const red0 = mix(A.dripDark, A.dripBright, h2.y)
            .mul(
              mix(0.6, 1, max(body, dx.div(max(w.mul(0.5), 0.5)).oneMinus()))
            )
            .mul(mix(0.8, 1, body));
          const red = mix(red0, A.dripDry, dry.mul(0.7));
          const a = mix(0.55, 0.92, smoothstep(0, 6, y)).mul(
            dry.mul(-0.85).add(1)
          );
          out.assign(mix(out, red, cv.mul(a)));
        });
      });
    });
    return out;
  }).setLayout(
    fnLayout('RedDrips', 'vec3', { uv: 'vec2', P: 'vec2', col: 'vec3' })
  );

  const layerRedFlecks = Fn(([uv, P, col]) => {
    const out = vec3(col).toVar();
    const zone = box(
      uv,
      vec2(FLECK_X[0], plus(SOOT_BOT, -0.02)),
      vec2(FLECK_X[1], FLECK_TOP),
      0.012
    );
    If(zone.greaterThan(0), () => {
      const drift = loopScroll(1, SOOT_PERIOD);
      const Q = vec2(P.x.add(drift), P.y);
      const gi = floor(Q.div(FLECK_CELL));
      const nc = SOOT_PERIOD / 16;
      const near = mix(
        0.45,
        1,
        smoothstep(plus(SOOT_BOT, -0.02), FLECK_TOP, uv.y)
      );
      const cov = float(0).toVar();
      const red = vec3(0).toVar();
      for (let ii = -1; ii <= 0; ii += 1) {
        const cell = vec2(fmod(gi.x.add(ii), nc), gi.y);
        const ev = loopEvent(FLECK_SLOTS, hash12(cell.add(9)).mul(53));
        const h = hash33(vec3(cell, ev.x.mul(3.1).add(5)));
        const cluster = smoothstep(
          0.42,
          0.72,
          accNoiseP(cell.x.mul(16 / 32), SOOT_PERIOD / 32, cell.y.mul(0.37))
        );
        const x0 = gi.x.add(ii).add(h.x.mul(0.7)).mul(FLECK_CELL.x);
        const len = mix(FLECK_LEN[0], FLECK_LEN[1], h.y.mul(h.y));
        const grow = mix(1, smoothstep(0, FLECK_GROW, ev.y), u.anim);
        const fade = smoothstep(FLECK_FADE, 1, ev.y).mul(u.anim).oneMinus();
        const sx = Q.x.sub(x0).div(len);
        const hy = mix(1.5, 3.5, fract(h.z.mul(17))).mul(
          mix(1, 0.6, smoothstep(0.3, 1, sx))
        );
        const yc = cell.y
          .add(0.5)
          .mul(FLECK_CELL.y)
          .add(fract(h.z.mul(31)).sub(0.5).mul(1.5));
        const hc = edgyHash(h.z.mul(71), Q.x);
        const hc2 = edgyHash(h.z.mul(37).add(5), Q.x.mul(1.3));
        const ty = Q.y.sub(yc).sub(hc.sub(0.5).mul(FLECK_RAG));
        const ext = hy.mul(0.5).add(hc2.sub(0.5).mul(FLECK_RAG));
        const ay = smoothstep(
          ext.sub(AA_PX),
          ext.add(AA_PX),
          abs(ty)
        ).oneMinus();
        const ax = smoothstep(-0.1, float(0.6).div(len).add(0.1), sx).mul(
          smoothstep(
            grow.sub(float(0.6).div(len)),
            grow.add(0.1),
            sx
          ).oneMinus()
        );
        const bi = floor(Q.y);
        const bh = hash12(vec2(bi, h.z.mul(31)));
        const dash = edgyHash(
          bi.mul(1.3).add(h.x.mul(17)),
          Q.x.div(mix(1.5, 4, bh))
        );
        const cv = smoothstep(
          0.25,
          0.5,
          mix(0.75, 1, bh).add(dash.sub(0.5).mul(0.7)).sub(sx.mul(0.3))
        );
        const a = cv
          .mul(ay)
          .mul(ax)
          .mul(fade)
          .mul(mix(0.65, 0.95, fract(h.y.mul(3.7))));
        const live = h.z
          .lessThanEqual(u.fleckDensity.mul(cluster).mul(zone).mul(near))
          .and(sx.greaterThanEqual(-0.1))
          .and(sx.lessThanEqual(grow.add(0.1)))
          .and(ay.mul(ax).greaterThan(0))
          .and(a.greaterThan(cov));
        If(live, () => {
          cov.assign(a);
          red.assign(
            mix(A.fleckDark, A.fleckBright, fract(h.y.mul(5.3))).mul(
              mix(0.75, 1.1, bh)
            )
          );
        });
      }
      out.assign(mix(out, red, cov));
    });
    return out;
  }).setLayout(
    fnLayout('RedFlecks', 'vec3', { uv: 'vec2', P: 'vec2', col: 'vec3' })
  );

  const layerAccents = (uv, P, col, { full }) => {
    const out = vec3(col).toVar();
    If(flagOn(u.wedge, places.wedgeOn), () => {
      out.assign(layerWedge(uv, P, out));
    });
    If(flagOn(u.soot, places.sootOn), () => {
      out.assign(layerSoot(uv, P, out));
    });
    if (full) {
      If(u.scratches.greaterThan(0.5), () => {
        out.assign(layerScratches(uv, P, out));
      });
      If(u.redDrips.greaterThan(0.5), () => {
        out.assign(layerRedDrips(uv, P, out));
      });
      If(u.redFlecks.greaterThan(0.5), () => {
        out.assign(layerRedFlecks(uv, P, out));
      });
    }
    return out;
  };

  return { layerAccents };
}

export { Loop };
