import { Matrix4, Quaternion, Vector3 } from 'three';

const FINGERS = ['f_index', 'f_middle', 'f_ring', 'f_pinky'];
const CURL = [70, 80, 55];
const THUMB_CURL = [10, 30, 25];
const DEG = Math.PI / 180;

const at = (bones, key) => bones[key].getWorldPosition(new Vector3());

function handFrame(bones, s) {
  const index = at(bones, `f_index01${s}`);
  const pinky = at(bones, `f_pinky01${s}`);
  const across = index.clone().sub(pinky).normalize();
  const fingers = at(bones, `f_middle01${s}`)
    .sub(at(bones, `hand${s}`))
    .normalize();
  const knuckles = index.clone().add(pinky).multiplyScalar(0.5);
  const palm = new Vector3().crossVectors(fingers, across).normalize();
  if (at(bones, `thumb03${s}`).sub(knuckles).dot(palm) < 0) palm.negate();
  return { across, fingers, knuckles, palm };
}

function rotateBoneInWorld(bone, axis, angle) {
  const worldQ = bone.getWorldQuaternion(new Quaternion());
  const parentQ = bone.parent.getWorldQuaternion(new Quaternion());
  const turned = new Quaternion()
    .setFromAxisAngle(axis, angle)
    .multiply(worldQ);
  bone.quaternion.copy(parentQ.invert().multiply(turned));
  bone.updateMatrixWorld(true);
}

export function curlFist(bones, s, amount = 1) {
  const { across, fingers, palm } = handFrame(bones, s);
  const sign =
    new Vector3().crossVectors(across, fingers).dot(palm) > 0 ? 1 : -1;
  FINGERS.forEach((finger) =>
    CURL.forEach((deg, i) =>
      rotateBoneInWorld(
        bones[`${finger}0${i + 1}${s}`],
        across,
        sign * deg * DEG * amount
      )
    )
  );
  THUMB_CURL.forEach((deg, i) =>
    rotateBoneInWorld(
      bones[`thumb0${i + 1}${s}`],
      fingers,
      sign * deg * DEG * amount
    )
  );
}

// World frame of a sword held in the fist at rest: blade out past the index
// finger, edges along the (uncurled) finger direction, guard just above it.
export function gripMatrix(bones, s, { palmOffset, guardOffset }) {
  const { across, fingers, knuckles, palm } = handFrame(bones, s);
  const edge = fingers
    .clone()
    .sub(across.clone().multiplyScalar(fingers.dot(across)))
    .normalize();
  const flat = new Vector3().crossVectors(edge, across);
  const origin = knuckles
    .addScaledVector(palm, palmOffset)
    .addScaledVector(across, guardOffset);
  return new Matrix4().makeBasis(edge, across, flat).setPosition(origin);
}
