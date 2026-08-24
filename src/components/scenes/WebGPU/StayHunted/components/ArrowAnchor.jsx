import React, { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

import Arrow from './Arrow';

const ARROW_AXIS = new THREE.Vector3(0, 1, 0);
const sharedAnchorPosition = new THREE.Vector3();
const sharedWorldNormal = new THREE.Vector3();
const sharedWorldQuaternion = new THREE.Quaternion();
const sharedArrowQuaternion = new THREE.Quaternion();

export default function ArrowAnchor({
  boneName,
  embedDepth = 0.012,
  localNormal = [0, 1, 0],
  localPosition = [0, 0, 0],
  rabbitRef,
  ...arrowProps
}) {
  const anchorRef = useRef();
  const boneRef = useRef();

  const localAnchorPosition = useMemo(
    () => new THREE.Vector3(...localPosition),
    [localPosition]
  );
  const localAnchorNormal = useMemo(
    () => new THREE.Vector3(...localNormal).normalize(),
    [localNormal]
  );

  useFrame(() => {
    const rabbit = rabbitRef.current;
    const anchor = anchorRef.current;

    if (!rabbit || !anchor) return;

    const bone = boneRef.current || rabbit.getObjectByName(boneName);
    if (!bone) return;

    boneRef.current = bone;

    bone.localToWorld(sharedAnchorPosition.copy(localAnchorPosition));
    bone.getWorldQuaternion(sharedWorldQuaternion);

    sharedWorldNormal
      .copy(localAnchorNormal)
      .applyQuaternion(sharedWorldQuaternion)
      .normalize();

    sharedAnchorPosition.addScaledVector(sharedWorldNormal, embedDepth);
    sharedArrowQuaternion.setFromUnitVectors(ARROW_AXIS, sharedWorldNormal);

    anchor.position.copy(sharedAnchorPosition);
    anchor.quaternion.copy(sharedArrowQuaternion);
  });

  return (
    <group ref={anchorRef}>
      <Arrow {...arrowProps} />
    </group>
  );
}
