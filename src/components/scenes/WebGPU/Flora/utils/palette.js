import {
  abs,
  cameraViewMatrix,
  clamp,
  float,
  max,
  mix,
  normalize,
  pow,
  smoothstep,
  vec3,
  vec4,
} from 'three/tsl';

export function crownColor(lobe, u) {
  const bloomCrown = mix(u.budColor, u.crownColor, u.bloom);
  const bloomAccent = mix(u.budColor, u.accentColor, u.bloom);
  const accent = lobe.greaterThanEqual(1).select(float(1), float(0));
  const tint = lobe.fract().sub(0.5).mul(u.tintVariance).add(1);

  return mix(bloomCrown, bloomAccent, accent).mul(tint);
}

export function strandColor(tone, stemness, shade, u) {
  const cube = tone.y.greaterThan(1.5).select(float(1), float(0));
  const crown = mix(
    u.stemColor,
    crownColor(tone.w, u),
    smoothstep(0, u.greenReach, tone.x)
  );
  const tipped = mix(
    crown,
    u.tipColor,
    pow(clamp(tone.y, 0, 1), u.tipPower)
      .mul(u.tipAmount)
      .mul(cube.oneMinus())
  );

  return mix(mix(tipped, u.ornamentColor, cube), u.stemColor, stemness).mul(
    shade
  );
}

export function decodeOct(e) {
  const z = abs(e.x).add(abs(e.y)).oneMinus();
  const t = max(z.negate(), 0);
  const x = e.x.add(e.x.greaterThanEqual(0).select(t.negate(), t));
  const y = e.y.add(e.y.greaterThanEqual(0).select(t.negate(), t));

  return normalize(vec3(x, y, z));
}

export function toViewNormal(worldNormal) {
  return normalize(cameraViewMatrix.mul(vec4(worldNormal, 0)).xyz);
}
