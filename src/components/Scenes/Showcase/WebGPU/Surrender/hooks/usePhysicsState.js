import * as THREE from 'three';

import { useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

const FLAG_TOP_Y = 0.9;

const sharedRaycaster = new THREE.Raycaster();
const sharedPlane = new THREE.Plane();
const sharedCameraDir = new THREE.Vector3();
const sharedIntersect = new THREE.Vector3();
const sharedFlagCenterLocal = new THREE.Vector3();
const sharedFlagCenterWorld = new THREE.Vector3();
const sharedInverseMatrix = new THREE.Matrix4();

export default function usePhysicsState({
  outlineGroupRef,
  clothWidth,
  clothHeight,
  wind,
  windDirX,
  windDirZ,
  cursorCollider,
  cursorRadius,
  gravity = 0.00005,
}) {
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const windDirection = useMemo(() => new THREE.Vector3(1, 0, 0), []);
  const gravityDirection = useMemo(() => new THREE.Vector3(0, -1, 0), []);
  const cursorSphere = useMemo(
    () => ({
      position: new THREE.Vector3(10, 10, 10),
      radius: cursorRadius,
      enabled: false,
    }),
    []
  );
  const flagCursorCollider = useMemo(
    () => ({
      position: new THREE.Vector3(10, 10, 10),
      radius: cursorRadius,
      enabled: false,
    }),
    []
  );
  const flagColliders = useMemo(
    () => [flagCursorCollider],
    [flagCursorCollider]
  );

  windDirection.set(windDirX, 0, windDirZ);
  if (windDirection.lengthSq() < 0.000001) {
    windDirection.set(1, 0, 0);
  } else {
    windDirection.normalize();
  }

  cursorSphere.radius = cursorRadius;
  flagCursorCollider.radius = cursorRadius;

  useFrame(({ pointer, camera }) => {
    if (!cursorCollider || !outlineGroupRef.current) {
      cursorSphere.enabled = false;
      flagCursorCollider.enabled = false;
      return;
    }

    const lastPointer = lastPointerRef.current;
    const pointerActive =
      pointer.x !== lastPointer.x || pointer.y !== lastPointer.y;

    if (pointerActive && (pointer.x !== 0 || pointer.y !== 0)) {
      sharedFlagCenterLocal.set(
        clothWidth * 0.5,
        FLAG_TOP_Y - clothHeight * 0.5,
        0
      );
      sharedFlagCenterWorld
        .copy(sharedFlagCenterLocal)
        .applyMatrix4(outlineGroupRef.current.matrixWorld);

      camera.getWorldDirection(sharedCameraDir);
      sharedPlane.setFromNormalAndCoplanarPoint(
        sharedCameraDir,
        sharedFlagCenterWorld
      );
      sharedRaycaster.setFromCamera(pointer, camera);

      if (sharedRaycaster.ray.intersectPlane(sharedPlane, sharedIntersect)) {
        cursorSphere.position.copy(sharedIntersect);
        cursorSphere.enabled = true;

        sharedInverseMatrix.copy(outlineGroupRef.current.matrixWorld).invert();
        flagCursorCollider.position
          .copy(sharedIntersect)
          .applyMatrix4(sharedInverseMatrix);
        flagCursorCollider.enabled = true;
      }
    }

    lastPointer.x = pointer.x;
    lastPointer.y = pointer.y;
  });

  return useMemo(
    () => ({
      wind,
      windDirection,
      gravity,
      gravityDirection,
      cursorSphere,
      flagColliders,
    }),
    [
      wind,
      gravity,
      windDirection,
      gravityDirection,
      cursorSphere,
      flagColliders,
    ]
  );
}
