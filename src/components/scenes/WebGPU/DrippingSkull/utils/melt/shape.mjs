import { MeshBVH } from 'three-mesh-bvh';
import { Box3, BufferAttribute, Triangle, Vector3 } from 'three/webgpu';

import { clearance } from './clearance.mjs';
import { densify } from './densify.mjs';
import { boundaryFade, buildTopology, rimWeights } from './topology.mjs';

export function createShape(source, lite, displaySource = null) {
  const walk = densify(source);
  const topology = buildTopology(walk);
  walk.setAttribute('rim', new BufferAttribute(rimWeights(topology), 1));
  walk.setAttribute(
    'fade',
    new BufferAttribute(
      boundaryFade(topology, walk.attributes.position.array),
      1
    )
  );
  walk.setAttribute('clearance', new BufferAttribute(clearance(walk), 1));
  const bounds = new Box3().setFromBufferAttribute(walk.attributes.position);
  const size = bounds.getSize(new Vector3()).length() + 0.5;
  const center = bounds.getCenter(new Vector3());
  const min = center
    .clone()
    .addScalar(-size / 2)
    .toArray();
  const bvh = new MeshBVH(walk, { indirect: true });
  const point = new Vector3();
  const hit = { point: new Vector3(), distance: 0, faceIndex: 0 };
  const triangle = new Triangle();
  const normal = new Vector3();
  const p = walk.attributes.position;
  const index = walk.index;
  const sdf = {
    min,
    size,
    sample(x, y, z) {
      point.set(x, y, z);
      bvh.closestPointToPoint(point, hit);
      const face = hit.faceIndex * 3;
      triangle.a.fromBufferAttribute(p, index.getX(face));
      triangle.b.fromBufferAttribute(p, index.getX(face + 1));
      triangle.c.fromBufferAttribute(p, index.getX(face + 2));
      triangle.getNormal(normal);
      return point.sub(hit.point).dot(normal) < 0
        ? -hit.distance
        : hit.distance;
    },
  };
  const geometry = displaySource ? densify(displaySource) : walk.clone();
  if (displaySource) {
    const bary = new Vector3();
    const renderPosition = geometry.attributes.position;
    const renderNormal = geometry.attributes.normal;
    const weights = new Float32Array(renderPosition.count);
    const room = new Float32Array(renderPosition.count);
    const normals = walk.attributes.normal;
    const cornerNormal = new Vector3();
    for (let i = 0; i < renderPosition.count; i += 1) {
      point.fromBufferAttribute(renderPosition, i);
      bvh.closestPointToPoint(point, hit);
      const face = hit.faceIndex * 3;
      const a = index.getX(face),
        b = index.getX(face + 1),
        c = index.getX(face + 2);
      triangle.a.fromBufferAttribute(p, a);
      triangle.b.fromBufferAttribute(p, b);
      triangle.c.fromBufferAttribute(p, c);
      triangle.getBarycoord(hit.point, bary);
      renderPosition.setXYZ(i, hit.point.x, hit.point.y, hit.point.z);
      normal.set(0, 0, 0);
      for (let k = 0; k < 3; k += 1) {
        const vertex = index.getX(face + k);
        const weight = bary.getComponent(k);
        normal.addScaledVector(
          cornerNormal.fromBufferAttribute(normals, vertex),
          weight
        );
        weights[i] += walk.attributes.fade.getX(vertex) * weight;
        room[i] += walk.attributes.clearance.getX(vertex) * weight;
      }
      normal.normalize();
      renderNormal.setXYZ(i, normal.x, normal.y, normal.z);
    }
    geometry.setAttribute('fade', new BufferAttribute(weights, 1));
    geometry.setAttribute('clearance', new BufferAttribute(room, 1));
    geometry.boundsTree = new MeshBVH(geometry, { indirect: true });
  } else geometry.boundsTree = bvh;
  if (!lite) geometry.computeBoundingSphere();
  return {
    walk,
    geometry,
    sdf,
    center: center.toArray(),
    radius: 1.4,
    topology: () => topology,
    dispose() {
      geometry.dispose();
      walk.dispose();
      source.dispose();
      displaySource?.dispose();
    },
  };
}
