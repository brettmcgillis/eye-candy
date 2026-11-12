import {
  Float32BufferAttribute,
  PlaneGeometry,
  SphereGeometry,
  Vector3,
} from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';

import { DICE } from '@modules/flora';

export default function ornamentGeometry(shape) {
  if (shape === 'petal') return new PlaneGeometry(2, 2);
  if (shape === 'sphere') return new SphereGeometry(1, 16, 12);
  const vertices = DICE[shape].vertices.map((point) => new Vector3(...point));
  const geometry = new ConvexGeometry(vertices);
  const { position } = geometry.attributes;
  const uv = new Float32Array(position.count * 2);
  for (let index = 0; index < position.count; index += 1) {
    uv[index * 2] =
      0.5 +
      Math.atan2(position.getZ(index), position.getX(index)) / (Math.PI * 2);
    uv[index * 2 + 1] =
      0.5 +
      Math.asin(Math.max(-1, Math.min(1, position.getY(index)))) / Math.PI;
  }
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  return geometry;
}
