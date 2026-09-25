/* eslint-disable camelcase */
import {
  float,
  mix,
  mx_noise_float,
  positionGeometry,
  time,
  transformNormalToView,
  vec3,
} from 'three/tsl';

import capsulePress from './capsulePress';

export default function straightBlade(frame, uniforms, { pressers } = {}) {
  const { data, offset, rotateY, t, worldX, worldZ } = frame;
  const height = uniforms.bladeHeight.mul(data.y);
  const gust = mx_noise_float(
    vec3(
      worldX.mul(uniforms.windScale).add(time.mul(uniforms.windSpeed)),
      worldZ.mul(uniforms.windScale),
      time.mul(0.1)
    )
  )
    .mul(0.5)
    .add(0.5);
  const lean = gust
    .mul(uniforms.windStrength)
    .add(0.08)
    .mul(t.mul(t))
    .mul(height);
  const flutter = time
    .mul(3)
    .add(data.x.mul(7))
    .sin()
    .mul(0.04)
    .mul(t)
    .mul(uniforms.windStrength);

  const across = rotateY(
    vec3(
      positionGeometry.x
        .mul(uniforms.bladeWidth)
        .mul(float(1).sub(t.mul(0.85))),
      0,
      0
    )
  );
  const drop = lean.mul(lean).div(height.max(0.01)).mul(0.5);
  const rise = positionGeometry.y.mul(height);
  let bendX = float(0);
  let bendZ = float(0);
  let lift = rise;
  if (pressers) {
    const press = capsulePress(
      vec3(offset.x, offset.y.add(height.mul(0.4)), offset.z),
      pressers.node,
      pressers.count,
      uniforms.pressReach
    );
    const bend = press.y.mul(1.35);
    const away = press.xz.div(press.xz.length().max(1e-4));
    bendX = away.x.mul(rise).mul(bend.sin());
    bendZ = away.y.mul(rise).mul(bend.sin());
    lift = rise.mul(bend.cos());
  }
  const positionNode = vec3(
    offset.x.add(across.x).add(lean.mul(0.8)).add(flutter).add(bendX),
    offset.y.add(lift).sub(drop),
    offset.z.add(across.z).add(lean.mul(0.6)).add(bendZ)
  );

  const shade = mx_noise_float(vec3(worldX.mul(1.3), worldZ.mul(1.3), 3.3))
    .mul(0.15)
    .add(1);

  return {
    colorNode: mix(uniforms.rootColor, uniforms.tipColor, t.pow(1.5))
      .mul(shade)
      .mul(mix(float(0.45), float(1), t)),
    normalNode: transformNormalToView(vec3(0.15, 1, 0.1).normalize()),
    positionNode,
  };
}
