import {
  abs,
  cameraViewMatrix,
  clamp,
  float,
  hue,
  max,
  mix,
  modelNormalMatrix,
  normalize,
  pow,
  smoothstep,
  vec3,
  vec4,
} from 'three/tsl';

import { paletteSample } from './paletteMap';

export function crownColor(lobe, u, along = float(1)) {
  const bloomCrown = mix(u.budColor, u.crownColor, u.bloom);
  const bloomAccent = mix(u.budColor, u.accentColor, u.bloom);
  const accent = lobe.greaterThanEqual(1).select(float(1), float(0));
  const offset = lobe.fract().sub(0.5).mul(2);
  const turned = hue(
    mix(bloomCrown, bloomAccent, accent),
    offset.mul(u.formHue).add(along.mul(u.hueDrift))
  );
  const region = along.mul(0.75).add(lobe.fract().mul(0.25));
  const sampled = paletteSample(u, mix(region, region.oneMinus(), accent));
  const painted = mix(u.budColor, sampled, u.bloom);

  return mix(turned, painted, u.paletteOn).mul(
    offset.mul(u.tintVariance).mul(0.5).add(1)
  );
}

export function ornamentTone(base, rand, u) {
  return mix(base, paletteSample(u, rand), u.paletteOn);
}

export function strandColor(tone, stemness, shade, rand, u) {
  const cube = tone.y.greaterThan(1.5).select(float(1), float(0));
  const crown = mix(
    u.stemColor,
    crownColor(tone.w, u, tone.x),
    smoothstep(0, u.greenReach, tone.x)
  );
  const tipped = mix(
    crown,
    u.tipColor,
    pow(clamp(tone.y, 0, 1), u.tipPower)
      .mul(u.tipAmount)
      .mul(cube.oneMinus())
  );

  return mix(
    mix(tipped, ornamentTone(u.ornamentColor, rand, u), cube),
    u.stemColor,
    stemness
  ).mul(shade);
}

export function decodeOct(e) {
  const z = abs(e.x).add(abs(e.y)).oneMinus();
  const t = max(z.negate(), 0);
  const x = e.x.add(e.x.greaterThanEqual(0).select(t.negate(), t));
  const y = e.y.add(e.y.greaterThanEqual(0).select(t.negate(), t));

  return normalize(vec3(x, y, z));
}

export function toViewNormal(localNormal) {
  return normalize(
    cameraViewMatrix.mul(vec4(modelNormalMatrix.mul(localNormal), 0)).xyz
  );
}
