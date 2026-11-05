import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three/webgpu';

const RADIAL = 7;

function tube(cable) {
  const points = [];
  for (let i = 0; i < cable.points.length; i += 3)
    points.push(
      new THREE.Vector3(
        cable.points[i],
        cable.points[i + 1],
        cable.points[i + 2]
      )
    );
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const geometry = new THREE.TubeGeometry(
    curve,
    points.length * 3,
    cable.radius,
    RADIAL,
    false
  );
  const color = new THREE.Color(cable.color);
  const { count } = geometry.attributes.position;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) color.toArray(colors, i * 3);
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.deleteAttribute('uv');
  return geometry;
}

export default function buildCableGeometry(cables) {
  const parts = cables.map(tube);
  const merged = mergeGeometries(parts, false);
  parts.forEach((part) => part.dispose());
  return merged;
}
