import {
  float,
  floor,
  fract,
  mix,
  mod,
  screenSize,
  select,
  sin,
  smoothstep,
  time,
  vec2,
  vec3,
} from 'three/tsl';

import { hash } from './shared';

// Morgan McGuire's value noise: https://www.shadertoy.com/view/4dS3Wd
function valueNoise(st) {
  const i = floor(st);
  const f = fract(st);
  const a = hash(i);
  const b = hash(i.add(vec2(1, 0)));
  const c = hash(i.add(vec2(0, 1)));
  const d = hash(i.add(vec2(1, 1)));
  const u = f.mul(f).mul(f.mul(-2).add(3));
  return mix(a, b, u.x)
    .add(c.sub(a).mul(u.y).mul(u.x.oneMinus()))
    .add(d.sub(b).mul(u.x).mul(u.y));
}

export function shakeUV(uv, u) {
  const shake = valueNoise(
    vec2(uv.y)
      .mul(sin(time.mul(400)))
      .mul(100)
  )
    .sub(0.5)
    .mul(0.0025);
  return vec2(uv.x.add(shake.mul(1.5).mul(u.shake)), uv.y);
}

// Only the bezel follows the curve; sampling stays flat, as in the article.
export function curvedEdge(uv, u) {
  const centered = uv.mul(2).sub(1);
  const offset = centered.yx.mul(u.curve);
  const curved = centered
    .add(centered.mul(offset).mul(offset))
    .mul(0.5)
    .add(0.5);
  const edge = smoothstep(0, 0.02, curved).mul(
    smoothstep(0.98, 1, curved).oneMinus()
  );
  return edge.x.mul(edge.y);
}

// XorDev's staggered aperture-grille mask (GM Shaders Mini: CRT). Each cell
// splits into R/G/B subcells; every column is shifted by half a cell.
export function rgbCells(px, u) {
  const coord = px.div(u.pixelSize);
  const subcoord = coord.mul(vec2(3, 1));
  const cellOffset = vec2(0, mod(floor(coord.x), 3).mul(0.5));

  const index = mod(floor(subcoord.x), 3);
  const cellUV = fract(subcoord.add(cellOffset)).mul(2).sub(1);
  const border = float(1).sub(cellUV.mul(cellUV).mul(u.maskBorder));
  const mask = vec3(
    select(index.equal(0), 2, 0),
    select(index.equal(1), 2, 0),
    select(index.equal(2), 2, 0)
  ).mul(border.x.mul(border.y));

  const sampleUV = floor(coord.add(cellOffset))
    .mul(u.pixelSize)
    .div(screenSize);
  return { sampleUV, mask };
}

export function applyMask(color, mask, u) {
  return select(
    u.maskBlending.greaterThan(0.5),
    color.mul(mask.sub(1).mul(u.maskIntensity).add(1)),
    color.mul(mask)
  );
}

export function scanlines(uv, u) {
  const lines = sin(uv.y.mul(u.scanlineDensity).add(time.mul(u.scanlineSpeed)));
  return mix(float(1), lines.add(1), u.scanlineStrength);
}
