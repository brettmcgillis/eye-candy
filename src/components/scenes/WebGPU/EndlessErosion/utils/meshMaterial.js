import { Fn, positionLocal, vec3, vec4 } from 'three/tsl';
import * as THREE from 'three/webgpu';

import { groundDiffuse } from '@modules/terrainErosion';

// The same field read as displacement instead of marched. The plane is built in
// XZ over the terrain's unit footprint, so its local position is already the
// field coordinate the samplers want.
export default function buildMeshMaterial({ field, uniforms }) {
  const material = new THREE.MeshStandardNodeMaterial({ roughness: 0.9 });

  const fieldUV = () => field.toFieldUV(positionLocal.xz);

  material.positionNode = Fn(() => {
    const height = field.sampleHeight(fieldUV());
    return vec3(positionLocal.x, height, positionLocal.z);
  })();

  material.normalNode = Fn(() => field.sampleData(fieldUV()).normal)();

  material.colorNode = Fn(() => {
    const data = field.sampleData(fieldUV());
    const breakup = field.detailAt(fieldUV()).x.mul(uniforms.detailAmount);

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
