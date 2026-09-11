import { Fn, positionLocal, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { groundDiffuse } from '@modules/terrainErosion';

// The visible half of the mountain. It reads the same baked field the rain probe
// does, so what the drops trace and what the eye sees cannot drift apart.
export default function createMountainMaterial({ field, probe, uniforms }) {
  const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.92 });

  // The grid is a unit square, so local position is already the field
  // coordinate and extent is a uniform rather than a geometry rebuild.
  const fieldUV = () => field.toFieldUV(positionLocal.xz);

  material.positionNode = Fn(() => {
    const height = field
      .sampleHeight(fieldUV())
      .sub(probe.uniforms.base)
      .mul(probe.uniforms.scale);

    return vec3(
      positionLocal.x.mul(probe.uniforms.extent),
      height,
      positionLocal.z.mul(probe.uniforms.extent)
    );
  })();

  material.normalNode = Fn(() => {
    const tilt = probe.uniforms.scale.div(probe.uniforms.extent);
    const slope = field.sampleSlope(fieldUV()).mul(tilt);
    return vec3(slope.x.negate(), 1, slope.y.negate()).normalize();
  })();

  material.colorNode = Fn(() => {
    const data = field.sampleData(fieldUV());
    const breakup = field.detailAt(fieldUV()).x;

    return vec4(
      groundDiffuse({
        breakup,
        erosion: data.erosion,
        height: data.height,
        normalY: data.normal.y,
        occlusion: data.erosion.add(0.5).clamp(0, 1),
        ridgemap: data.ridgemap,
        trees: data.trees,
        uniforms,
      }),
      1
    );
  })();

  return material;
}
