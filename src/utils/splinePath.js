import * as THREE from 'three';

// An authored spline (Vector3 control points, catmull-rom `tension`) as
// `samples` points equally spaced along its length, each [x, y, z] less
// `origin` — the polyline a fire guide or a smoke path reads.
export default function splinePath(
  points,
  { closed = false, origin = [0, 0, 0], samples = 48, tension = 0.5 } = {}
) {
  if (points.length < 2) return [];
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(p.x, p.y, p.z)),
    closed,
    'catmullrom',
    tension
  );
  return curve
    .getSpacedPoints(samples - 1)
    .map((p) => [p.x - origin[0], p.y - origin[1], p.z - origin[2]]);
}
