import {
  abs,
  convertToTexture,
  dot,
  float,
  floor,
  fract,
  length,
  mix,
  screenCoordinate,
  screenUV,
  sin,
  smoothstep,
  step,
  time,
  uniform,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';
import * as THREE from 'three/webgpu';

export const defaults = {
  curvature: 0.12,
  scanlines: 0.35,
  lines: 480,
  noise: 0.08,
  chroma: 0.0025,
  jitter: 0.0012,
  roll: 0.12,
  rollSpeed: 0.07,
  vignette: 0.55,
  monochrome: 0.65,
  tint: '#c6dccb',
  flicker: 0.04,
};

const num = (prefix, key, label, min, max, step_, value) => ({
  [`${prefix}${key}`]: { label, max, min, step: step_, value },
});

export function controls(slot) {
  const p = slot.prefix;
  return {
    ...num(p, 'Curvature', 'Curvature', 0, 0.5, 0.005, slot.curvature),
    ...num(p, 'Scanlines', 'Scanlines', 0, 1, 0.01, slot.scanlines),
    ...num(p, 'Lines', 'Line Count', 120, 1080, 10, slot.lines),
    ...num(p, 'Noise', 'Noise', 0, 0.5, 0.005, slot.noise),
    ...num(p, 'Chroma', 'Chroma Split', 0, 0.02, 0.0005, slot.chroma),
    ...num(p, 'Jitter', 'Line Jitter', 0, 0.01, 0.0002, slot.jitter),
    ...num(p, 'Roll', 'Roll Bar', 0, 0.6, 0.01, slot.roll),
    ...num(p, 'RollSpeed', 'Roll Speed', -0.5, 0.5, 0.01, slot.rollSpeed),
    ...num(p, 'Vignette', 'Vignette', 0, 1.5, 0.01, slot.vignette),
    ...num(p, 'Monochrome', 'Monochrome', 0, 1, 0.01, slot.monochrome),
    [`${p}Tint`]: { label: 'Tint', value: slot.tint },
    ...num(p, 'Flicker', 'Flicker', 0, 0.3, 0.005, slot.flicker),
  };
}

const hash = (point) =>
  fract(sin(dot(point, vec2(12.9898, 78.233))).mul(43758.5453));

// A monitor showing a camera feed: barrel-warped glass, per-line sync jitter,
// a rolling hum bar, scanlines, chroma bleed and a tinted monochrome tube.
export function create({ input, slot }) {
  const u = {
    curvature: uniform(slot.curvature),
    scanlines: uniform(slot.scanlines),
    lines: uniform(slot.lines),
    noise: uniform(slot.noise),
    chroma: uniform(slot.chroma),
    jitter: uniform(slot.jitter),
    roll: uniform(slot.roll),
    rollSpeed: uniform(slot.rollSpeed),
    vignette: uniform(slot.vignette),
    monochrome: uniform(slot.monochrome),
    tint: uniform(new THREE.Color(slot.tint)),
    flicker: uniform(slot.flicker),
  };
  const source = convertToTexture(input);

  const centred = screenUV.mul(2).sub(1);
  const warp = float(1).add(u.curvature.mul(centred.yx.mul(centred.yx)));
  const curved = centred.mul(warp).mul(0.5).add(0.5);
  const inside = step(0, curved.x)
    .mul(step(curved.x, 1))
    .mul(step(0, curved.y))
    .mul(step(curved.y, 1));

  const frame = floor(time.mul(30));
  const line = floor(curved.y.mul(u.lines));
  const sync = hash(vec2(line, frame)).sub(0.5).mul(u.jitter);
  const sampleUv = vec2(curved.x.add(sync), curved.y);
  const offset = vec2(u.chroma, 0);
  const color = vec3(
    source.sample(sampleUv.add(offset)).r,
    source.sample(sampleUv).g,
    source.sample(sampleUv.sub(offset)).b
  );

  const luma = dot(color, vec3(0.299, 0.587, 0.114));
  const graded = mix(color, u.tint.mul(luma), u.monochrome);

  const scan = sin(curved.y.mul(u.lines).mul(Math.PI)).mul(0.5).add(0.5);
  const scanned = graded.mul(
    mix(float(1), scan.mul(0.6).add(0.4), u.scanlines)
  );

  const rollPhase = fract(curved.y.add(time.mul(u.rollSpeed)));
  const bar = smoothstep(0, 0.12, rollPhase).mul(
    smoothstep(0.3, 0.12, rollPhase)
  );
  const rolled = scanned.mul(float(1).sub(bar.mul(u.roll)));

  const grain = hash(screenCoordinate.xy.add(vec2(frame.mul(17), frame)))
    .sub(0.5)
    .mul(u.noise);
  const flicker = float(1).sub(hash(vec2(frame, 3.1)).mul(u.flicker));
  const vignette = float(1).sub(
    smoothstep(0.35, 1.25, length(centred.mul(vec2(0.9, 1)))).mul(u.vignette)
  );
  const edge = smoothstep(0, 0.012, abs(curved.sub(0.5)).negate().add(0.5));
  const lit = rolled
    .add(grain)
    .mul(flicker)
    .mul(vignette)
    .mul(edge.x.mul(edge.y))
    .mul(inside);

  return {
    node: vec4(lit.max(0), 1),
    update: (values) => {
      const read = (key) => values[`${slot.prefix}${key}`];
      Object.keys(defaults).forEach((key) => {
        if (key === 'tint') return;
        const control = read(key.charAt(0).toUpperCase() + key.slice(1));
        u[key].value = control ?? slot[key];
      });
      u.tint.value.set(read('Tint') ?? slot.tint);
    },
  };
}
