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
export function createPrismBuilder({ colors = false, grain = false } = {}) {
  const position = [];
  const normal = [];
  const color = [];
  const grains = [];

  function add(poly, z0, z1, rgb = [1, 1, 1], run = GRAIN_UP) {
    const push = (p, n) => {
      position.push(...p);
      normal.push(...n);
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
    tris.forEach(([a, b, c]) => {
      [a, b, c].forEach((i) => push([ring[i][0], ring[i][1], z1], [0, 0, 1]));
      [c, b, a].forEach((i) => push([ring[i][0], ring[i][1], z0], [0, 0, -1]));
    });
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
