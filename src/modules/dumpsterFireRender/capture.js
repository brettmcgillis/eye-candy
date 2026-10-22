import * as THREE from 'three/webgpu';

import { SCENE_CAMERA_DISTANCE, flameVertex } from '@modules/dumpsterFire';

const vertex = new THREE.Vector3();
const normal = new THREE.Vector3();
const instance = new THREE.Matrix4();
const placed = new THREE.Matrix4();

// One mesh's vertices through `matrix` (skinned on the CPU exactly as the
// GPU skins them), beside the rest positions that weld its seams.
function meshEntry(mesh, matrix, displace = null) {
  const { index, attributes } = mesh.geometry;
  const { position } = attributes;
  const world = new Float32Array(position.count * 3);
  const rest = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i += 1) {
    vertex.fromBufferAttribute(position, i);
    rest[i * 3] = vertex.x;
    rest[i * 3 + 1] = vertex.y;
    rest[i * 3 + 2] = vertex.z;
    if (displace) {
      normal.fromBufferAttribute(attributes.normal, i);
      vertex.fromArray(displace(vertex.toArray(), normal.toArray()));
    } else if (mesh.isSkinnedMesh) {
      mesh.getVertexPosition(i, vertex);
    }
    vertex.applyMatrix4(matrix);
    world[i * 3] = vertex.x;
    world[i * 3 + 1] = vertex.y;
    world[i * 3 + 2] = vertex.z;
  }
  return {
    index: index ? Uint32Array.from(index.array) : null,
    position: world,
    rest,
  };
}

const inverseOf = (matrix) => Array.from(matrix.clone().invert().elements);

const plotted = (object) =>
  object.isMesh &&
  object.visible &&
  object.geometry?.attributes?.position &&
  object.userData.plot !== false;

// Every mesh under `root` in world space, an instanced mesh as one entry
// per instance.
function entriesUnder(root) {
  const entries = [];
  root.traverseVisible((object) => {
    if (!plotted(object)) return;
    if (object.isInstancedMesh) {
      for (let i = 0; i < object.count; i += 1) {
        object.getMatrixAt(i, instance);
        placed.multiplyMatrices(object.matrixWorld, instance);
        entries.push(meshEntry(object, placed));
      }
    } else {
      entries.push(meshEntry(object, object.matrixWorld));
    }
  });
  return entries;
}

// The solid pieces as the plot reads them: one object per
// `userData.plotObject` (a wall block each), with the world → object
// matrix its section cuts run in. The sidewalk only when asked.
export function readSolids(root, { sidewalk = false } = {}) {
  root.updateWorldMatrix(true, true);
  const objects = [];
  const visit = (node) => {
    if (!node.visible) return;
    const tag = node.userData;
    if (tag?.plotObject) {
      if (tag.plotSidewalk && !sidewalk) return;
      if (tag.plotPerInstance && node.isInstancedMesh) {
        for (let i = 0; i < node.count; i += 1) {
          node.getMatrixAt(i, instance);
          placed.multiplyMatrices(node.matrixWorld, instance);
          objects.push({
            creases: true,
            inverse: inverseOf(placed),
            meshes: [meshEntry(node, placed)],
          });
        }
        return;
      }
      objects.push({
        creases: !tag.plotSidewalk || sidewalk,
        inverse: inverseOf(node.matrixWorld),
        sections: !tag.plotSidewalk,
        meshes: entriesUnder(node),
      });
      return;
    }
    node.children.forEach(visit);
  };
  visit(root);
  return objects.filter((object) => object.meshes.length);
}

// The solid meshes for the depth pass (the sidewalk only when it is
// plotted, so it neither hides the street nor joins the silhouette).
export function solidMeshes(root, { sidewalk = false } = {}) {
  const found = [];
  root.traverse((object) => {
    if (!object.isMesh) return;
    let node = object;
    while (node && node !== root) {
      if (node.userData?.plotSidewalk && !sidewalk) return;
      node = node.parent;
    }
    found.push(object);
  });
  return found;
}

const effectOf = (object) => {
  let node = object;
  while (node) {
    if (node.userData?.effect) return node.userData.effect;
    node = node.parent;
  }
  return null;
};

