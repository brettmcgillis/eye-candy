import * as THREE from 'three';

import { BIRDS } from '@elements/FakeBird/birds';
import * as birdPresets from '@scenes/WebGPU/BirdsArentReal/presets/presets';

import headJson from './models/camera-head.json';
import pigeonJson from './models/pigeon.json';

export const META = BIRDS.pigeon;
export const SCENE = birdPresets.default[birdPresets.DEFAULT_PRESET];

let models = null;

// FakeBird renders the root bone and the skinned meshes straight under its
// own group, dropping the glTF parents above them; posing the same tree
// that way is what makes the print the bird on screen.
function loadModels() {
  if (models) return models;
  const loader = new THREE.ObjectLoader();
  const scene = loader.parse(pigeonJson);
  const root = new THREE.Group();
  let rootBone = null;
  const skinned = [];
  scene.traverse((object) => {
    if (object.isBone && !rootBone) {
      let bone = object;
      while (bone.parent?.isBone) bone = bone.parent;
      rootBone = bone;
    }
    if (object.isSkinnedMesh) skinned.push(object);
  });
  root.add(rootBone);
  skinned.forEach((mesh) => root.add(mesh));
  const clip = scene.animations.find((entry) => entry.name === META.clips.idle);

  const head = loader.parse(headJson);
  const headMeshes = [];
  head.traverse((object) => {
    if (object.isMesh) headMeshes.push(object);
  });

  models = {
    clip,
    headMeshes,
    mixer: new THREE.AnimationMixer(root),
    root,
    rootBone,
    skinned,
  };
  return models;
}

export const clipDuration = () => loadModels().clip.duration;

const toComponent = (mesh, matrix, transform, part) => {
  const { color, position } = mesh.geometry.attributes;
  const positions = new Float64Array(position.count * 3);
  const colors = new Float64Array(position.count * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < position.count; i += 1) {
    v.fromBufferAttribute(position, i);
    transform?.(i, v);
    v.applyMatrix4(matrix);
    positions.set([v.x, v.y, v.z], i * 3);
    colors.set(
      color ? [color.getX(i), color.getY(i), color.getZ(i)] : [1, 1, 1],
      i * 3
    );
  }
  return {
    colors,
    indices: Uint32Array.from(mesh.geometry.index.array),
    part,
    positions,
  };
};

// The camera head's aim, from FakeBird's neck/head joint triangle: forward
// neck → head, up the in-plane perpendicular (world-up as the sign
// reference a settled head converges to), then the scene's camRot/camOffset.
function aimHead(rootBone, camRot, camOffset) {
  const { orientJoints } = META.cam;
  const at = (name) =>
    rootBone.getObjectByName(name).getWorldPosition(new THREE.Vector3());
  const A = at(orientJoints.base[0]);
  const B = at(orientJoints.base[1]);
  const C = at(orientJoints.apex);
  const F = new THREE.Vector3().subVectors(B, A).normalize();
  const N = new THREE.Vector3().crossVectors(
    F,
    new THREE.Vector3().subVectors(C, A)
  );
  const U =
    N.lengthSq() > 1e-8
      ? new THREE.Vector3().crossVectors(N, F).normalize()
      : new THREE.Vector3(0, 1, 0);
  if (U.y < 0) U.negate();
  U.addScaledVector(F, -U.dot(F)).normalize();
  const R = new THREE.Vector3().crossVectors(U, F).normalize();
  const quaternion = new THREE.Quaternion()
    .setFromRotationMatrix(new THREE.Matrix4().makeBasis(R, U, F))
    .multiply(
      new THREE.Quaternion().setFromEuler(
        new THREE.Euler(camRot.x, camRot.y, camRot.z)
      )
    );
  const position = new THREE.Vector3()
    .addVectors(A, B)
    .multiplyScalar(0.5)
    .addScaledVector(R, camOffset.x)
    .addScaledVector(U, camOffset.y)
    .addScaledVector(F, camOffset.z);
  return { position, quaternion };
}

// IcosahedronGeometry is non-indexed; weld it into a closed indexed solid.
function mergeLed(geometry) {
  const { position } = geometry.attributes;
  const ids = new Map();
  const points = [];
  const index = [];
  for (let i = 0; i < position.count; i += 1) {
    const key = [position.getX(i), position.getY(i), position.getZ(i)]
      .map((v) => Math.round(v * 1e7))
      .join(',');
    if (!ids.has(key)) {
      ids.set(key, points.length / 3);
      points.push(position.getX(i), position.getY(i), position.getZ(i));
    }
    index.push(ids.get(key));
  }
  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  merged.setIndex(index);
  return merged;
}

// The bird at `time` into its idle clip with the camera head panned `pan`
// radians, as closed solids in scene units: body, camera body, lens, LED.
export default function posePigeon({ led, pan, time }) {
  const { clip, headMeshes, mixer, root, rootBone, skinned } = loadModels();
  mixer.stopAllAction();
  mixer.clipAction(clip).reset().play();
  mixer.setTime(time);
  root.scale.setScalar(META.modelScale);
  root.updateMatrixWorld(true);

  const parts = [];
  skinned.forEach((mesh) => {
    parts.push(
      toComponent(
        mesh,
        mesh.matrixWorld,
        (i, v) => mesh.applyBoneTransform(i, v),
        'body'
      )
    );
  });

  const headBone = rootBone.getObjectByName(META.headBone);
  const mount = new THREE.Group();
  headBone.add(mount);
  const aim = aimHead(rootBone, SCENE.camRot, SCENE.camOffset);
  mount.position.copy(headBone.worldToLocal(aim.position.clone()));
  mount.quaternion.copy(
    headBone
      .getWorldQuaternion(new THREE.Quaternion())
      .invert()
      .multiply(aim.quaternion)
  );
  mount.scale.setScalar(SCENE.camScale ?? META.cam.scale);

  // CameraHead: pan, then normalise the kept meshes to a unit box about
  // their centre.
  const box = new THREE.Box3();
  headMeshes.forEach((mesh) => {
    mesh.geometry.computeBoundingBox();
    box.union(mesh.geometry.boundingBox);
  });
  const centre = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const sweep = new THREE.Group();
  sweep.rotation.y = pan;
  const unit = new THREE.Group();
  unit.scale.setScalar(1 / maxDim);
  const recentre = new THREE.Group();
  recentre.position.set(-centre.x, -centre.y, -centre.z);
  mount.add(sweep);
  sweep.add(unit);
  unit.add(recentre);
  root.updateMatrixWorld(true);

  headMeshes.forEach((mesh, i) => {
    parts.push(
      toComponent(mesh, recentre.matrixWorld, null, i === 0 ? 'camera' : 'lens')
    );
  });

  if (led) {
    const ledMesh = new THREE.Mesh(
      mergeLed(new THREE.IcosahedronGeometry(0.005, 2))
    );
    ledMesh.position.set(
      SCENE.ledOffset.x,
      (size.y * 0.28) / maxDim + SCENE.ledOffset.y,
      (box.max.z - centre.z) / maxDim + SCENE.ledOffset.z
    );
    sweep.add(ledMesh);
    root.updateMatrixWorld(true);
    const component = toComponent(ledMesh, ledMesh.matrixWorld, null, 'led');
    component.colors.fill(0);
    for (let v = 0; v < component.colors.length; v += 3) {
      component.colors[v] = 1;
      component.colors[v + 1] = 0.17;
      component.colors[v + 2] = 0.17;
    }
    parts.push(component);
    ledMesh.geometry.dispose();
  }

  headBone.remove(mount);
  return parts;
}
