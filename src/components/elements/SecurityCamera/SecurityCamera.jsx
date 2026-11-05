/* eslint-disable no-underscore-dangle */
import React, { useImperativeHandle, useLayoutEffect, useMemo } from 'react';

import { useAnimations, useGLTF } from '@react-three/drei';
import { useGraph } from '@react-three/fiber';

import { Matrix4, Object3D, Quaternion, Vector3 } from 'three';
import { SkeletonUtils } from 'three-stdlib';

import { modelFile } from '@utils/appUtils';

const LENS = new Vector3(0.002, 0.441, 0.545);
const Y_AXIS = new Vector3(0, 1, 0);
const X_AXIS = new Vector3(1, 0, 0);

const scratch = {
  q: new Quaternion(),
  r: new Quaternion(),
  axis: new Vector3(),
  lens: new Vector3(),
  aim: new Vector3(),
  m: new Matrix4(),
};

function modelQuaternion(bone, rootJoint, out) {
  out.identity();
  for (let node = bone; node && node !== rootJoint.parent; node = node.parent)
    out.premultiply(node.quaternion);
  return out;
}

function rotateInModel(bone, rest, rootJoint, axis, angle) {
  const parent = modelQuaternion(bone.parent, rootJoint, scratch.q);
  scratch.r.setFromAxisAngle(axis, angle);
  bone.quaternion
    .copy(parent)
    .invert()
    .multiply(scratch.r)
    .multiply(parent)
    .multiply(rest);
}

// Pan turns the stem about the mount's up axis and tilt pitches the head about
// its panned right axis, both in the model's own frame, so the result is the
// same however the camera group itself is placed.
function createRig(nodes) {
  const rootJoint = nodes._rootJoint;
  const stem = nodes.StemJoint_01;
  const head = nodes.CameraJoint_02;
  const stemRest = stem.quaternion.clone();
  const headRest = head.quaternion.clone();

  rootJoint.updateWorldMatrix(true, true);
  const modelToHead = new Matrix4()
    .copy(head.matrixWorld)
    .invert()
    .multiply(rootJoint.matrixWorld)
    .multiply(new Matrix4().copy(rootJoint.matrix).invert());
  const marker = (point) => {
    const object = new Object3D();
    object.position.copy(point).applyMatrix4(modelToHead);
    head.add(object);
    return object;
  };
  const lens = marker(LENS);
  const aim = marker(LENS.clone().add(new Vector3(0, 0, 1)));

  const rig = {
    lens,
    aim,
    pan: 0,
    tilt: 0,
    pose(pan, tilt) {
      rig.pan = pan;
      rig.tilt = tilt;
      stem.quaternion.copy(stemRest);
      head.quaternion.copy(headRest);
      rotateInModel(stem, stemRest, rootJoint, Y_AXIS, pan);
      scratch.axis.copy(X_AXIS).applyAxisAngle(Y_AXIS, pan);
      rotateInModel(head, headRest, rootJoint, scratch.axis, tilt);
      rootJoint.updateMatrixWorld(true);
    },
    lensInModel(out) {
      rootJoint.updateWorldMatrix(true, true);
      scratch.m.copy(rootJoint.matrixWorld).invert();
      return out
        .setFromMatrixPosition(lens.matrixWorld)
        .applyMatrix4(scratch.m)
        .applyMatrix4(rootJoint.matrix);
    },
    aimAt(target, offsetPan = 0, offsetTilt = 0) {
      let { pan, tilt } = rig;
      for (let i = 0; i < 3; i += 1) {
        rig.pose(pan, tilt);
        const d = scratch.aim.copy(target).sub(rig.lensInModel(scratch.lens));
        pan = Math.atan2(d.x, d.z);
        tilt = Math.atan2(-d.y, Math.hypot(d.x, d.z));
      }
      rig.pose(pan + offsetPan, tilt + offsetTilt);
      rig.pan = pan;
      rig.tilt = tilt;
    },
  };
  return rig;
}

export default function SecurityCamera({ ref, pan = 0, tilt = 0, ...props }) {
  const group = React.useRef();
  const { scene, animations } = useGLTF(modelFile('security_camera.glb'));
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);
  const { actions } = useAnimations(animations, group);
  const rig = useMemo(() => createRig(nodes), [nodes]);

  useLayoutEffect(() => rig.pose(pan, tilt), [pan, rig, tilt]);
  useImperativeHandle(ref, () => ({ actions, group: group.current, rig }), [
    actions,
    rig,
  ]);

  return (
    <group ref={group} {...props} dispose={null}>
      <group name="Sketchfab_Scene">
        <primitive object={nodes._rootJoint} />
        <skinnedMesh
          castShadow
          name="Object_7"
          geometry={nodes.Object_7.geometry}
          material={materials.Camera_map}
          skeleton={nodes.Object_7.skeleton}
          scale={0.01}
        />
        <skinnedMesh
          name="Object_8"
          geometry={nodes.Object_8.geometry}
          material={materials.Lens_map}
          skeleton={nodes.Object_8.skeleton}
          scale={0.01}
        />
        <skinnedMesh
          castShadow
          name="Object_10"
          geometry={nodes.Object_10.geometry}
          material={materials.Camera_map}
          skeleton={nodes.Object_10.skeleton}
          scale={0.01}
        />
        <skinnedMesh
          castShadow
          name="Object_12"
          geometry={nodes.Object_12.geometry}
          material={materials.Camera_map}
          skeleton={nodes.Object_12.skeleton}
          scale={0.01}
        />
      </group>
    </group>
  );
}

useGLTF.preload(modelFile('security_camera.glb'));
