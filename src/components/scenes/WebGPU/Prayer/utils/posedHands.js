import {
  Box3,
  Euler,
  Matrix4,
  PropertyBinding,
  Quaternion,
  Vector3,
} from 'three';

const FINGERS = ['index', 'middle', 'ring', 'pinky'];
const JOINTS = [1, 2, 3];

export const TARGET_MAX_DIMENSION = 1.4;

export function applyPose(root, clip) {
  if (!clip) return;
  clip.tracks.forEach((track) => {
    const { nodeName, propertyName } = PropertyBinding.parseTrackName(
      track.name
    );
    const node = root.getObjectByName(nodeName);
    if (node?.[propertyName]?.fromArray) {
      node[propertyName].fromArray(track.values, 0);
    }
  });
}

function segmentKey(boneName) {
  const finger = boneName.match(/f_(index|middle|ring|pinky)0(\d)/);
  if (finger) return `f_${finger[1]}0${finger[2]}`;
  if (/DEF-hand|DEF-thumb/.test(boneName)) return 'palm';
  return 'arm';
}

function findBone(bones, pattern) {
  return bones.find((bone) => pattern.test(bone.name));
}

function sampleHand(mesh, stride) {
  const { bones } = mesh.skeleton;
  const boneKeys = bones.map((bone) => segmentKey(bone.name));
  const position = mesh.geometry.getAttribute('position');
  const skinIndex = mesh.geometry.getAttribute('skinIndex');
  const skinWeight = mesh.geometry.getAttribute('skinWeight');
  const buckets = {};
  const v = new Vector3();

  for (let i = 0; i < position.count; i += stride) {
    let key = 'arm';
    let heaviest = -1;
    for (let k = 0; k < 4; k += 1) {
      const weight = skinWeight.getComponent(i, k);
      if (weight > heaviest) {
        heaviest = weight;
        key = boneKeys[skinIndex.getComponent(i, k)];
      }
    }
    mesh.getVertexPosition(i, v).applyMatrix4(mesh.matrixWorld);
    (buckets[key] ||= []).push(v.x, v.y, v.z);
  }

  let root = bones[0];
  while (root.parent?.isBone) root = root.parent;
  const handBone = findBone(bones, /DEF-hand/);
  const worldOf = (bone) => bone.getWorldPosition(new Vector3());

  const fingers = FINGERS.map((finger) => {
    const chain = JOINTS.map((n) =>
      findBone(bones, new RegExp(`f_${finger}0${n}`))
    );
    const joints = chain.map(worldOf);
    return {
      keys: JOINTS.map((n) => `f_${finger}0${n}`),
      bones: chain,
      joints,
      tip: joints[2].clone().add(joints[2].clone().sub(joints[1])),
      segments: JOINTS.map(
        (n) => new Float32Array(buckets[`f_${finger}0${n}`] || [])
      ),
    };
  });

  return {
    wrapper: root.parent,
    wrapperBase: root.parent.matrix.clone(),
    wrist: worldOf(handBone),
    arm: new Float32Array(buckets.arm || []),
    palm: new Float32Array(buckets.palm || []),
    fingers,
    targets: [
      { key: 'palm', bone: handBone },
      ...fingers.flatMap((finger) =>
        finger.bones.map((bone, i) => ({ key: finger.keys[i], bone }))
      ),
    ].map((target) => ({
      ...target,
      world: target.bone.matrixWorld.clone(),
    })),
  };
}

export function samplePosedHands(root, stride = 3) {
  root.updateMatrixWorld(true);
  const hands = [];
  root.traverse((node) => {
    if (node.isSkinnedMesh && node.skeleton) {
      hands.push(sampleHand(node, stride));
    }
  });

  const box = new Box3();
  const v = new Vector3();
  hands.forEach((hand) => {
    [hand.arm, hand.palm, ...hand.fingers.flatMap((f) => f.segments)].forEach(
      (samples) => {
        for (let i = 0; i < samples.length; i += 3) {
          box.expandByPoint(v.fromArray(samples, i));
        }
      }
    );
  });

  if (box.isEmpty()) return { hands, modelScale: 1, center: new Vector3() };
  const size = box.getSize(new Vector3());
  return {
    hands,
    modelScale: TARGET_MAX_DIMENSION / Math.max(size.x, size.y, size.z, 1e-6),
    center: box.getCenter(new Vector3()),
  };
}

export function shellMatrix({ position, rotation, scale }, posed) {
  return new Matrix4()
    .compose(
      new Vector3(...position),
      new Quaternion().setFromEuler(new Euler(...rotation)),
      new Vector3().setScalar(scale * posed.modelScale)
    )
    .multiply(
      new Matrix4().makeTranslation(
        -posed.center.x,
        -posed.center.y,
        -posed.center.z
      )
    );
}

function transformSamples(samples, matrix) {
  const out = new Float32Array(samples.length);
  const e = matrix.elements;
  for (let i = 0; i < samples.length; i += 3) {
    const x = samples[i];
    const y = samples[i + 1];
    const z = samples[i + 2];
    out[i] = e[0] * x + e[4] * y + e[8] * z + e[12];
    out[i + 1] = e[1] * x + e[5] * y + e[9] * z + e[13];
    out[i + 2] = e[2] * x + e[6] * y + e[10] * z + e[14];
  }
  return out;
}

export function handsInFrame(hands, matrix) {
  return hands.map((hand) => ({
    wrist: hand.wrist.clone().applyMatrix4(matrix),
    arm: transformSamples(hand.arm, matrix),
    palm: transformSamples(hand.palm, matrix),
    fingers: hand.fingers.map((finger) => ({
      keys: finger.keys,
      joints: finger.joints.map((j) => j.clone().applyMatrix4(matrix)),
      tip: finger.tip.clone().applyMatrix4(matrix),
      segments: finger.segments.map((s) => transformSamples(s, matrix)),
    })),
  }));
}

function matrixInRoot(node, root) {
  const m = new Matrix4();
  for (let n = node; n && n !== root; n = n.parent) {
    n.updateMatrix();
    m.premultiply(n.matrix);
  }
  return m;
}

export function applyCorrections(root, hands, frame, corrections) {
  const inverse = frame.clone().invert();
  const inShell = (m) => inverse.clone().multiply(m).multiply(frame);

  hands.forEach((hand, index) => {
    const correction = corrections?.[index];
    const wrapperMatrix = correction
      ? inShell(correction.arm).multiply(hand.wrapperBase)
      : hand.wrapperBase.clone();
    wrapperMatrix.decompose(
      hand.wrapper.position,
      hand.wrapper.quaternion,
      hand.wrapper.scale
    );

    hand.targets.forEach(({ key, bone, world }) => {
      const target = correction
        ? inShell(correction[key]).multiply(world)
        : world.clone();
      matrixInRoot(bone.parent, root)
        .invert()
        .multiply(target)
        .decompose(bone.position, bone.quaternion, bone.scale);
    });
  });

  root.updateMatrixWorld(true);
}
