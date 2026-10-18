import {
  Fn,
  abs,
  clamp,
  cos,
  dot,
  floor,
  fract,
  max,
  min,
  mix,
  select,
  sign,
  sin,
  smoothstep,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { SORT_BAND } from './blocks';
import { PI, REF, fmod, srgbToLinear } from './common';
import { KIND_GLAZE, KIND_HERO, dirIndex } from './zones';

const HERO_SLOTS = 2;
const HERO_P = 0.75;
const SWEEP_DUR = 0.1;
const HERO_FRAY = 0.45;
const HERO_GLOW = 0.2;
const HERO_STREAK = 0.8;
const BAR_RUN = [30, 180];
const BAR_UMBER = 0.08;
const BAR_TINT = vec3(0.7, 1, 1.35);
const GREY_BAR = 9;

const fnLayout = (name, type, inputs) => ({
  name: `imp${name}`,
  type,
  inputs: Object.entries(inputs).map(([n, t]) => ({ name: n, type: t })),
});

// The authored rectangles: heroes carry the composition as crisp blocks; the
// rest lie on top as glazes.
export default function createHeroes(
  u,
  c,
  smear,
  blocks,
  { debug = false } = {}
) {
  const { hash11, hash12, hash22, loopEvent, noise } = c;
  const { heroJob, paintShade } = smear;
  const { composite, driftAt, wipeFront } = blocks;

  const rect = (i) => {
    const index = i.toInt();
    const info = u.rectInfo.element(index);
    const ang = info.z.mul(0.25 * PI);
    return {
      ang,
      box: u.rectBox.element(index),
      color: u.rectCol.element(index),
      d: vec2(cos(ang), sin(ang)),
      grain: info.y,
      warm: info.x,
    };
  };

  const barcode = Fn(([P, d, seed, contrast]) => {
    const n = vec2(d.y.negate(), d.x);
    const t = dot(P, n);
    const s = dot(P, d);
    const bundle = floor(t.div(14));
    const lw = floor(hash11(bundle.mul(1.37).add(seed)).mul(4)).add(1);
    const line = floor(t.div(lw)).add(bundle.mul(31));
    const hl = hash22(vec2(line, seed.mul(3.3).add(0.9)));
    const L = mix(BAR_RUN[0], BAR_RUN[1], hl.x);
    const seg = floor(s.add(hl.y.mul(L)).div(L));
    const tone = mix(
      hash12(vec2(line.mul(0.71).add(seed), seg)),
      hash11(bundle.mul(2.9).add(seed)),
      0.35
    );
    const lum0 = max(contrast.mul(3).mul(tone.sub(0.5)).add(1), 0.25);
    const a = mix(0.7, 2.3, fract(tone.mul(7.31))).mul(
      noise(vec2(s.div(90), line))
        .mul(0.3)
        .add(0.85)
    );
    return vec4(lum0.mul(lum0).mul(lum0), clamp(a, 0, 2.6), hl.y, 0);
  }).setLayout(
    fnLayout('Barcode', 'vec4', {
      P: 'vec2',
      d: 'vec2',
      seed: 'float',
      contrast: 'float',
    })
  );

  // Position along the grain (0..1), or -1 outside the frayed silhouette.
  const heroHit = Fn(([i, uv, P]) => {
    const r = rect(i);
    const M = 2 / REF;
    const near = uv.x
      .greaterThanEqual(r.box.x.sub(M))
      .and(uv.y.greaterThanEqual(r.box.y.sub(M)))
      .and(uv.x.lessThanEqual(r.box.z.add(M)))
      .and(uv.y.lessThanEqual(r.box.w.add(M)));
    const { d } = r;
    const cen = r.box.xy.add(r.box.zw).mul(0.5);
    const line = floor(dot(P, vec2(d.y.negate(), d.x)).div(u.linePx));
    const s = dot(uv.sub(cen), d);
    const j = u.frayPx
      .mul(HERO_FRAY)
      .mul(
        hash12(
          vec2(line.mul(0.37).add(i), select(s.greaterThan(0), 41, 43))
        ).sub(0.75)
      )
      .div(REF);
    const q = uv.sub(d.mul(sign(s)).mul(j));
    const inside = q.x
      .greaterThanEqual(r.box.x)
      .and(q.y.greaterThanEqual(r.box.y))
      .and(q.x.lessThanEqual(r.box.z))
      .and(q.y.lessThanEqual(r.box.w));
    const hs = r.box.zw.sub(r.box.xy).mul(0.5);
    const along = s
      .mul(0.5)
      .div(abs(d.x).mul(hs.x).add(abs(d.y).mul(hs.y)))
      .add(0.5);
    const dash = hash12(
      vec2(
        line.mul(1.3).add(i),
        floor(dot(P, d).div(mix(6, 26, hash11(line.add(i)))))
      )
    );
    const dry = dash.lessThan(
      u.dryEnd.mul(0.4).mul(smoothstep(0.88, 1, along))
    );
    return select(near.and(inside).and(dry.not()), along, -1);
  }).setLayout(
    fnLayout('HeroHit', 'float', { i: 'float', uv: 'vec2', P: 'vec2' })
  );

  // A re-sort sweep now and then: (shifted lookup px, band strength).
  const heroSweep = Fn(([i, along, P]) => {
    const r = rect(i);
    const ev = loopEvent(HERO_SLOTS, i.mul(3.1).add(71));
    const hs = hash12(vec2(i.mul(1.7), ev.x.add(3)));
    const { d } = r;
    const len = dot(abs(d), r.box.zw.sub(r.box.xy)).mul(REF);
    const sg = select(fract(hs.mul(13.1)).lessThan(0.5), 1, -1);
    const line = floor(dot(P, vec2(d.y.negate(), d.x)).div(u.linePx));
    const sd = wipeFront(ev.y.div(SWEEP_DUR), line, i.add(ev.x)).sub(
      select(sg.greaterThan(0), along, along.oneMinus())
    );
    const on = u.anim
      .greaterThan(0)
      .and(hs.lessThan(HERO_P))
      .and(ev.y.lessThan(SWEEP_DUR))
      .and(sd.greaterThan(0))
      .and(sd.lessThan(SORT_BAND));
    return select(
      on,
      vec3(P.add(d.mul(sg).mul(sd).mul(len)), sd.div(SORT_BAND).oneMinus()),
      vec3(P, 0)
    );
  }).setLayout(
    fnLayout('HeroSweep', 'vec3', { i: 'float', along: 'float', P: 'vec2' })
  );

  const heroLayer = Fn(([i, along, P, col]) => {
    const r = rect(i);
    const sw = heroSweep(i, along, P);
    const Pq = sw.xy;
    const p0 = r.box.xy
      .add(r.box.zw)
      .mul(0.5 * 0.85)
      .add(Pq.div(REF).mul(0.15));
    const lumF = barcode(Pq, r.d, i.add(0.5), r.grain.mul(HERO_STREAK)).x.mul(
      sw.z.mul(HERO_GLOW).add(1)
    );
    const dr = driftAt(Pq, r.d, i.mul(5));
    const paint = heroJob(
      Pq,
      r.ang,
      r.grain,
      i.add(23),
      p0,
      lumF.mul(dr.x),
      dr.y
    );
    const shown = debug
      ? select(sw.z.greaterThan(0), vec3(1, 1, 0), paint.rgb)
      : paint.rgb;
    return composite(col, shown, 1, r.warm, dirIndex(r.ang).add(4 * KIND_HERO));
  }).setLayout(
    fnLayout('HeroLayer', 'vec4', {
      i: 'float',
      along: 'float',
      P: 'vec2',
      col: 'vec4',
    })
  );

  const glazeLayer = Fn(([i, along, uv, P, col]) => {
    const r = rect(i);
    const sw = heroSweep(i, along, P);
    const Pq = sw.xy;
    const meta = dirIndex(r.ang).add(4 * KIND_GLAZE);
    const bc = barcode(Pq, r.d, i, r.grain);
    const top = clamp(uv.y.sub(r.box.y).div(r.box.w.sub(r.box.y)), 0, 1);
    const grey = i.equal(GREY_BAR);
    const umber = grey.and(bc.z.lessThan(BAR_UMBER));
    const base = srgbToLinear(r.color).mul(select(grey, BAR_TINT, vec3(1)));
    const lum = select(
      umber,
      min(bc.x, 1.1),
      bc.x.mul(sw.z.mul(HERO_GLOW).add(1)).mul(mix(0.9, 1.3, top))
    );
    const dr = driftAt(Pq, r.d, i.mul(5));
    const gc = paintShade(select(umber, u.accent.umber, base), lum, dr.y, dr.x);
    const fam = select(umber, 1, r.warm);
    const w = fmod(col.a, 2);
    const same = fam.greaterThan(0.5).equal(w.greaterThan(0.5));
    const ga = select(same, u.glaze.mul(bc.y), 1);
    const glazed = vec4(
      mix(col.rgb, gc, ga),
      select(same, w, fam).add(meta.mul(2))
    );
    return debug
      ? select(sw.z.greaterThan(0), vec4(1, 1, 0, col.a), glazed)
      : glazed;
  }).setLayout(
    fnLayout('GlazeLayer', 'vec4', {
      i: 'float',
      along: 'float',
      uv: 'vec2',
      P: 'vec2',
      col: 'vec4',
    })
  );

  return { barcode, glazeLayer, heroHit, heroLayer, rect };
}
