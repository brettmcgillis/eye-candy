import * as THREE from 'three/webgpu';

import { CUT_ROLES, weatherRecord } from '@modules/brutalist';

const CYLINDER_SEGMENTS = 48;
const matrix = new THREE.Matrix4();
const euler = new THREE.Euler();
const quaternion = new THREE.Quaternion();
const position = new THREE.Vector3();
const ONE = new THREE.Vector3(1, 1, 1);

// Cut faces carry a role code past the part roles, so the shader can tell a
// reveal from a wall and a window's back (its glass) from its reveal.
export const CUT_CODE_BASE = 16;
export const cutCode = (role, back) =>
  CUT_CODE_BASE + Math.max(0, CUT_ROLES.indexOf(role)) * 2 + (back ? 1 : 0);

function localGeometry(solid) {
  if (solid.kind === 'prism') {
    const shape = new THREE.Shape(
      solid.profile.map(([x, y]) => new THREE.Vector2(x, y))
    );
    const depth = solid.half[2] * 2;
    const geometry = new THREE.ExtrudeGeometry(shape, {
      bevelEnabled: false,
      depth,
    });
    geometry.translate(0, 0, -depth / 2);
    return geometry.index ? geometry.toNonIndexed() : geometry;
  }
  if (solid.kind === 'cylinder') {
    return new THREE.CylinderGeometry(
      solid.half[0],
      solid.half[0],
      solid.half[1] * 2,
      CYLINDER_SEGMENTS
    ).toNonIndexed();
  }
  const [hx, hy, hz] = solid.half;
  return new THREE.BoxGeometry(hx * 2, hy * 2, hz * 2).toNonIndexed();
}

// One solid as a non-indexed world-space geometry with position, normal and
// the per-vertex weathering record. `back` tags the faces whose local normal
// points along [axis, sign] with the cutter's back code.
export function solidGeometry(solid, { code = null, record = null } = {}) {
  const geometry = localGeometry(solid);
  geometry.deleteAttribute('uv');
  const [top, bottom, seed, role] = record ?? weatherRecord(solid);
  const normals = geometry.getAttribute('normal');
  const { count } = normals;
  const weather = new Float32Array(count * 4);
  for (let i = 0; i < count; i += 1) {
    let tag = code ?? role;
    if (code != null && solid.back) {
      const [axis, sign] = solid.back;
      const n = [normals.getX(i), normals.getY(i), normals.getZ(i)];
      if (n[axis] * sign > 0.9) tag = code + 1;
    }
    weather.set([top, bottom, seed, tag], i * 4);
  }
  geometry.setAttribute('aWeather', new THREE.BufferAttribute(weather, 4));

  euler.set(solid.pitch ?? 0, solid.yaw ?? 0, solid.tilt ?? 0, 'YZX');
  quaternion.setFromEuler(euler);
  position.set(...solid.center);
  matrix.compose(position, quaternion, ONE);
  geometry.applyMatrix4(matrix);
  return geometry;
}
