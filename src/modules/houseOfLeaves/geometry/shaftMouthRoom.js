import * as THREE from 'three/webgpu';

import { orientInward } from './geometryUtils';

export const SHAFT_MOUTH_DEFAULTS = {
  width: 70,
  depth: 70,
  height: 30,
  holeRadius: 24,
  holeSegments: 72,
  doorway: null,
  doorwaySide: -1,
};

// Where the corridor ends and the descent begins: a room whose floor is pierced
// by the circular mouth of the stairwell. Walls are flat rectangles so one of
// them can carry a real doorway; the floor is a ring between the rectangular
// edge and the circle, so the opening is a true circle.
export default function createShaftMouthRoom(options = {}) {
  const o = { ...SHAFT_MOUTH_DEFAULTS, ...options };
  const hw = o.width * 0.5;
  const hd = o.depth * 0.5;
  const segments = Math.max(12, Math.round(o.holeSegments));
  const positions = [];
  const indices = [];
  const push = (x, y, z) => {
    positions.push(x, y, z);
    return positions.length / 3 - 1;
  };
  const quad = (a, b, c, d) => indices.push(a, b, c, a, c, d);

  const hole = [];
  const rim = [];
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);
    hole.push(push(dx * o.holeRadius, 0, dz * o.holeRadius));
    const scale = Math.min(
      Math.abs(hw / (dx || 1e-6)),
      Math.abs(hd / (dz || 1e-6))
    );
    rim.push(push(dx * scale, 0, dz * scale));
  }
  for (let i = 0; i < segments; i += 1) {
    const j = (i + 1) % segments;
    quad(hole[i], rim[i], rim[j], hole[j]);
  }

  const corners = [
    [-hw, -hd],
    [hw, -hd],
    [hw, hd],
    [-hw, hd],
  ];
  const ceil = corners.map(([x, z]) => push(x, o.height, z));
  quad(ceil[0], ceil[3], ceil[2], ceil[1]);

  // Walls, one of which may carry an arched doorway.
  corners.forEach(([x0, z0], i) => {
    const [x1, z1] = corners[(i + 1) % 4];
    const isDoorWall =
      o.doorway &&
      ((o.doorwaySide < 0 && i === 3) || (o.doorwaySide > 0 && i === 1));
    // The door wall is omitted: the caller fills it with a wall that has real
    // thickness and a lined opening, so there is exactly one implementation of
    // "wall with a hole in it" rather than a flat plane pretending to be one.
    if (isDoorWall) return;
    const a = push(x0, 0, z0);
    const b = push(x1, 0, z1);
    const c = push(x1, o.height, z1);
    const d = push(x0, o.height, z0);
    quad(a, b, c, d);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setIndex(indices);
  return orientInward(geometry, new THREE.Vector3(0, o.height * 0.4, 0));
}
