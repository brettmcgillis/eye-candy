import {
  Fn,
  If,
  Loop,
  clamp,
  float,
  floor,
  int,
  ivec2,
  min,
  mix,
  sRGBTransferEOTF,
  screenCoordinate,
  screenSize,
  select,
  textureLoad,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import {
  FIELD_RECTS,
  GRID_CELLS,
  GRID_OFFSETS,
  RECTS,
} from '@modules/imperfection';

import createAccents from './accents';
import createBlocks from './blocks';
import createCommon, { REF, linearToSrgb } from './common';
import createField from './field';
import createGrade from './grade';
import createHeroes from './heroes';
import createLite from './lite';
import createMotif, { createMotifPaint } from './motif';
import createSmear from './smear';
import createWet, { wetPack, wetUnpack } from './wet';
import createZones, { dirIndex } from './zones';

// Laid-out Fns are cached per Fn object, uniforms included; each pass gets
// its own set so no pipeline reads a uniform another pass declared.
function createLibrary(
  u,
  {
    composition = 'reference',
    debug = false,
    engine = 'grid',
    source = 'anchors',
  } = {}
) {
  const c = createCommon(u);
  const motif = createMotif(u, c);
  const zones = createZones(u, c, { composition });
  const field = createField(u, c, motif, zones, { source });
  const smear = createSmear(u, c, field);
  const blocks = createBlocks(u, c, zones, smear, { debug, engine });
  const heroes = createHeroes(u, c, smear, blocks, { debug });
  const motifPaint = createMotifPaint(u, c, motif, field, smear);
  return { blocks, c, field, heroes, motifPaint, smear, zones };
}

// Reference fragCoord (bottom-left origin) of this fragment.
const fragCoord = () =>
  vec2(screenCoordinate.x, screenSize.y.sub(screenCoordinate.y));

const canvas = (fc) => {
  const side = min(screenSize.x, screenSize.y);
  const uv = fc.sub(screenSize.sub(side).mul(0.5)).div(side);
  return { side, uv };
};

const outsideSquare = (uv) =>
  uv.x
    .lessThan(0)
    .or(uv.x.greaterThan(1))
    .or(uv.y.lessThan(0))
    .or(uv.y.greaterThan(1));

// The renderer encodes its output to sRGB; the reference encodes with
// pow(1/2.2). Handing it the decoded gamma value lands the reference's bytes.
const toOutput = (srgb) => vec4(sRGBTransferEOTF(srgb), 1);

function mirrored(u, fc) {
  return vec2(
    select(u.mirror.greaterThan(0.5), screenSize.x.sub(fc.x), fc.x),
    fc.y
  );
}

// Buffer A: L1 + L2, crisp, linear; alpha packs grain, kind and wetness.
export function paintBufferNode(u, { composition, engine, source, view }) {
  const lib = createLibrary(u, {
    composition,
    source,
    debug: view === 'blocks',
    engine,
  });
  const { gridLayer } = lib.blocks;
  const { glazeLayer, heroHit, heroLayer } = lib.heroes;
  const { baseField } = lib.field;
  const { directionField, wetness } = lib.zones;
  const { smearJob } = lib.smear;
  const { motifLayer } = lib.motifPaint;

  const layerPaint = Fn(([uv, uvZ, P]) => {
    const df = directionField(uvZ);
    const bg = smearJob(P, df.ang, df.len, df.spread, df.dark);
    const col = vec4(
      bg.rgb,
      clamp(bg.a, 0, 1).add(dirIndex(df.ang).mul(2))
    ).toVar();
    If(u.blocksEnabled.greaterThan(0.5), () => {
      GRID_CELLS.forEach((cell, k) => {
        If(u.blockLayers.greaterThan(k), () => {
          col.assign(
            gridLayer(uv, col, vec2(...cell), vec2(...GRID_OFFSETS[k]), k + 1)
          );
        });
      });
      const hit = int(-1).toVar();
      const along = float(0).toVar();
      Loop(
        { start: int(0), end: u.fieldRects.toInt(), type: 'int' },
        ({ i }) => {
          const a = heroHit(float(i), uv, P);
          If(a.greaterThanEqual(0), () => {
            hit.assign(i);
            along.assign(a);
          });
        }
      );
      If(hit.greaterThanEqual(0), () => {
        col.assign(heroLayer(float(hit), along, P, col));
      });
      const hitG = int(-1).toVar();
      const alongG = float(0).toVar();
      Loop(
        { start: u.fieldRects.toInt(), end: int(RECTS.length), type: 'int' },
        ({ i }) => {
          const a = heroHit(float(i), uv, P);
          If(a.greaterThanEqual(0), () => {
            hitG.assign(i);
            alongG.assign(a);
          });
        }
      );
      If(hitG.greaterThanEqual(0), () => {
        col.assign(glazeLayer(float(hitG), alongG, uv, P, col));
      });
    });
    If(u.motifMode.greaterThan(0.5), () => {
      col.assign(motifLayer(uv, P, col));
    });
    return vec4(col.rgb, floor(col.a.mul(0.5)));
  }).setLayout({
    name: 'impLayerPaint',
    type: 'vec4',
    inputs: [
      { name: 'uv', type: 'vec2' },
      { name: 'uvZ', type: 'vec2' },
      { name: 'P', type: 'vec2' },
    ],
  });

  return Fn(() => {
    const { uv } = canvas(fragCoord());
    if (view === 'field') return vec4(baseField(uv, 0.5, u.fieldRects).rgb, 0);
    const uvZ = lib.c.zone(uv);
    const col = layerPaint(uv, uvZ, uv.mul(REF));
    return vec4(col.rgb, wetPack(col.a, wetness(uvZ, col.a)));
  })();
}

// Image: the wet smear of Buffer A, then the dry marks and the light.
export function imageNode(u, buffer, { composition, lic = false, view }) {
  const c = createCommon(u);
  const zones = createZones(u, c, { composition });
  const { layerWet } = createWet(u, c, buffer, zones, { lic });
  const { layerAccents } = createAccents(u, c, zones);
  const { impasto, layerGlow, layerGrade } = createGrade(u, c, zones);

  return Fn(() => {
    const fc = mirrored(u, fragCoord());
    const { side, uv } = canvas(fc);
    const out = vec3(0).toVar();
    const texel = () =>
      textureLoad(buffer, ivec2(vec2(fc.x, screenSize.y.sub(fc.y))));
    If(u.clipSquare.lessThan(0.5).or(outsideSquare(uv).not()), () => {
      if (view === 'field') {
        out.assign(linearToSrgb(texel().rgb));
      } else if (view === 'wetness') {
        const m = wetUnpack(texel().a);
        const hue = select(
          m.x.equal(0),
          vec3(1, 0.2, 0.2),
          select(
            m.x.equal(1),
            vec3(1, 0.9, 0.2),
            select(m.x.equal(2), vec3(0.2, 1, 0.3), vec3(0.3, 0.4, 1))
          )
        );
        out.assign(mix(vec3(m.z), hue.mul(m.z), 0.5));
      } else {
        const uvZ = c.zone(uv);
        const P = uv.mul(REF);
        const wet =
          view === 'blocks' ? texel().rgb : layerWet(fc, screenSize, side);
        const marked = layerAccents(uvZ, P, wet, { full: true });
        out.assign(
          linearToSrgb(layerGrade(layerGlow(uvZ, marked)).mul(u.exposure))
        );
      }
    });
    return toOutput(impasto(out, min(screenSize.x, screenSize.y)));
  })();
}

// Lite: one pass, one field lookup per pixel.
export function liteNode(u, { composition, engine, source, view }) {
  const lib = createLibrary(u, { composition, engine, source });
  const { liteMain } = createLite(
    u,
    lib.c,
    lib.field,
    lib.zones,
    lib.smear,
    lib.blocks,
    { engine }
  );
  const { layerAccents } = createAccents(u, lib.c, lib.zones);
  const { impasto, layerGlow, layerGrade } = createGrade(u, lib.c, lib.zones);

  return Fn(() => {
    const fc = mirrored(u, fragCoord());
    const { uv } = canvas(fc);
    const out = vec3(0).toVar();
    If(u.clipSquare.lessThan(0.5).or(outsideSquare(uv).not()), () => {
      if (view === 'field') {
        out.assign(linearToSrgb(lib.field.baseField(uv, 0.5, FIELD_RECTS).rgb));
      } else {
        const uvZ = lib.c.zone(uv);
        const P = uv.mul(REF);
        const painted = vec3(liteMain(uv, uvZ, P)).toVar();
        If(u.motifMode.greaterThan(0.5), () => {
          painted.assign(lib.motifPaint.motifLite(uv, P, painted));
        });
        const marked = layerAccents(uvZ, P, painted, { full: false });
        out.assign(
          linearToSrgb(layerGrade(layerGlow(uvZ, marked)).mul(u.exposure))
        );
      }
    });
    return toOutput(impasto(out, min(screenSize.x, screenSize.y)));
  })();
}
