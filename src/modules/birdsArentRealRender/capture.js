import * as THREE from 'three/webgpu';

const vertex = new THREE.Vector3();

// The posed flock as the plot reads it: per bird the world → bird-frame
// matrix, per mesh its vertices in world space (skinned on the CPU exactly
// as the GPU skins them) beside the rest positions that weld its seams.
export function readFlockMesh(flock) {
  flock.updateWorldMatrix(true, true);
  const birds = [];
  const meshes = [];
  flock.children.forEach((root, bird) => {
    birds.push({
      inverse: Array.from(root.matrixWorld.clone().invert().elements),
    });
    root.traverseVisible((object) => {
      const position = object.geometry?.attributes?.position;
      if (!object.isMesh || !position || object.userData.plot === false) {
        return;
      }
      const world = new Float32Array(position.count * 3);
      const rest = new Float32Array(position.count * 3);
      for (let i = 0; i < position.count; i += 1) {
        vertex.fromBufferAttribute(position, i);
        rest[i * 3] = vertex.x;
        rest[i * 3 + 1] = vertex.y;
        rest[i * 3 + 2] = vertex.z;
        if (object.isSkinnedMesh) object.getVertexPosition(i, vertex);
        vertex.applyMatrix4(object.matrixWorld);
        world[i * 3] = vertex.x;
        world[i * 3 + 1] = vertex.y;
        world[i * 3 + 2] = vertex.z;
      }
      const { index } = object.geometry;
      meshes.push({
        bird,
        index: index ? Uint32Array.from(index.array) : null,
        position: world,
        rest,
      });
    });
  });
  return { birds, meshes };
}

// Every mesh of the flock, for a depth pass that leaves the floor out.
export function flockMeshes(flock) {
  const found = [];
  flock.traverseVisible((object) => {
    if (object.isMesh) found.push(object);
  });
  return found;
}
