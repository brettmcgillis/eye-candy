import {
  float,
  mix,
  pow,
  select,
  smoothstep,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

import { PAINT_BASE_HEIGHT } from './constants';
import { rampDown } from './easing';
import erosionFilter from './erosionFilter';
import { fractalNoise, noised } from './noise';
import brushDelta from './paintBrush';

// Where trees can stand: below the treeline, out of the deepest gullies, off the
// steepest faces, away from drainage creases, and above the waterline.
function treeCoverage({ height, normalY, occlusion, ridgeMap, uniforms }) {
  const treeline = rampDown(
    uniforms.grassHeight.add(0.05),
    uniforms.grassHeight.add(0.01),
    height.add(0.01).add(occlusion.sub(0.8).mul(0.05))
  );

  const shore = select(
    uniforms.waterEnabled.greaterThan(0.5),
    smoothstep(uniforms.waterHeight, uniforms.waterHeight.add(0.007), height),
    float(1)
  );

  return treeline
    .mul(smoothstep(0, 0.4, occlusion))
    .mul(smoothstep(0.95, 1, normalY))
    .mul(smoothstep(-1.4, 0, ridgeMap))
    .mul(shore)
    .sub(0.5)
    .div(0.6);
}

// The pre-eroded terrain, as height in x and its derivatives in yz, plus the
// fade target the erosion filter pulls flat ground towards: -1 in valleys, 1 on
// peaks, overshoot allowed.
export function proceduralBase(p, uniforms) {
  const n = fractalNoise(
    p,
    uniforms.heightFrequency,
    uniforms.heightOctaves,
    uniforms.heightLacunarity,
    uniforms.heightGain
  )
    .mul(uniforms.heightAmplitude)
    .toVar();

  const fadeTarget = n.x
    .div(uniforms.heightAmplitude.mul(0.6))
    .clamp(-1, 1)
    .toVar();

  return {
    base: n.mul(0.5).add(vec3(0.5, 0, 0)),
    fadeTarget,
  };
}

const paintFade = (height) =>
  height.sub(PAINT_BASE_HEIGHT).div(0.15).clamp(-1, 1);

export function paintedBase(painted) {
  return {
    base: painted.xyz,
    fadeTarget: paintFade(painted.x),
  };
}

// One brush stamp at the centre of the field, which is exactly what the painted
// variant starts from. Eroding it gives a single isolated peak rather than a
// range, and it needs no paint buffer to hold it.
export function domeBase(p, uniforms) {
  const stamp = brushDelta(p, vec2(0.5, 0.5), uniforms.domeRadius)
    .mul(uniforms.domeAmplitude)
    .add(vec3(PAINT_BASE_HEIGHT, 0, 0))
    .toVar();

  return { base: stamp, fadeTarget: paintFade(stamp.x) };
}

// One texel of the eroded terrain. Channels are the reference's four packed
// layers, kept at the same encodings the renderer reads them back at — a float
// target just means they no longer have to share a single 32-bit word.
export default function buildHeightField({ p, base, fadeTarget, uniforms }) {
  const n = vec3(base).toVar();

  const erosion = erosionFilter({
    assumedSlope: uniforms.assumedSlope,
    cellScale: uniforms.cellScale,
    detail: uniforms.detail,
    fadeTarget,
    gain: uniforms.gain,
    gullyWeight: uniforms.gullyWeight,
    heightAndSlope: n,
    lacunarity: uniforms.lacunarity,
    normalization: uniforms.normalization,
    octaves: uniforms.octaves,
    onset: uniforms.onset,
    p,
    rounding: uniforms.rounding,
    scale: uniforms.scale,
    strength: uniforms.strength,
  });

  const magnitude = erosion.magnitude.max(1e-6).toVar();
  const normalized = erosion.delta.x.div(magnitude).toVar();

  const offset = mix(
    uniforms.heightOffset.x,
    fadeTarget.negate(),
    uniforms.heightOffset.y
  ).mul(erosion.magnitude);

  const height = n.x.add(erosion.delta.x).add(offset).toVar();

  const deriv = n.yz.add(erosion.delta.yz).toVar();
  const normalY = float(1).div(deriv.dot(deriv).add(1).sqrt()).toVar();

  const coverage = treeCoverage({
    height,
    normalY,
    occlusion: normalized.add(0.5),
    ridgeMap: erosion.ridgeMap,
    uniforms,
  });

  const grain = pow(noised(p.add(0.5).mul(200)).x.mul(0.5).add(0.5), 2);
  // Disabled trees encode as -1, not 0: the renderer reads this channel in its
  // [0, 1] form, where 0.5 would still tint half a forest onto the terrain.
  const trees = select(
    uniforms.treesEnabled.greaterThan(0.5),
    coverage.sub(grain).mul(1.5),
    float(-1)
  ).toVar();

  height.addAssign(trees.max(0).div(300));

  return vec4(
    height,
    normalized.mul(0.5).add(0.5).clamp(0, 1),
    erosion.ridgeMap.mul(0.5).add(0.5).clamp(0, 1),
    trees.mul(0.5).add(0.5).clamp(0, 1)
  );
}
