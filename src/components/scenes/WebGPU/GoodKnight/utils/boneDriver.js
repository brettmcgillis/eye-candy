import { Matrix4, Quaternion, Vector3 } from 'three';

const world = new Matrix4();
const parentInverse = new Matrix4();
const q = new Quaternion();
const p = new Vector3();
const unit = new Vector3(1, 1, 1);

export function bodyMatrix(body, target) {
  return target.compose(
    p.copy(body.translation()),
    q.copy(body.rotation()),
    unit
  );
}

// Segment bones follow their bodies; every other bone keeps its rest offset
// from its parent, so shoulders, fingers and plates ride along rigidly.
export function driveBones(rig, bones, bodies) {
  rig.segments.forEach((segment) => {
    const bone = bones[segment.bone];
    const body = bodies[segment.id];
    q.copy(body.rotation()).multiply(segment.restBoneQuaternion);
    world.compose(p.copy(body.translation()), q, segment.restBoneScale);
    parentInverse.copy(bone.parent.matrixWorld).invert();
    world.premultiply(parentInverse);
    world.decompose(bone.position, bone.quaternion, bone.scale);
    bone.updateMatrixWorld(true);
  });
}
