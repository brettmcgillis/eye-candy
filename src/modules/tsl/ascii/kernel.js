import {
  Fn,
  If,
  PI,
  atan,
  clamp,
  dot,
  float,
  floor,
  fract,
  length,
  max,
  mix,
  mod,
  pow,
  screenCoordinate,
  screenSize,
  select,
  sin,
  smoothstep,
  step,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { blendNoise } from './blend';
import { hash21, isOn, luma, valueNoise } from './shared';

const inCell = (p) =>
  p.x
    .greaterThanEqual(0)
    .and(p.x.lessThanEqual(1))
    .and(p.y.greaterThanEqual(0))
    .and(p.y.lessThanEqual(1));

// Atlases are one row of glyphs; outside the cell a glyph reads as empty.
function sampleAtlas(atlas, count, index, p) {
  const i = clamp(index, 0, count.sub(1));
  const atlasUv = vec2(i.add(clamp(p.x, 0, 1)).div(count), clamp(p.y, 0, 1));
  return atlas.sample(atlasUv).level(0);
}

// Contour runs perpendicular to the gradient; edge atlas order is - | / \.
function edgeIndex(gx, gy) {
  const a = mod(atan(gy, gx).add(PI), PI);
  const sector = floor(a.div(PI.div(4)));
  return select(
    sector.equal(0),
    float(1),
    select(
      sector.equal(1),
      float(2),
      select(sector.equal(2), float(0), float(3))
    )
  );
}

// Screen space is y-down here, so "up" neighbours sit at -y and the Sobel
// keeps the reference's y-up sign convention.
export default function buildAscii({ atlases, memory, sample, u }) {
  return Fn(() => {
    const tuneLuma = (l) =>
      clamp(
        pow(clamp(l, 0, 1), float(1).div(max(u.gamma, 0.001)))
          .sub(0.5)
          .mul(u.contrast)
          .add(0.5)
          .add(u.brightness),
        0,
        1
      );

    const fragPx = screenCoordinate.xy;
    const cellIndex = floor(fragPx.div(u.cellSize));
    const cellOriginPx = cellIndex.mul(u.cellSize);
    const cellCenterUv = cellOriginPx.add(u.cellSize.mul(0.5)).div(screenSize);

    const mem = memory(cellIndex.add(0.5).div(u.gridSize));
    const useMemory = isOn(u.useMemory);
    const cellColor = select(useMemory, mem.rgb, sample(cellCenterUv).rgb);
    const activity = select(useMemory, mem.a, float(0));
    const lumRaw = luma(cellColor);
    const lum = tuneLuma(lumRaw);

    const local = fragPx.sub(cellOriginPx).div(u.cellSize);
    const p = local.sub(0.5).div(max(u.glyphScale, 0.001)).add(0.5);
    const visible = select(inCell(p), float(1), float(0));

    const mask = float(0).toVar();
    const drewEdge = float(0).toVar();

    If(isOn(u.edges), () => {
      const cell = vec2(u.cellSize).div(screenSize);
      const at = (dx, dy) =>
        tuneLuma(luma(sample(cellCenterUv.add(cell.mul(vec2(dx, dy)))).rgb));
      const tl = at(-1, -1);
      const t = at(0, -1);
      const tr = at(1, -1);
      const l = at(-1, 0);
      const r = at(1, 0);
      const bl = at(-1, 1);
      const b = at(0, 1);
      const br = at(1, 1);
      const gx = tl
        .negate()
        .sub(l.mul(2))
        .sub(bl)
        .add(tr)
        .add(r.mul(2))
        .add(br);
      const gy = tl.add(t.mul(2)).add(tr).sub(bl).sub(b.mul(2)).sub(br);

      If(length(vec2(gx, gy)).greaterThan(u.edgeThreshold), () => {
        const glyph = sampleAtlas(
          atlases.edge,
          u.edgeCount,
          edgeIndex(gx, gy),
          p
        );
        mask.assign(glyph.a.mul(visible));
        drewEdge.assign(1);
      });
    });

    If(drewEdge.lessThan(0.5), () => {
      const dark = clamp(lum.oneMinus(), 0, 1);
      const t = select(isOn(u.invert), dark.oneMinus(), dark);
      const jitter = fract(
        sin(dot(cellIndex, vec2(12.9898, 78.233))).mul(43758.5453)
      );
      const base = t
        .mul(u.glyphCount.sub(1))
        .add(jitter.sub(0.5).mul(2).mul(u.variety));
      const glyph = (index) =>
        sampleAtlas(atlases.glyph, u.glyphCount, index, p).a.mul(visible);
      const sdf = (index) =>
        sampleAtlas(atlases.sdf, u.glyphCount, index, p).r.mul(visible);

      If(isOn(u.glyphBlend), () => {
        const i = floor(base);
        const f = fract(base);
        // The cross-fade is a transition, not a resting state: a settled cell
        // snaps to one glyph, a morphing one blends.
        const morphAmt = clamp(activity.mul(3), 0, 1);
        const blendZone = max(0.04, mix(1, 0.08, u.magnet));
        const fade = smoothstep(0, blendZone, morphAmt);
        const snap = clamp(fade.oneMinus().mul(u.magnet), 0, 1);
        const snapped = smoothstep(0.38, 0.62, f);
        const fAdj = mix(f, snapped, snap);

        If(isOn(u.sdfMorph), () => {
          const d = mix(sdf(i), sdf(i.add(1)), fAdj);
          const aa = max(u.sdfAA, 0.001);
          mask.assign(
            smoothstep(u.sdfThreshold.sub(aa), u.sdfThreshold.add(aa), d)
          );
        }).Else(() => {
          mask.assign(mix(glyph(i), glyph(i.add(1)), fAdj));
        });
      }).Else(() => {
        mask.assign(glyph(clamp(floor(base.add(0.5)), 0, u.glyphCount.sub(1))));
      });
    });

    const notWhite = step(u.whiteCutoff, lumRaw).oneMinus();
    const mott = select(
      u.colorVar.equal(0),
      float(1),
      valueNoise(fragPx.mul(0.08)).sub(0.5).mul(2).mul(u.colorVar).add(1)
    );
    const ink = cellColor.mul(mott);

    const out = vec3(0).toVar();
    If(u.colorMode.equal(0), () => {
      out.assign(mix(u.background, u.ink.mul(mott), mask));
    })
      .ElseIf(u.colorMode.equal(1), () => {
        out.assign(mix(ink, vec3(0.05), mask));
      })
      .ElseIf(u.colorMode.equal(2), () => {
        out.assign(mix(vec3(1), ink, mask.mul(notWhite)));
      })
      .Else(() => {
        out.assign(mix(u.background, ink, mask.mul(notWhite)));
      });

    const grain = hash21(floor(fragPx.div(max(u.noiseScale, 1))));
    const grained = blendNoise(out, grain, u.noiseMode);
    return vec4(clamp(mix(out, grained, u.noise), 0, 1), 1);
  })();
}
