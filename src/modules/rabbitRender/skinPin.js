import * as THREE from 'three/webgpu';

const corners = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
const tangent = new THREE.Vector3();
const normal = new THREE.Vector3();
const bitangent = new THREE.Vector3();
const edge = new THREE.Vector3();

function skinnedCorners(mesh, pin) {
  pin.indices.forEach((index, i) => {
    mesh.getVertexPosition(index, corners[i]).applyMatrix4(mesh.matrixWorld);
  });
}

function triangleFrame() {
  const [a, b, c] = corners;
  tangent.subVectors(b, a).normalize();
  normal.crossVectors(tangent, edge.subVectors(c, a)).normalize();
  bitangent.crossVectors(normal, tangent);
}

// A point and a direction stuck to one skinned triangle: barycentric for the
// point, the triangle's own tangent frame for the direction. Read back on any
// later pose, both ride the skin exactly as it deforms.
export function pinToSkin(mesh, hit, direction) {
  const pin = {
    bary: new THREE.Vector3(),
    indices: [hit.face.a, hit.face.b, hit.face.c],
    local: new THREE.Vector3(),
  };
  skinnedCorners(mesh, pin);
  THREE.Triangle.getBarycoord(hit.point, ...corners, pin.bary);
  triangleFrame();
  pin.local.set(
    direction.dot(tangent),
    direction.dot(normal),
    direction.dot(bitangent)
  );
  return pin;
}

export function readSkinPin(mesh, pin, position, direction) {
  skinnedCorners(mesh, pin);
  const [a, b, c] = corners;
  position
    .copy(a)
    .multiplyScalar(pin.bary.x)
    .addScaledVector(b, pin.bary.y)
    .addScaledVector(c, pin.bary.z);
  triangleFrame();
  direction
    .copy(tangent)
    .multiplyScalar(pin.local.x)
    .addScaledVector(normal, pin.local.y)
    .addScaledVector(bitangent, pin.local.z)
    .normalize();
}

// The pin in the geometry's own rest space — where a stain painted on the
// skin has to live so it deforms with it.
export function restPosition(mesh, pin, target) {
  const rest = mesh.geometry.attributes.position;
  target.set(0, 0, 0);
  pin.indices.forEach((index, i) => {
    target.addScaledVector(
      edge.fromBufferAttribute(rest, index),
      pin.bary.getComponent(i)
    );
  });
  return target;
}
