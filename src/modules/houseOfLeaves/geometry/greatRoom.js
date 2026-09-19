import { mergeAir } from './air';
import { createSideWall, createSlab, createWall, toGeometry } from './frame';

export const GREAT_ROOM_DEFAULTS = {
  width: 620,
  depth: 620,
  height: 155,
  hole: { x: 0, z: 0, radius: 36, segments: 192 },
  doorway: { width: 5, height: 8, z: 0 },
};

// Where the corridor ends and the descent begins. A box seen from inside,
// its floor pierced by the mouth of the stairwell — the hole's polygon is the
// shaft wall's own top ring, same centre, same radius, same angular samples,
// so the two meet vertex for vertex. The corridor arrives through a frame in
// the -X wall cut to its own section.
export default function createGreatRoom(options = {}) {
  const o = { ...GREAT_ROOM_DEFAULTS, ...options };
  const hole = { ...GREAT_ROOM_DEFAULTS.hole, ...o.hole };
  const hw = o.width * 0.5;
  const hd = o.depth * 0.5;
  const out = { positions: [], normals: [] };

  // Floor: a ring between the circular hole and the rectangle, with the
  // rectangle's corners inserted so nothing is shaved off them.
  const segments = Math.max(12, Math.round(hole.segments));
  const holePoint = (i) => {
    const angle = ((i % segments) / segments) * Math.PI * 2;
    return [
      hole.x + Math.cos(angle) * hole.radius,
      0,
      hole.z + Math.sin(angle) * hole.radius,
    ];
  };
  // Distance along a direction from the hole centre to the rectangle's edge,
  // and which edge is hit.
  const reach = (d, centre, half) => {
    if (d > 1e-9) return (half - centre) / d;
    if (d < -1e-9) return (-half - centre) / d;
    return Infinity;
  };
  const rimHit = (i) => {
    const angle = ((i % segments) / segments) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);
    const tx = reach(dx, hole.x, hd);
    const tz = reach(dz, hole.z, hw);
    const t = Math.min(tx, tz);
    let edge;
    if (tx < tz) edge = dx > 0 ? 'x+' : 'x-';
    else edge = dz > 0 ? 'z+' : 'z-';
    return { point: [hole.x + dx * t, 0, hole.z + dz * t], edge };
  };
  const corners = {
    'x+|z+': [hd, 0, hw],
    'z+|x-': [-hd, 0, hw],
    'x-|z-': [-hd, 0, -hw],
    'z-|x+': [hd, 0, -hw],
  };
  const up = [0, 1, 0];
  const triUp = (a, b, c) => {
    const ux = b[0] - a[0];
    const uz = b[2] - a[2];
    const vx = c[0] - a[0];
    const vz = c[2] - a[2];
    const ny = uz * vx - ux * vz;
    const [p, q, r] = ny < 0 ? [a, c, b] : [a, b, c];
    out.positions.push(...p, ...q, ...r);
    out.normals.push(...up, ...up, ...up);
  };
  for (let i = 0; i < segments; i += 1) {
    const a = holePoint(i);
    const b = holePoint(i + 1);
    const ra = rimHit(i);
    const rb = rimHit(i + 1);
    const corner =
      ra.edge !== rb.edge ? corners[`${ra.edge}|${rb.edge}`] : null;
    triUp(a, b, rb.point);
    if (corner) {
      triUp(a, rb.point, corner);
      triUp(a, corner, ra.point);
    } else {
      triUp(a, rb.point, ra.point);
    }
  }
  const floor = toGeometry(out);

  const pieces = [
    floor,
    createSlab({ x0: -hd, x1: hd, y: o.height, z0: -hw, z1: hw, facing: -1 }),
    createSideWall({ z: -hw, x0: -hd, x1: hd, height: o.height, facing: 1 }),
    createSideWall({ z: hw, x0: -hd, x1: hd, height: o.height, facing: -1 }),
    createWall({ x: hd, width: o.width, height: o.height, facing: -1 }),
    createWall({
      x: -hd,
      width: o.width,
      height: o.height,
      opening: o.doorway,
      facing: 1,
    }),
  ];
  return mergeAir(pieces);
}
