import {
  float,
  instanceIndex,
  materialColor,
  normalGeometry,
  positionGeometry,
  uv,
  vec2,
  vec3,
} from 'three/tsl';
import { MeshStandardNodeMaterial } from 'three/webgpu';

import createPaintState from './nodes';

export default function createPaintNodeMaterial(
  original,
  config,
  { uvMapping = false, seed, instanced = false, bounded = false } = {}
) {
  if (seed === undefined)
    throw new Error('A painted material requires a fill identity');
  const painting = createPaintState();
  painting.apply(config);
  const material = new MeshStandardNodeMaterial();
  material.copy(original);
  material.map = null;
  material.normalMap = null;
  material.roughnessMap = null;
  material.roughness = 1;
  material.metalness = 0;
  const point = positionGeometry.xy
    .mul(0.35)
    .add(positionGeometry.z.mul(vec2(0.17, 0.23)));
  const pieceIdentity = instanced
    ? instanceIndex.toVarying().add(seed)
    : float(seed);
  const identity = bounded
    ? pieceIdentity
        .toUint()
        .shiftLeft(4)
        .bitOr(
          normalGeometry
            .dot(vec3(1, 3, 5))
            .add(5)
            .toUint()
        )
    : pieceIdentity;
  material.colorNode = painting.treat(materialColor, uvMapping ? uv() : point, {
    seed: identity,
    bounded,
    edge: float(0),
  });
  material.addEventListener('dispose', () => painting.dispose());
  return material;
}
