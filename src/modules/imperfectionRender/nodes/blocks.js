import {
  Fn,
  If,
  clamp,
  dot,
  float,
  floor,
  fract,
  max,
  min,
  mix,
  select,
  smoothstep,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import createCells from './cells';
import { REF, fmod } from './common';
import { ANG_H, ANG_V, KIND_GRID, dirIndex } from './zones';

const BLK_DRIFT_LUM = 0.1;
const BLK_DRIFT_HUE = 0.1;
const DRIFT_PX = 260;
const GLAZE_VAR = 0.45;
const LIFE_SLOTS = 3;
const WIPE_IN = 0.09;
const WIPE_OUT = 0.08;
const RAG = 0.35;
export const SORT_BAND = 0.4;
const SORT_GLOW = 0.45;
const SLIDE_FRAC = 0.22;
const SLIDE_DUR = 0.05;

// blocks.glsl: grid blocks are a collapse of the lookup — inside a block every
// pixel reads (nearly) one field point, carrying only a compressed grain.
export default function createBlocks(
  u,
  c,
  zones,
  smear,
  { debug = false, engine = 'grid' } = {}
) {
  const { hash11, hash12, hash22, loopEvent, noise, noise1, zone } = c;
  const { blockDensity } = zones;
  const { gridJob } = smear;
  const partition = createCells(u, c, zones, { engine });

  const driftAt = Fn(([P, d, seed]) => {
    const n = vec2(d.y.negate(), d.x);
    const s = dot(P, d);
    const x = noise1(
      s.div(DRIFT_PX).add(hash11(floor(dot(P, n).div(48)).add(seed)).mul(50))
    ).sub(0.5);
    const y = noise1(
      s
        .div(0.6 * DRIFT_PX)
        .add(hash11(floor(dot(P, n).div(90)).sub(seed)).mul(50))
    ).sub(0.5);
    return vec2(x.mul(2 * BLK_DRIFT_LUM).add(1), y.mul(BLK_DRIFT_HUE));
  }).setLayout({
    name: 'impDriftAt',
    type: 'vec2',
    inputs: [
      { name: 'P', type: 'vec2' },
      { name: 'd', type: 'vec2' },
      { name: 'seed', type: 'float' },
    ],
  });

  const frayPx = Fn(([line, seed]) => {
    const h = hash22(vec2(line.mul(0.37).add(seed), seed.mul(1.9).add(3.1)));
    return u.frayPx
      .mul(h.x.sub(0.65))
      .add(
        select(h.y.lessThan(u.bleedP), u.bleedPx.mul(fract(h.y.mul(97))), 0)
      );
  }).setLayout({
    name: 'impFrayPx',
    type: 'float',
    inputs: [
      { name: 'line', type: 'float' },
      { name: 'seed', type: 'float' },
    ],
  });

  const wipeFront = (pr, line, seed) =>
    pr.mul(1 + RAG).sub(hash12(vec2(line, seed.mul(5.3).add(0.7))).mul(RAG));

  // Glazes stay translucent only over paint of their own family; warm over
  // cool would mix to mud. col.a = warmth + 2 x meta.
  const composite = (col, rgb, cover, bw, meta) => {
    const w = fmod(col.a, 2);
    const same = float(bw).greaterThan(0.5).equal(w.greaterThan(0.5));
    const a = select(float(cover).lessThan(1).and(same), cover, 1);
    return select(
      a.lessThan(1),
      vec4(mix(col.rgb, rgb, a), w.add(meta.mul(2))),
      vec4(rgb, clamp(bw, 0, 1).add(meta.mul(2)))
    );
  };

  // One jittered grid: blockGrid + its paint job + composite.
  const gridLayer = Fn(([uv, colIn, cell, offs, seed]) => {
    const col = vec4(colIn).toVar();
    const { f, id, origin, size } = partition(uv, cell, offs, seed);

    const hl = hash12(id.mul(3.31).add(seed.mul(1.7)));
    const alive = u.anim.greaterThan(0).and(hl.lessThan(u.liveFrac));
    const ev = select(
      alive,
      loopEvent(LIFE_SLOTS, hl.mul(113).add(seed)),
      vec2(0, 0.5)
    ).toVar();
    const key = select(alive, ev.x.add(1), 0);
    const kid = id.add(vec2(17.31, 5.77).mul(key));
    const h01 = hash22(kid.add(seed));
    const h23 = hash22(kid.mul(1.71).add(seed).add(5.3));
    const a = h01.mul(0.45).mul(u.blockFill.oneMinus());
    const b = mix(
      a.add(mix(vec2(0.35), vec2(0.95).sub(a), h23)),
      vec2(1),
      u.blockFill
    );
    const hh = hash12(kid.mul(2.13).add(seed.mul(3.7)));
    const slide = alive.and(fract(hh.mul(71.3)).lessThan(SLIDE_FRAC));
    const m = u.frayPx
      .mul(0.35)
      .add(u.bleedPx)
      .div(size.mul(REF))
      .add(select(slide, 0.3, 0));
    const outside = f.x
      .lessThan(a.x.sub(m.x))
      .or(f.y.lessThan(a.y.sub(m.y)))
      .or(f.x.greaterThan(b.x.add(m.x)))
      .or(f.y.greaterThan(b.y.add(m.y)));

    const cB =
      engine === 'grid'
        ? id.add(a.add(b).mul(0.5)).mul(size).sub(offs)
        : origin.add(a.add(b).mul(0.5).mul(size));
    const cz = zone(cB);
    const dens = blockDensity(cz).toVar();
    zones.blockGate(cell, cz, dens);

    const horP = zones.horP(cz);
    const hor = fract(hh.mul(13.7)).lessThan(horP);
    const ang = select(hor, ANG_H, ANG_V);
    const d = select(hor, vec2(1, 0), vec2(0, 1));
    const aG = select(hor, a, a.yx);
    const bG = select(hor, b, b.yx);

    const sx = fract(hh.mul(5.91)).lessThan(0.5);
    const up = float(0.98).sub(select(sx, b.x, b.y));
    const dn = select(sx, a.x, a.y).sub(0.02);
    const dist = min(max(up, dn).mul(0.9), 0.3).mul(
      select(up.greaterThan(dn), 1, -1)
    );
    const steps = floor(fract(hh.mul(3.17)).mul(3)).add(3);
    const t0 = mix(0.25, 0.6, fract(hh.mul(41.9)));
    const pr = clamp(ev.y.sub(t0).div(SLIDE_DUR), 0, 1);
    const off = select(
      slide,
      select(sx, vec2(1, 0), vec2(0, 1))
        .mul(dist)
        .mul(floor(pr.mul(steps)).div(steps)),
      vec2(0)
    );

    const fG = select(hor, f.sub(off), f.sub(off).yx);
    const uvB0 = uv.sub(off.mul(size));
    const PB0 = uvB0.mul(REF);
    const acrossOut = fG.y.lessThan(aG.y).or(fG.y.greaterThan(bG.y));
    const across = select(hor, PB0.y, PB0.x);
    const line = floor(across.div(u.linePx));
    const lenPx = select(hor, size.x, size.y).mul(REF);
    const lo = aG.x.sub(frayPx(line, hh.mul(31).add(1)).div(lenPx));
    const hi = bG.x.add(frayPx(line, hh.mul(31).add(2)).div(lenPx));
    const alongOut = fG.x.lessThan(lo).or(fG.x.greaterThan(hi));
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
        floor(dot(PB0, d).div(mix(6, 26, hash11(line.add(hh)))))
      )
    );
    const dryOut = dash.lessThan(u.dryEnd.mul(smoothstep(0.82, 1, uu)));

    const pin = ev.y.div(WIPE_IN);
    const wiping = alive.and(pin.lessThan(1));
    const frIn = wipeFront(pin, line, hh);
    const inOut = wiping.and(uu.greaterThan(frIn));
    const sortD = select(wiping, frIn.sub(uu), 0);
    const pout = ev.y.sub(1 - WIPE_OUT).div(WIPE_OUT);
    const leaving = alive.and(pout.greaterThan(0));
    const retract = fract(hh.mul(17.9)).lessThan(0.5);
    const outOut = leaving.and(
      select(
        retract,
        uu.lessThan(wipeFront(pout, line, hh.add(0.5))),
        hash12(vec2(line, floor(uu.mul(blen).div(24)).add(hh.mul(7)))).lessThan(
          pout
        )
      )
    );

    const hit = outside
      .or(hh.greaterThan(dens.mul(u.blockAmount)))
      .or(acrossOut)
      .or(alongOut)
      .or(dryOut)
      .or(inOut)
      .or(outOut)
      .not();

    If(hit, () => {
      const sorting = sortD.greaterThan(0).and(sortD.lessThan(SORT_BAND));
      const sortK = select(sorting, sortD.div(SORT_BAND).oneMinus(), 0);
      const PB = PB0.add(
        d
          .mul(dir)
          .mul(select(sorting, sortD, 0))
          .mul(blen)
      );
      const uvB = select(sorting, PB.div(REF), uvB0);
      const src0 = cB
        .add(
          hash22(kid.add(seed.mul(9.1)))
            .sub(0.5)
            .mul(vec2(0.1, 0.06))
        )
        .add(vec2(0, 0.02));
      const src = select(
        cell.y.greaterThan(0.25),
        src0.sub(vec2(fract(hh.mul(91.7)).mul(0.1).add(0.03), 0)),
        src0
      );
      const lumF = mix(0.85, 1.15, fract(hh.mul(57.1)))
        .mul(sortK.mul(SORT_GLOW).add(1))
        .mul(smoothstep(0, 0.06, uu).oneMinus().mul(-0.1).add(1));
      const dr = driftAt(PB, d, hh.mul(17));
      const ga = select(
        fract(hh.mul(31.3)).greaterThanEqual(0.3),
        1,
        clamp(
          u.glazeA
            .mul(
              hash11(floor(across.div(3)).add(hh.mul(13)))
                .mul(2)
                .sub(1)
                .mul(GLAZE_VAR)
                .add(1)
            )
            .mul(
              noise(vec2(dot(PB, d).div(60), line))
                .mul(0.4)
                .add(0.8)
            ),
          0.08,
          0.95
        )
      );
      const p0 = src.add(uvB.sub(cB).mul(0.18)).sub(uvB.mul(0.6));
      const warmZone = zones.warmZone(cz);
      const paint = gridJob(
        PB,
        ang,
        mix(0.2, 0.1, warmZone),
        seed.add(11),
        p0,
        lumF.mul(dr.x),
        dr.y
      );
      const transition = ev.y
        .lessThan(WIPE_IN)
        .or(ev.y.greaterThan(1 - WIPE_OUT));
      const slid = off.x.notEqual(0).or(off.y.notEqual(0));
      const shown = debug
        ? select(
            alive,
            select(
              transition,
              vec3(1, 0, 1),
              select(slid, vec3(0, 1, 1), vec3(0, 0.6, 0))
            ),
            paint.rgb
          )
        : paint.rgb;
      col.assign(
        composite(col, shown, ga, paint.a, dirIndex(ang).add(4 * KIND_GRID))
      );
    });
    return col;
  }).setLayout({
    name: 'impGridLayer',
    type: 'vec4',
    inputs: [
      { name: 'uv', type: 'vec2' },
      { name: 'colIn', type: 'vec4' },
      { name: 'cell', type: 'vec2' },
      { name: 'offs', type: 'vec2' },
      { name: 'seed', type: 'float' },
    ],
  });

  return { composite, driftAt, frayPx, gridLayer, wipeFront };
}
