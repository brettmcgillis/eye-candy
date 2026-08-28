/* eslint-disable camelcase */
import {
  float,
  mx_noise_float,
  positionWorld,
  smoothstep,
  time,
  vec3,
} from 'three/tsl';

export default function buildSurfaceColor({ baseColor, descent, surface }) {
  const shaftPoint = vec3(
    positionWorld.x,
    descent.sub(positionWorld.y),
    positionWorld.z
  );

  const grain = mx_noise_float(shaftPoint.mul(surface.mottleScale));

  const drift = time.mul(surface.inkFlow);
  const warp = vec3(
    mx_noise_float(shaftPoint.mul(surface.inkScale.mul(0.37)).add(drift)),
    mx_noise_float(
      shaftPoint.mul(surface.inkScale.mul(0.41)).add(drift.add(19.1))
    ),
    mx_noise_float(
      shaftPoint.mul(surface.inkScale.mul(0.29)).add(drift.add(41.7))
    )
  ).mul(surface.inkWarp);

  const ink = mx_noise_float(shaftPoint.add(warp).mul(surface.inkScale))
    .mul(0.5)
    .add(0.5);
  const blot = smoothstep(surface.inkThreshold, 1, ink);

  return baseColor
    .mul(float(1).add(grain.mul(surface.mottleAmount)))
    .mul(float(1).sub(blot.mul(surface.inkAmount)));
}
