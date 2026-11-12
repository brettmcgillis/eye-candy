import { BufferAttribute, BufferGeometry, Vector3 } from 'three';

export function createRibbonGeometry(paths) {
  const pieces = [];
  paths.forEach((path) => {
    for (let i = 1; i < path.length; i += 1)
      pieces.push([
        path[i - 1],
        path[i],
        (i - 1) / (path.length - 1),
        i / (path.length - 1),
        path.width || 1,
      ]);
  });
  const geometry = new BufferGeometry();
  const positions = new Float32Array(pieces.length * 18);
  const uvs = new Float32Array(pieces.length * 12);
  const references = new Float32Array(pieces.length * 6);
  const widths = new Float32Array(pieces.length);
  pieces.forEach(([a, b, u, v, width], index) => {
    references.set([...a, ...b], index * 6);
    widths[index] = width;
    uvs.set([u, 0, u, 1, v, 0, u, 1, v, 1, v, 0], index * 12);
  });
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new BufferAttribute(uvs, 2));
  geometry.userData.references = references;
  geometry.userData.widths = widths;
  return geometry;
}

const a = new Vector3();
const b = new Vector3();
const tangent = new Vector3();
const view = new Vector3();
const side = new Vector3();

export function updateRibbons(geometry, camera, width, faceCamera, growth) {
  const { references } = geometry.userData;
  const positions = geometry.attributes.position;
  for (let i = 0; i < references.length / 6; i += 1) {
    a.fromArray(references, i * 6);
    b.fromArray(references, i * 6 + 3);
    tangent.subVectors(b, a);
    if (faceCamera) view.subVectors(camera.position, a);
    else view.set(0, 0, 1);
    side
      .crossVectors(tangent, view)
      .normalize()
      .multiplyScalar((width * geometry.userData.widths[i]) / 2);
    if (i / (references.length / 6) > growth) b.copy(a);
    const offset = i * 6;
    positions.setXYZ(offset, a.x - side.x, a.y - side.y, a.z - side.z);
    positions.setXYZ(offset + 1, a.x + side.x, a.y + side.y, a.z + side.z);
    positions.setXYZ(offset + 2, b.x - side.x, b.y - side.y, b.z - side.z);
    positions.setXYZ(offset + 3, a.x + side.x, a.y + side.y, a.z + side.z);
    positions.setXYZ(offset + 4, b.x + side.x, b.y + side.y, b.z + side.z);
    positions.setXYZ(offset + 5, b.x - side.x, b.y - side.y, b.z - side.z);
  }
  positions.needsUpdate = true;
}
