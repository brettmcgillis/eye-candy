import { Fn, and, float, int, select, uv, vec2, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { NO_HIT } from './radialShadowTSL';
import { MAX_WINDOWS } from './radianceConstants';

// Buffer A: the 1D radial distance-field shadow map. One row per light
// (MAX_WINDOWS rows), one column per ray angle (uv.x -> 0..2π). Each texel
// stores the distance from that light to the nearest occluder along that
// angle; the compose pass reads it back per fragment.
export default function buildShadowMapMaterial({
  lightData,
  marchFn,
  windowCount,
}) {
  const material = new THREE.MeshBasicNodeMaterial({ toneMapped: false });

  material.colorNode = Fn(() => {
    const angle = uv().x.mul(Math.PI * 2);
    const i = int(uv().y.mul(MAX_WINDOWS));
    const ld = lightData.element(i);

    const hasLight = and(
      i.lessThan(windowCount),
      and(ld.w.greaterThan(0), ld.z.greaterThan(0))
    );

    const dir = vec2(angle.cos(), angle.sin());
    const dist = marchFn(ld.xy, dir);

    return vec4(select(hasLight, dist, float(NO_HIT)), 0, 0, 1);
  })();

  return material;
}
