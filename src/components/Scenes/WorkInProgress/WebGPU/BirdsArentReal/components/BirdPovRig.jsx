import * as THREE from 'three';

import React, { useMemo, useRef } from 'react';

import { PerspectiveCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

/**
 * Bird POV camera. Rides the *active* fake bird's swept lens: each frame it reads the
 * lens group's world transform (registered by FakeBird via CameraHead's lensRef) and
 * pins this camera to it. The security-camera model faces +Z (the lens looks +Z) while
 * a Three camera looks down -Z, so we flip 180deg about Y to line the view up with the
 * lens. The director (scene) swaps `activeKey` on a timer and hides whichever bird we're
 * riding, so we never sit inside our own mesh.
 */
export default function BirdPovRig({
  nodesRef,
  activeKey,
  fov = 55,
  dolly = 0.05,
  near = 0.01,
  far = 1000,
}) {
  const camRef = useRef();
  const p = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const fwd = useMemo(() => new THREE.Vector3(), []);
  const qFlip = useMemo(
    () =>
      new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        Math.PI
      ),
    []
  );

  useFrame(() => {
    const cam = camRef.current;
    const node = nodesRef.current?.get(activeKey);
    if (!cam || !node) return;

    node.updateWorldMatrix(true, false);
    node.getWorldPosition(p);
    node.getWorldQuaternion(q);

    cam.quaternion.copy(q).multiply(qFlip); // camera -Z -> lens +Z
    fwd.set(0, 0, 1).applyQuaternion(q); // lens forward in world
    cam.position.copy(p).addScaledVector(fwd, dolly); // nudge out past the glass
  });

  return (
    <PerspectiveCamera
      ref={camRef}
      makeDefault
      fov={fov}
      near={near}
      far={far}
    />
  );
}
