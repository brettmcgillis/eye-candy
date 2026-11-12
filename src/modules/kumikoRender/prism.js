import * as THREE from 'three';

// Panel millimetres (y down) to world units (y up, panel centred).
export const MM = 0.01;

export function toWorld(panel) {
  const cx = panel.width / 2;
  const cy = panel.height / 2;
  return ([x, y]) => [(x - cx) * MM, (cy - y) * MM];
}

export const GRAIN_UP = [0, 1, 0];

// Accumulates extruded polygons into one non-indexed geometry, optionally
// with a colour per prism and a wood grain: the direction the grain runs in
// world xy, plus a per-piece offset so neighbours don't share rings.
export function createPrismBuilder({
  colors = false,
  grain = false,
  washBoundary = false,
} = {}) {
  const position = [];
  const normal = [];
  const uv = [];
  const color = [];
  const grains = [];
  const boundaries = [];
  const paintCoordinates = [];

  function add(poly, z0, z1, rgb = [1, 1, 1], run = GRAIN_UP) {
    const xs = poly.map(([x]) => x);
    const ys = poly.map(([, y]) => y);
    const x0 = Math.min(...xs);
    const y0 = Math.min(...ys);
    const w = Math.max(...xs) - x0 || 1;
    const h = Math.max(...ys) - y0 || 1;
    const turns = washBoundary
      ? poly
          .map((a, i) => {
            const b = poly[(i + 1) % poly.length];
            const c = poly[(i + 2) % poly.length];
            return Math.sign(
              (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])
            );
          })
          .filter(Boolean)
      : [];
    const convex = turns.every((turn) => turn === turns[0]);
    const boundaryAt = (p) =>
      Math.min(
        ...poly.map((a, i) => {
          const b = poly[(i + 1) % poly.length];
          const dx = b[0] - a[0];
          const dy = b[1] - a[1];
          const t = Math.max(
            0,
            Math.min(
              1,
              ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) /
                (dx * dx + dy * dy || 1)
            )
          );
          return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t);
        })
      ) / Math.min(w, h);
    const shapeCoordinates = (p) => {
      const a = poly[0];
      const b = poly[1];
      const d = poly[poly.length - 1];
      if (poly.length === 3) {
        const bx = b[0] - a[0];
        const by = b[1] - a[1];
        const dx = d[0] - a[0];
        const dy = d[1] - a[1];
        const det = bx * dy - by * dx || 1;
        return [
          1,
          ((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / det,
          (bx * (p[1] - a[1]) - by * (p[0] - a[0])) / det,
        ];
      }
      if (poly.length === 4 && convex) {
        const c = poly[2];
        const bx = b[0] - a[0];
        const by = b[1] - a[1];
        const dx = d[0] - a[0];
        const dy = d[1] - a[1];
        const cx = a[0] - b[0] + c[0] - d[0];
        const cy = a[1] - b[1] + c[1] - d[1];
        let u = 0.5;
        let v = 0.5;
        for (let i = 0; i < 6; i += 1) {
          const ex = a[0] + u * bx + v * dx + u * v * cx - p[0];
          const ey = a[1] + u * by + v * dy + u * v * cy - p[1];
          const ux = bx + v * cx;
          const uy = by + v * cy;
          const vx = dx + u * cx;
          const vy = dy + u * cy;
          const determinant = ux * vy - uy * vx;
          if (Math.abs(determinant) > 1e-12) {
            u -= (ex * vy - ey * vx) / determinant;
            v -= (ux * ey - uy * ex) / determinant;
          }
        }
        return [2, Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v))];
      }
      return [0, (p[0] - x0) / w, (p[1] - y0) / h];
    };
    const push = (p, n) => {
      uv.push((p[0] - x0) / w, (p[1] - y0) / h);
      position.push(...p);
      normal.push(...n);
      if (washBoundary) {
        boundaries.push(boundaryAt(p));
        paintCoordinates.push(...shapeCoordinates(p));
      }
      if (colors) color.push(...rgb);
      if (grain) grains.push(...run);
    };
    if (poly.length < 3 || z1 - z0 <= 0) return;
    const ring = THREE.ShapeUtils.isClockWise(
      poly.map(([x, y]) => new THREE.Vector2(x, y))
    )
      ? [...poly].reverse()
      : poly;
    const contour = ring.map(([x, y]) => new THREE.Vector2(x, y));
    const tris = THREE.ShapeUtils.triangulateShape(contour, []);
    const face = (points) => {
      points.forEach(([x, y]) => push([x, y, z1], [0, 0, 1]));
      [...points].reverse().forEach(([x, y]) => push([x, y, z0], [0, 0, -1]));
    };
    if (washBoundary && convex) {
      const center = [0, 1].map(
        (axis) =>
          ring.reduce((sum, point) => sum + point[axis], 0) / ring.length
      );
      ring.forEach((point, i) =>
        face([center, point, ring[(i + 1) % ring.length]])
      );
    } else {
      tris.forEach((triangle) => {
        const points = triangle.map((i) => ring[i]);
        if (!washBoundary) {
          face(points);
          return;
        }
        const center = [0, 1].map(
          (axis) => points.reduce((sum, point) => sum + point[axis], 0) / 3
        );
        const border = points.flatMap((point, i) => [
          point,
          [0, 1].map((axis) => (point[axis] + points[(i + 1) % 3][axis]) / 2),
        ]);
        border.forEach((point, i) =>
          face([center, point, border[(i + 1) % border.length]])
        );
      });
    }
    ring.forEach((a, i) => {
      const b = ring[(i + 1) % ring.length];
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const l = Math.hypot(dx, dy) || 1;
      const n = [dy / l, -dx / l, 0];
      const quad = [
        [a[0], a[1], z0],
        [b[0], b[1], z0],
        [b[0], b[1], z1],
        [a[0], a[1], z0],
        [b[0], b[1], z1],
        [a[0], a[1], z1],
      ];
      quad.forEach((p) => push(p, n));
    });
  }

  function build() {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(position, 3)
    );
    geometry.setAttribute(
      'normal',
      new THREE.Float32BufferAttribute(normal, 3)
    );
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    if (washBoundary)
      geometry.setAttribute(
        'paintCoordinates',
        new THREE.Float32BufferAttribute(paintCoordinates, 3)
      );
    if (washBoundary)
      geometry.setAttribute(
        'paintBoundary',
        new THREE.Float32BufferAttribute(boundaries, 1)
      );
    if (colors)
      geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(color, 3)
      );
    if (grain) {
      geometry.setAttribute(
        'grain',
        new THREE.Float32BufferAttribute(grains, 3)
      );
    }
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
  }

  return {
    add,
    build,
    empty: () => position.length === 0,
    vertexCount: () => position.length / 3,
  };
}

export const hexToLinear = (hex) => {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
};
