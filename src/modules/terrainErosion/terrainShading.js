import { cos, exp, float, mix, select, smoothstep, vec3 } from 'three/tsl';

import { rampDown } from './easing';

export const drainageMask = (ridgemap, width) =>
  ridgemap.div(width).clamp(0, 1).oneMinus().mul(1.5).clamp(0, 1);

// Height and erosion occlusion pick the material, not a splat map: cliff where
// the erosion cut deepest, dirt where it filled, snow and grass by altitude,
// sand at the waterline, and the drainage creases washed pale on top.
export function groundDiffuse({
  breakup,
  erosion,
  height,
  normalY,
  occlusion,
  ridgemap,
  trees,
  uniforms,
}) {
  const color = uniforms.cliffColor.mul(smoothstep(0.4, 0.52, height)).toVar();

  color.assign(
    mix(
      color,
      uniforms.dirtColor,
      rampDown(float(0.6), float(0), occlusion.add(breakup.mul(1.5)))
    )
  );
  color.assign(
    mix(color, vec3(1), smoothstep(0.53, 0.6, height.add(breakup.mul(0.1))))
  );

  const sand = mix(
    color,
    uniforms.sandColor,
    rampDown(
      uniforms.waterHeight.add(0.005),
      uniforms.waterHeight,
      height.add(breakup.mul(0.01))
    )
  );
  color.assign(select(uniforms.waterEnabled.greaterThan(0.5), sand, color));

  const grass = mix(
    uniforms.grass1Color,
    uniforms.grass2Color,
    smoothstep(0.4, 0.6, height.sub(erosion.mul(0.05)).add(breakup.mul(0.3)))
  );
  const grassMask = rampDown(
    uniforms.grassHeight.add(0.05),
    uniforms.grassHeight.add(0.02),
    height.add(0.01).add(occlusion.sub(0.8).mul(0.05)).sub(breakup.mul(0.02))
  ).mul(
    smoothstep(
      0.8,
      1,
      normalY.oneMinus().mul(trees.oneMinus()).oneMinus().add(breakup.mul(0.1))
    )
  );
  color.assign(mix(color, grass, grassMask));

  color.assign(
    mix(
      color,
      uniforms.treeColor.mul(trees.pow(8)),
      trees.mul(2.2).sub(0.8).clamp(0, 1).mul(0.6)
    )
  );
  color.mulAssign(breakup.mul(0.5).add(1));

  const washed = mix(
    color,
    vec3(1),
    drainageMask(ridgemap, uniforms.drainageWidth)
  );

  return select(uniforms.drainageEnabled.greaterThan(0.5), washed, color);
}

// The cut faces of the box the terrain sits in, banded at three frequencies so
// the exposed rock reads as bedding planes rather than a flat wall.
export function strataDiffuse(depth) {
  const bands = smoothstep(0, 1, cos(depth.mul(vec3(130, 190, 250)))).toVar();

  const color = vec3(0.3).toVar();
  color.assign(mix(color, vec3(0.5), bands.x));
  color.assign(mix(color, vec3(0.55), bands.y));
  color.assign(mix(color, vec3(0.6), bands.z));

  return color.mul(exp(depth.mul(10))).mul(vec3(1, 0.9, 0.7));
}

export function waterDiffuse({ breakup, depth, facingUp, uniforms }) {
  const shore = select(facingUp, exp(depth.mul(-60)), float(0)).toVar();
  const foam = select(
    facingUp,
    rampDown(float(0.005), float(0), depth.add(breakup.mul(0.005))),
    float(0)
  ).toVar();

  const color = mix(uniforms.waterColor, uniforms.waterShoreColor, shore);

  return mix(color, vec3(1), foam);
}
