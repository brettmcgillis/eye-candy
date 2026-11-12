/* eslint-disable no-continue */
import { Vector3 } from 'three';

import { configureBrush, configureFill } from './paintStyle';

export default function projectDrawing(geometry, camera, config) {
  camera.updateMatrixWorld();
  const { position } = geometry.attributes;
  const indices = geometry.index;
  const faces = [];
  const normal = new Vector3();
  const edge = new Vector3();
  const eye = new Vector3();
  for (let i = 0; i < indices.count; i += 3) {
    const vertices = [0, 1, 2].map((corner) =>
      new Vector3().fromBufferAttribute(position, indices.getX(i + corner))
    );
    normal.subVectors(vertices[1], vertices[0]);
    edge.subVectors(vertices[2], vertices[0]);
    normal.cross(edge);
    eye.subVectors(camera.position, vertices[0]);
    if (normal.dot(eye) <= 0) continue;
    const depth =
      vertices.reduce(
        (sum, vertex) => sum + vertex.distanceToSquared(camera.position),
        0
      ) / 3;
    const projected = vertices.map((vertex) => vertex.project(camera));
    if (projected.some((vertex) => vertex.z < -1 || vertex.z > 1)) continue;
    faces.push({
      points: projected.map((vertex) => [
        384 + vertex.x * 384 * (camera.aspect || 1),
        384 - vertex.y * 384,
      ]),
      depth,
    });
  }
  faces.sort((a, b) => b.depth - a.depth);
  return (brush) => {
    configureBrush(brush, config);
    faces.forEach((face, index) => {
      if (config.projectionFaces)
        configureFill(
          brush,
          config,
          index % 3 ? config.pigment : config.pigmentB
        );
      else {
        brush.noFill();
        brush.noWash();
      }
      if (config.projectionEdges)
        brush.set(config.brush, config.ink, config.strokeWeight);
      else brush.noStroke();
      brush.polygon(face.points);
    });
  };
}
