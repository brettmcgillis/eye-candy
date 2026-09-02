import { Fn, If, and, float, int, uv, vec2, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { NO_HIT } from './constants';

// The 1D radial distance-field shadow map: one row per light, one column per
// ray angle (uv.x -> 0..2pi). Each texel stores the distance from that light
// to the nearest occluder along that angle, which the compose pass reads back
// per fragment. The whole buffer is only angleSteps x maxLights texels, which
// is what makes this cheap enough to re-march every frame.
//
// `marchFn` receives the row's light index as a third argument. A scene whose
// lights sit inside their own occluders needs it to exclude the marching light
// from its own scene SDF — otherwise every ray hits at t = 0 and the entire
// frame reads as shadowed. Scenes whose lights and occluders are separate
// bodies (CrossTalk) can ignore it.
export default function buildShadowMapMaterial({
  lightCount,
  lightData,
  marchFn,
  maxLights,
}) {
  const material = new THREE.MeshBasicNodeMaterial({ toneMapped: false });

  material.colorNode = Fn(() => {
    const angle = uv().x.mul(Math.PI * 2);
    const i = int(uv().y.mul(maxLights));
    const ld = lightData.element(i);

    const hasLight = and(
      i.lessThan(lightCount),
      and(ld.w.greaterThan(0), ld.z.greaterThan(0))
    );

    // If, not select: select evaluates both sides, so every row without a
    // light was paying for a full march it then threw away.
    const dist = float(NO_HIT).toVar();

    If(hasLight, () => {
      const dir = vec2(angle.cos(), angle.sin());
      dist.assign(marchFn(ld.xy, dir, i));
    });

    return vec4(dist, 0, 0, 1);
  })();

  return material;
}
