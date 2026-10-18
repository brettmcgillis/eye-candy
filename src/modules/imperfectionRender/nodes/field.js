import {
  Fn,
  If,
  Loop,
  clamp,
  dot,
  float,
  int,
  max,
  min,
  mix,
  pow,
  select,
  sin,
  smoothstep,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { COOL_ANCHORS, WARM_ANCHORS } from '@modules/imperfection';

import { TAU, srgbToLinear } from './common';

export const FIELD_BG = 2;

const WVAR_FREQ = vec2(24, 2.6);
const WVAR_FREQ_L = vec2(21, 4.2);
const WVAR_CHROMA = 0.3;
const WVAR_LOW_HUE = -0.05;
const WVAR_LOW_LIT = 0.06;
const CORE_HUE_AMP = 0.55;
const CORE_HUE = 0.02;
const CORE_LIT = 0.03;
const WSEED_H = vec2(41.9, 9.1);
const WSEED_L = vec2(52.6, 14.2);

const anchorWeight = (p, a) => {
  const d = p.sub(a.xy);
  const q = a.z.mul(a.z).div(dot(d, d).add(2e-4));
  return q.mul(q);
};

// field.glsl: L0, the one colour source. Anchors and rectangles arrive in
// screen uv (already moved by the layout); the zone boxes are read through
// `zone`. Returns linear rgb + warmth. thr + FIELD_BG is the background's
// lookup, which skips the BG_SKIP rectangles.
// A texture source (image, webcam, a render) is one colour per point; its
// family is read from the colour itself, cover-fitted to the square.
const sourceUV = (u, q) => {
  const aspect = u.sourceAspect;
  const centred = q.sub(0.5);
  const fit = select(
    aspect.greaterThan(1),
    vec2(centred.x.div(aspect), centred.y),
    vec2(centred.x, centred.y.mul(aspect))
  ).add(0.5);
  return vec2(fit.x, fit.y.oneMinus());
};

export default function createField(
  u,
  c,
  motif,
  zones,
  { source = 'anchors' } = {}
) {
  const { noise, noise1, loopPhase, zone } = c;

  const warmShift = Fn(([c0, dh, f]) => {
    const r = max(c0.r, 1e-3);
    const gr = c0.g.div(r);
    const ngr = clamp(gr.add(dh), 0.1, 0.92);
    const col = vec3(
      c0.r,
      r.mul(ngr),
      c0.b.mul(pow(ngr.div(max(gr, 0.05)), 1.3))
    );
    return min(col.mul(pow(vec3(f), vec3(0.8, 1.3, 1.7))), vec3(1));
  }).setLayout({
    name: 'impWarmShift',
    type: 'vec3',
    inputs: [
      { name: 'c', type: 'vec3' },
      { name: 'dh', type: 'float' },
      { name: 'f', type: 'float' },
    ],
  });

  const baseField = Fn(([p, thrIn, nRects]) => {
    const bg = thrIn.greaterThan(1.5);
    const thr = thrIn.sub(select(bg, FIELD_BG, 0));
    const pz = zone(p);
    const ny = noise1(p.y.mul(4).add(2)).mul(2).sub(1);
    const nx = noise1(p.x.mul(4).add(9)).mul(2).sub(1);
    const ph = loopPhase().mul(TAU);
    const s2 = vec2(ny, nx).mul(sin(ph.mul(2)));
    const s3 = vec2(nx, ny.negate()).mul(sin(ph.mul(3)));
    const q = p.add(
      vec2(
        s2.x.mul(0.6).add(s3.x.mul(0.4)),
        s2.y.mul(0.3).add(s3.y.mul(0.2))
      ).mul(u.seamBreath.mul(u.anim))
    );
    const cw = vec3(0).toVar();
    const cc = vec3(0).toVar();
    const warmth = float(0).toVar();
    if (source === 'texture') {
      const picked = u.sourceMap.sample(sourceUV(u, q)).level(0).rgb;
      cw.assign(picked);
      cc.assign(picked);
      warmth.assign(
        smoothstep(
          -0.12,
          0.12,
          picked.r.sub(picked.b).div(picked.r.add(picked.b).add(1e-3))
        )
      );
    } else {
      const ww = float(0).toVar();
      const wc = float(0).toVar();
      Loop(WARM_ANCHORS.length, ({ i }) => {
        const w = anchorWeight(q, u.warmPos.element(i));
        cw.addAssign(u.warmCol.element(i).mul(w));
        ww.addAssign(w);
      });
      Loop(COOL_ANCHORS.length, ({ i }) => {
        const w = anchorWeight(q, u.coolPos.element(i));
        cc.addAssign(u.coolCol.element(i).mul(w));
        wc.addAssign(w);
      });
      warmth.assign(ww.div(ww.add(wc)));
      cw.divAssign(ww);
      cc.divAssign(wc);
    }

    const dLit = u.driftLit.mul(u.anim).mul(s3.y.mul(0.6).add(s2.x.mul(0.4)));
    cc.mulAssign(dLit.add(1));

    const lowCol = zones.lowCol(pz);
    If(lowCol.greaterThan(0), () => {
      const tn = noise(p.mul(vec2(150, 1.1)).add(vec2(3.3, 0)));
      warmth.subAssign(
        u.coolThreads
          .mul(lowCol)
          .mul(smoothstep(u.coolThreadCut, u.coolThreadCut.add(0.1), tn))
      );
    });

    const sel = smoothstep(thr.sub(0.01), thr.add(0.01), warmth);
    const col = vec3(cc).toVar();
    If(sel.greaterThan(0), () => {
      const m = zones.warmVarMask(pz);
      const hN0 = clamp(
        noise(p.mul(WVAR_FREQ).add(WSEED_H)).mul(2).sub(1).mul(1.8),
        -1,
        1
      );
      const lN = clamp(
        noise(p.mul(WVAR_FREQ_L).add(WSEED_L)).mul(2).sub(1).mul(1.6),
        -1,
        1
      );
      const hN = mix(hN0, lN, 0.35);
      const dHue = u.driftHue.mul(u.anim).mul(s2.y.mul(0.6).add(s3.x.mul(0.4)));
      cw.assign(vec3(cw.r, cw.g, cw.b.mul(lowCol.mul(-WVAR_CHROMA).add(1))));
      const core = zones.core(pz);
      const hueAmp = u.warmHueVar.mul(m).mul(mix(1, CORE_HUE_AMP, core));
      const shifted = warmShift(
        cw,
        hueAmp
          .mul(hN)
          .add(dHue)
          .add(lowCol.mul(WVAR_LOW_HUE))
          .add(core.mul(CORE_HUE)),
        u.warmLitVar
          .mul(m)
          .mul(lN)
          .add(1)
          .add(dLit)
          .add(lowCol.mul(WVAR_LOW_LIT))
          .add(core.mul(CORE_LIT))
      );
      col.assign(mix(cc, shifted, sel));
    });

    Loop({ start: int(0), end: nRects.toInt(), type: 'int' }, ({ i }) => {
      const b = u.rectBox.element(i);
      const info = u.rectInfo.element(i);
      const inside = p.x
        .greaterThan(b.x)
        .and(p.y.greaterThan(b.y))
        .and(p.x.lessThan(b.z))
        .and(p.y.lessThan(b.w));
      If(bg.not().or(info.w.lessThan(0.5)).and(inside), () => {
        col.assign(u.rectCol.element(i));
        warmth.assign(info.x);
      });
    });
    If(u.motifMode.greaterThan(0.5).and(u.motifField.greaterThan(0.5)), () => {
      const painted = motif.fieldMotif(p, col, warmth);
      col.assign(painted.col);
      warmth.assign(painted.warmth);
    });
    return vec4(srgbToLinear(col), warmth);
  }).setLayout({
    name: 'impBaseField',
    type: 'vec4',
    inputs: [
      { name: 'p', type: 'vec2' },
      { name: 'thr', type: 'float' },
      { name: 'nRects', type: 'float' },
    ],
  });

  return { baseField };
}
