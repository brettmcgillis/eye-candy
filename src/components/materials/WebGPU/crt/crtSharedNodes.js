import {
  Fn,
  abs,
  clamp,
  dot,
  float,
  fract,
  length,
  mix,
  pow,
  select,
  sin,
  smoothstep,
  texture,
  vec2,
  vec3,
} from 'three/tsl';

function hashScalar(point) {
  return fract(sin(dot(point, vec2(127.1, 311.7))).mul(43758.5453123));
}

export const hash21Node = Fn(([point]) => hashScalar(point));

export const hash22Node = Fn(([point]) => {
  const x = hashScalar(point);
  const y = hashScalar(point.add(vec2(17.0, 59.4)));

  return vec2(x, y).mul(2.0).sub(1.0);
});

export const perlin2Node = Fn(([point]) => {
  const cell = point.floor();
  const local = point.fract();
  const easing = local.mul(local).mul(float(3.0).sub(local.mul(2.0)));

  const bl = dot(
    hash22Node(cell.add(vec2(0.0, 0.0))),
    local.sub(vec2(0.0, 0.0))
  );
  const br = dot(
    hash22Node(cell.add(vec2(1.0, 0.0))),
    local.sub(vec2(1.0, 0.0))
  );
  const tl = dot(
    hash22Node(cell.add(vec2(0.0, 1.0))),
    local.sub(vec2(0.0, 1.0))
  );
  const tr = dot(
    hash22Node(cell.add(vec2(1.0, 1.0))),
    local.sub(vec2(1.0, 1.0))
  );

  return mix(mix(bl, br, easing.x), mix(tl, tr, easing.x), easing.y);
});

export const fbm2Node = Fn(([point]) => {
  let value = float(0.0);
  let amplitude = float(0.5);
  let samplePoint = point;

  for (let octave = 0; octave < 4; octave += 1) {
    value = value.add(perlin2Node(samplePoint).mul(amplitude));
    samplePoint = samplePoint.mul(2.0);
    amplitude = amplitude.mul(0.5);
  }

  return value;
});

export const curveUvNode = Fn(([inputUv, curvature]) => {
  const centered = inputUv.mul(2.0).sub(1.0);
  const warp = float(1.0).add(curvature.mul(pow(abs(centered.yx), vec2(2.0))));

  return centered.mul(warp).mul(0.5).add(0.5);
});

export const vignetteFactorNode = Fn(([inputUv, vignette]) => {
  const d = length(inputUv.sub(vec2(0.5)));
  return float(1.0).sub(smoothstep(float(0.75), vignette, d));
});

export const scanlineFactorNode = Fn(([inputUv, density, strength]) => {
  return sin(inputUv.y.mul(density)).mul(strength);
});

export const staticNoiseNode = Fn(
  ([inputUv, timeNode, scaleNode, speedNode]) => {
    const timeBucket = timeNode.mul(speedNode).floor();
    const primary = hash21Node(
      inputUv.mul(scaleNode).add(vec2(timeBucket, timeBucket.negate()))
    );
    const secondary = hash21Node(
      inputUv
        .mul(scaleNode.mul(1.7))
        .add(vec2(timeBucket.mul(-2.0), timeBucket))
    );

    return primary.mul(0.6).add(secondary.mul(0.4));
  }
);

export const chromaSplitNode = Fn(([sourceTexture, inputUv, chromaOffset]) => {
  const red = texture(sourceTexture, inputUv.add(vec2(chromaOffset, 0.0))).r;
  const green = texture(sourceTexture, inputUv).g;
  const blue = texture(sourceTexture, inputUv.sub(vec2(chromaOffset, 0.0))).b;

  return vec3(red, green, blue);
});

export const rgbLumaNode = Fn(([colorNode]) =>
  dot(colorNode, vec3(0.299, 0.587, 0.114))
);

export const maskPatternNode = Fn(([inputUv, maskMode, maskStrength]) => {
  const triad = vec3(
    sin(inputUv.x.mul(900.0)),
    sin(inputUv.x.mul(900.0).add(2.1)),
    sin(inputUv.x.mul(900.0).add(4.2))
  )
    .mul(0.5)
    .add(0.5);
  const grille = vec3(sin(inputUv.x.mul(1400.0)).mul(0.5).add(0.5));
  const mask = select(maskMode.greaterThanEqual(0.5), grille, triad);

  return mix(vec3(1.0), mask, maskStrength);
});

export const clamp01Node = Fn(([inputNode]) => clamp(inputNode, 0.0, 1.0));
