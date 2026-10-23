import {
  Fn,
  float,
  mix,
  mx_noise_float as mxNoiseFloat,
  smoothstep,
  uv,
  vec2,
  vec3,
} from 'three/tsl';

export default function createBurnNodes({
  progress,
  seed,
  noiseScale,
  edgeWidth,
  charWidth,
  colorA,
  colorB,
  intensity,
  uvNode = uv(),
}) {
  const noise = Fn(() =>
    mxNoiseFloat(
      vec3(uvNode.mul(vec2(noiseScale.mul(2.35), noiseScale)), seed.mul(43.7))
    )
      .mul(0.5)
      .add(0.5)
  );
  const distance = noise().sub(progress).toVar();
  const glow = smoothstep(edgeWidth, float(0), distance).toVar();
  const char = smoothstep(charWidth, edgeWidth.mul(0.5), distance);
  const emission = mix(colorA, colorB, glow.pow(2.5))
    .mul(glow.pow(1.5))
    .mul(intensity);
  return {
    noise,
    distance,
    glow,
    char,
    emission,
    charColor: vec3(0.01, 0.008, 0.006),
  };
}