// The fire and plume blobs as the plot reads them: each flame's icosphere
// displaced on the CPU by @modules/dumpsterFire's mirror of its shader
// noise, at the uniforms it was drawn with.
export function readFlames(root) {
  root.updateWorldMatrix(true, true);
  const objects = [];
  root.traverseVisible((object) => {
    const uniforms = object.material?.uniforms;
    if (!object.isMesh || object.isInstancedMesh || !uniforms?.baseRadius) {
      return;
    }
    if (uniforms.opacity.value < 0.05) return;
    const shape = {
      baseRadius: uniforms.baseRadius.value,
      detail: uniforms.detail.value,
      seed: uniforms.seed.value,
      time: uniforms.time.value,
    };
    objects.push({
      effect: effectOf(object),
      inverse: inverseOf(object.matrixWorld),
      meshes: [
        meshEntry(object, object.matrixWorld, (p, n) =>
          flameVertex(p, n, shape)
        ),
      ],
    });
  });
  return objects;
}

// Every live smoke and ember particle as [x, y, z, alpha] in world space.
export function readSmokeDots(root) {
  root.updateWorldMatrix(true, true);
  const dots = [];
  root.traverseVisible((object) => {
    const attributes = object.geometry?.attributes;
    if (!object.isInstancedMesh || !attributes?.aPosition) return;
    const { aAge, aAlpha, aPosition, aSize } = attributes;
    for (let i = 0; i < object.count; i += 1) {
      let alpha = 1;
      if (aAlpha) alpha *= aAlpha.getX(i);
      if (aAge) alpha *= Math.max(0, 1 - aAge.getX(i));
      if (aSize && aSize.getX(i) <= 0) alpha = 0;
      if (alpha > 0.01) {
        vertex
          .fromBufferAttribute(aPosition, i)
          .applyMatrix4(object.matrixWorld);
        dots.push([vertex.x, vertex.y, vertex.z, Math.min(1, alpha)]);
      }
    }
  });
  return dots;
}

// Shows or hides the smoke (plume and particles), leaving the fire.
/* eslint-disable no-param-reassign */
export function showSmoke(root, visible) {
  root.traverse((object) => {
    const effect = object.userData?.effect;
    if (effect === 'plume' || effect === 'particles') object.visible = visible;
  });
}
/* eslint-enable no-param-reassign */

const trimmed = (points, low, high) => {
  if (points.length < 20) return points;
  const bounds = [0, 1, 2].map((k) => {
    const sorted = points.map((p) => p[k]).sort((a, b) => a - b);
    return [
      sorted[Math.floor(sorted.length * low)],
      sorted[Math.floor(sorted.length * high) - 1],
    ];
  });
  return points.filter((p) =>
    bounds.every(([lo, hi], k) => p[k] >= lo && p[k] <= hi)
  );
};

// Where the fire and smoke actually are once they have burned a while — the
// live particles and flame blobs, the stray few percent trimmed — for
// fitting a camera to what shows rather than to the whole spline.
export function measureSmoke(root) {
  const dots = readSmokeDots(root)
    .filter(([, , , alpha]) => alpha > 0.15)
    .map(([x, y, z]) => [x, y, z]);
  const blobs = [];
  root.updateWorldMatrix(true, true);
  root.traverseVisible((object) => {
    const uniforms = object.material?.uniforms;
    if (!object.isMesh || object.isInstancedMesh || !uniforms?.baseRadius) {
      return;
    }
    if (uniforms.opacity.value < 0.2) return;
    object.getWorldPosition(vertex);
    const r = object.getWorldScale(normal).x * uniforms.baseRadius.value;
    blobs.push(
      [vertex.x - r, vertex.y - r, vertex.z - r],
      [vertex.x + r, vertex.y + r, vertex.z + r]
    );
  });
  return [...trimmed(dots, 0.02, 0.98), ...trimmed(blobs, 0.01, 0.99)];
}

// The scene's fog range is tuned for its establishing camera; a camera
// `distance` from its target pushes it back by the difference.
export function fitFog({ fog }, config, distance) {
  if (!fog) return;
  const push = Math.max(0, distance - SCENE_CAMERA_DISTANCE);
  Object.assign(fog, {
    far: Math.max(config.sceneFogNear, config.sceneFogFar) + push,
    near: Math.min(config.sceneFogNear, config.sceneFogFar) + push,
  });
}
