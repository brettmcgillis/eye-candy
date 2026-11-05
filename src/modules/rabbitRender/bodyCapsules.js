import * as THREE from 'three/webgpu';

const MIN_VERTICES = 12;
const RADIUS_QUANTILE = 0.75;

const vertex = new THREE.Vector3();
const start = new THREE.Vector3();
const end = new THREE.Vector3();
const axis = new THREE.Vector3();

export function distanceToSegment(point, a, b) {
  axis.subVectors(b, a);
  const t = THREE.MathUtils.clamp(
    vertex.subVectors(point, a).dot(axis) / Math.max(axis.lengthSq(), 1e-10),
    0,
    1
  );
  return vertex.copy(a).addScaledVector(axis, t).distanceTo(point);
}

function dominantBone(skinIndex, skinWeight, i) {
  let best = 0;
  for (let k = 1; k < 4; k += 1) {
    if (skinWeight.getComponent(i, k) > skinWeight.getComponent(i, best)) {
      best = k;
    }
  }
  return skinIndex.getComponent(i, best);
}

// One capsule per bone, from the bone through the middle of the skin it
// carries and as thick as that skin: a collision body that follows the clip.
// `tip` is stored in the bone's own space so it rides the bone.
export function fitBodyCapsules(mesh) {
  const { bones } = mesh.skeleton;
  const { position, skinIndex, skinWeight } = mesh.geometry.attributes;
  const owned = bones.map(() => []);
  for (let i = 0; i < position.count; i += 1) {
    mesh.getVertexPosition(i, vertex).applyMatrix4(mesh.matrixWorld);
    owned[dominantBone(skinIndex, skinWeight, i)].push(vertex.clone());
  }

  return bones.flatMap((bone, i) => {
    const points = owned[i];
    if (points.length < MIN_VERTICES) return [];
    bone.getWorldPosition(start);
    end.set(0, 0, 0);
    points.forEach((point) => end.add(point));
    end.divideScalar(points.length).sub(start).multiplyScalar(2).add(start);
    const reach = points
      .map((point) => distanceToSegment(point, start, end))
      .sort((a, b) => a - b);
    return [
      {
        bone: bone.name,
        radius: reach[Math.floor(reach.length * RADIUS_QUANTILE)],
        tip: bone.worldToLocal(end.clone()),
      },
    ];
  });
}
