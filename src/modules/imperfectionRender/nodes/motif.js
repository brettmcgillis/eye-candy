import {
  Fn,
  If,
  abs,
  cos,
  float,
  floor,
  max,
  mix,
  pow,
  select,
  sin,
  smoothstep,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { PI, srgbToLinear } from './common';
import { KIND_HERO, dirIndex } from './zones';

const PITCH = 1.5;
const OFFSET = 0.75;
// The loader's build order, by lattice index: wings, caps, centre, then the
// four black squares on top.
const LOGO_B = [
  [1, -1],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, 0],
  [-1, 0],
  [0, 0],
];
const LOGO_T = [
  [-1, -1],
  [0, -1],
  [-1, 0],
  [0, 0],
];
const BUILD_IN = [0.04, 0.5];
const BUILD_OUT = [0.84, 0.98];
const WIPE = 0.06;

const fnLayout = (name, type, inputs) => ({
  name: `imp${name}`,
  type,
  inputs: Object.entries(inputs).map(([n, t]) => ({ name: n, type: t })),
});

// The argyle motif (@utils/argylePattern): unit squares on a 1.5 lattice
// (red, layer b) and the same lattice offset by 0.75 (black, layer t, on top),
// in a space turned 45 deg so they read as diamonds. Logo keeps the eleven;
// tiled repeats both lattices forever, eaten by noise into a faded, organic
// lattice. In motif space every edge is axis-aligned, so the grain of a
// diamond runs along its own edges at 45 and 135 deg.
export default function createMotif(u, c) {
  const { hash12, noise, fbm3, loopPhase } = c;

  const toMotif = (p) => {
    const a = u.motifRotation.mul(-PI / 180);
    const q = p.sub(vec2(u.motifX, u.motifY)).div(u.motifScale);
    return vec2(
      q.x.mul(cos(a)).sub(q.y.mul(sin(a))),
      q.x.mul(sin(a)).add(q.y.mul(cos(a)))
    );
  };

  const inLogo = (index, list) =>
    list
      .map(([i, j]) => index.x.equal(i).and(index.y.equal(j)))
      .reduce((any, hit) => any.or(hit));

  const slotOf = (index, list, base) =>
    list.reduce(
      (slot, [i, j], k) =>
        select(index.x.equal(i).and(index.y.equal(j)), float(base + k), slot),
      float(0)
    );

  // One lattice: (coverage, local x, local y, slot). Coverage folds in the
  // logo mask, erosion, fade, the outline frame and the build.
  const lattice = (m, offset, logoList, slotBase, seed) => {
    const index = floor(m.sub(offset).div(PITCH).add(0.5));
    const local = m.sub(index.mul(PITCH).add(offset));
    const edge = max(abs(local.x), abs(local.y));
    const ragged = noise(m.mul(u.motifEdgeScale).add(seed))
      .sub(0.5)
      .mul(u.motifEdge);
    const solid = smoothstep(0.48, 0.5, edge.add(ragged.mul(0.1))).oneMinus();
    const frame = smoothstep(
      float(0.5).sub(u.motifLine),
      float(0.52).sub(u.motifLine),
      edge.sub(ragged.mul(0.05))
    );
    const shape = solid.mul(select(u.motifOutline.greaterThan(0.5), frame, 1));

    const tiled = u.motifMode.greaterThan(1.5);
    const sections = fbm3(index.mul(u.motifErodeScale).add(seed.mul(3.1)));
    const keep = smoothstep(
      u.motifErode.sub(0.04),
      u.motifErode.add(0.04),
      sections.add(
        noise(m.mul(1.7).add(seed)).sub(0.5).mul(u.motifEdge.mul(0.5))
      )
    );
    const fade = mix(
      1,
      hash12(index.add(seed.mul(7.7)))
        .mul(0.7)
        .add(0.3),
      u.motifFade
    );
    const present = select(
      tiled,
      keep.mul(fade),
      float(inLogo(index, logoList))
    );

    const slot = select(
      tiled,
      sections.mul(11),
      slotOf(index, logoList, slotBase)
    );
    const t = loopPhase();
    const start = mix(BUILD_IN[0], BUILD_IN[1], slot.div(11));
    const stop = mix(BUILD_OUT[0], BUILD_OUT[1], slot.div(11));
    const along = select(
      abs(local.y).greaterThan(abs(local.x)),
      local.x,
      local.y
    ).add(0.5);
    const built = smoothstep(
      start,
      start.add(WIPE),
      t.sub(along.mul(WIPE))
    ).mul(smoothstep(stop, stop.add(WIPE), t.sub(along.mul(WIPE))).oneMinus());
    const shown = mix(1, built, u.motifBuild.mul(u.anim.min(1)));
    return vec4(shape.mul(present).mul(shown), local, slot);
  };

  // Front lattice wins: (coverage, local, layer 0 = red b / 1 = black t).
  const motifAt = Fn(([p]) => {
    const m = toMotif(p);
    const b = lattice(m, vec2(0), LOGO_B, 0, float(11.3)).mul(
      vec4(u.motifShowB, 1, 1, 1)
    );
    const t = lattice(m, vec2(OFFSET), LOGO_T, LOGO_B.length, float(23.9)).mul(
      vec4(u.motifShowT, 1, 1, 1)
    );
    const front = t.x.greaterThan(0.5);
    const hit = select(front, t, b);
    return vec4(
      max(t.x, b.x).mul(select(u.motifMode.greaterThan(0.5), 1, 0)),
      hit.yz,
      select(front, 1, 0)
    );
  }).setLayout(fnLayout('MotifAt', 'vec4', { p: 'vec2' }));

  const colorOf = (layer) =>
    select(layer.greaterThan(0.5), u.motifColorT, u.motifColorB);

  // Field placement: the motif is part of the colour source, so the smear
  // drags it like any other paint. sRGB in, sRGB out, warmth by layer.
  const fieldMotif = (p, col, warmth) => {
    const hit = motifAt(p);
    const a = hit.x.mul(u.motifField);
    return {
      col: mix(col, colorOf(hit.w), a),
      warmth: select(a.greaterThan(0.5), hit.w.oneMinus(), warmth),
    };
  };

  return { colorOf, fieldMotif, motifAt, toMotif };
}

