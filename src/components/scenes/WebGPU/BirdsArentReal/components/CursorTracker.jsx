import { memo, useMemo } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three';

/**
 * Cursor-Follow driver. While enabled, projects the pointer onto a plane through the
 * scene focus point (perpendicular to the view) and writes the resulting world point
 * into `targetRef`. Every FakeBird reads that ref to swivel its lens at the cursor, so
 * the whole flock tracks you while you still orbit normally. Renders nothing.
 */
function CursorTracker({ enabled = false, targetRef, focus = [0, 0.6, 0] }) {
  const { camera, pointer, raycaster } = useThree();
  const plane = useMemo(() => new THREE.Plane(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);
  const focusPoint = useMemo(
    () => new THREE.Vector3(focus[0], focus[1], focus[2]),
    [focus]
  );

  useFrame(() => {
    if (!enabled || !targetRef?.current) return;
    camera.getWorldDirection(dir);
    plane.setFromNormalAndCoplanarPoint(dir, focusPoint);
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(plane, targetRef.current);
  });

  return null;
}

export default memo(CursorTracker);
