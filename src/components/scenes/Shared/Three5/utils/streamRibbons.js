/* eslint-disable no-param-reassign */
import {
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  Vector3,
} from 'three';

export function streamGeometry(capacity) {
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(capacity * 18), 3).setUsage(
      DynamicDrawUsage
    )
  );
  geometry.setAttribute(
    'uv',
    new BufferAttribute(new Float32Array(capacity * 12), 2).setUsage(
      DynamicDrawUsage
    )
  );
  geometry.setDrawRange(0, 0);
  return geometry;
}

const a = new Vector3();
const b = new Vector3();
const tangent = new Vector3();
const side = new Vector3();
const view = new Vector3();

export function writeRibbon(
  geometry,
  index,
  start,
  end,
  camera,
  width,
  u = 0,
  v = 1,
  pressureA = 1,
  pressureB = 1
) {
  if (index * 6 >= geometry.attributes.position.count) return;
  a.copy(start);
  b.copy(end);
  tangent.subVectors(b, a);
  view.subVectors(camera, a);
  side
    .crossVectors(tangent, view)
    .normalize()
    .multiplyScalar(width / 2);
  const p = geometry.attributes.position;
  const { uv } = geometry.attributes;
  const offset = index * 6;
  const ax = side.x * pressureA;
  const ay = side.y * pressureA;
  const az = side.z * pressureA;
  const bx = side.x * pressureB;
  const by = side.y * pressureB;
  const bz = side.z * pressureB;
  p.setXYZ(offset, a.x - ax, a.y - ay, a.z - az);
  p.setXYZ(offset + 1, a.x + ax, a.y + ay, a.z + az);
  p.setXYZ(offset + 2, b.x - bx, b.y - by, b.z - bz);
  p.setXYZ(offset + 3, a.x + ax, a.y + ay, a.z + az);
  p.setXYZ(offset + 4, b.x + bx, b.y + by, b.z + bz);
  p.setXYZ(offset + 5, b.x - bx, b.y - by, b.z - bz);
  uv.setXY(offset, u, 0);
  uv.setXY(offset + 1, u, 1);
  uv.setXY(offset + 2, v, 0);
  uv.setXY(offset + 3, u, 1);
  uv.setXY(offset + 4, v, 1);
  uv.setXY(offset + 5, v, 0);
}

export function finishRibbons(geometry, count) {
  geometry.setDrawRange(0, count * 6);
  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.uv.needsUpdate = true;
}