// Block placement: the diamonds painted on top of the smear like hero
// blocks — hairline grain from a static smear, the motif's own colour (with
// some of the field bled in), translucent where the tiling fades. Filled
// diamonds alternate grain by layer; outlines run along the edge they draw.
export function createMotifPaint(u, c, motif, field, smear) {
  const { motifAt, colorOf } = motif;
  const { baseField } = field;
  const { grainLum, paintShade } = smear;

  const paint = (uv, P, hit) => {
    const local = hit.yz;
    const alongEdge = abs(local.y).greaterThan(abs(local.x));
    const turn = select(
      u.motifOutline.greaterThan(0.5),
      select(alongEdge, 0, 90),
      select(hit.w.greaterThan(0.5), 90, 0)
    );
    const deg = u.motifRotation.add(turn);
    const ang = deg.sub(floor(deg.div(180)).mul(180)).mul(PI / 180);
    const lum = pow(grainLum(P, ang, u.motifGrain, hit.w.add(31)), 0.6);
    const own = srgbToLinear(colorOf(hit.w));
    const bled = mix(own, baseField(uv, 0.5, u.fieldRects).rgb, u.motifBleed);
    return { ang, rgb: paintShade(bled, lum, float(0)) };
  };

  const motifLayer = Fn(([uv, P, col]) => {
    const out = vec4(col).toVar();
    const hit = motifAt(uv);
    If(hit.x.greaterThan(0.002).and(u.motifBlocks.greaterThan(0.5)), () => {
      const { ang, rgb } = paint(uv, P, hit);
      const w = col.a.sub(floor(col.a.div(2)).mul(2));
      const meta = dirIndex(ang).add(4 * KIND_HERO);
      out.assign(
        vec4(
          mix(col.rgb, rgb, hit.x),
          select(hit.x.greaterThan(0.5), hit.w.oneMinus(), w).add(meta.mul(2))
        )
      );
    });
    return out;
  }).setLayout(
    fnLayout('MotifLayer', 'vec4', { uv: 'vec2', P: 'vec2', col: 'vec4' })
  );

  const motifLite = Fn(([uv, P, col]) => {
    const out = vec3(col).toVar();
    const hit = motifAt(uv);
    If(hit.x.greaterThan(0.002).and(u.motifBlocks.greaterThan(0.5)), () => {
      out.assign(mix(col, paint(uv, P, hit).rgb, hit.x));
    });
    return out;
  }).setLayout(
    fnLayout('MotifLite', 'vec3', { uv: 'vec2', P: 'vec2', col: 'vec3' })
  );

  return { motifLayer, motifLite };
}
