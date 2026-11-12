/* eslint-disable no-continue */
import { Matrix4, Vector3 } from 'three';

export default function createDepthSampler(faces, size = 112) {
  const depth = new Float32Array(size * size);
  const matrix = new Matrix4();
  const points = [new Vector3(), new Vector3(), new Vector3()];
  const projected = new Vector3();
  function rebuild(camera, world) {
    matrix
      .multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      .multiply(world);
    depth.fill(Infinity);
    faces.forEach((face) => {
      for (let j = 0; j < 3; j += 1) {
        points[j].copy(face.points[j]).applyMatrix4(matrix);
        points[j].x = (points[j].x * 0.5 + 0.5) * size;
        points[j].y = (points[j].y * 0.5 + 0.5) * size;
      }
      const [a, b, c] = points;
      const area = (b.y - c.y) * (a.x - c.x) + (c.x - b.x) * (a.y - c.y);
      if (Math.abs(area) < 0.00001) return;
      const minX = Math.max(0, Math.floor(Math.min(a.x, b.x, c.x)));
      const maxX = Math.min(size - 1, Math.ceil(Math.max(a.x, b.x, c.x)));
      const minY = Math.max(0, Math.floor(Math.min(a.y, b.y, c.y)));
      const maxY = Math.min(size - 1, Math.ceil(Math.max(a.y, b.y, c.y)));
      for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x <= maxX; x += 1) {
          const u =
            ((b.y - c.y) * (x + 0.5 - c.x) + (c.x - b.x) * (y + 0.5 - c.y)) /
            area;
          const v =
            ((c.y - a.y) * (x + 0.5 - c.x) + (a.x - c.x) * (y + 0.5 - c.y)) /
            area;
          if (u < 0 || v < 0 || u + v > 1) continue;
          const z = u * a.z + v * b.z + (1 - u - v) * c.z;
          const index = y * size + x;
          if (z < depth[index]) depth[index] = z;
        }
      }
    });
  }
  function visible(point) {
    projected.copy(point).applyMatrix4(matrix);
    const x = Math.floor((projected.x * 0.5 + 0.5) * size);
    const y = Math.floor((projected.y * 0.5 + 0.5) * size);
    if (x < 0 || y < 0 || x >= size || y >= size) return false;
    return projected.z <= depth[y * size + x] + 0.0012;
  }
  return { rebuild, visible };
}
