import { useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

const scratchTarget = new THREE.Vector3();

function resolveTarget(target) {
  if (!target) return null;
  if (target.isVector3) return target;
  if (target.current?.isVector3) return target.current;
  if (Array.isArray(target) && target.length === 3) {
    return scratchTarget.set(target[0], target[1], target[2]);
  }
  return null;
}

// Drives the camera's look target at runtime from a live world point.
//
// Orbit and spline reach their look direction by different routes — orbit sets
// OrbitControls' target, spline calls lookAt() after positioning along the path
// — so a scene cannot simply write one value. This hook is the single place
// both are redirected, and it is a no-op unless a target is supplied.
//
// Registered after useCameraSpline so its lookAt wins for that frame, and left
// at default priority so it never takes over rendering.
export default function useCameraFollow({
  cameraNode,
  controlsNode,
  damping = 0,
  enabled = true,
  isOrbitMode = false,
  isSplineMode = false,
  target = null,
}) {
  // Orbit damps by easing OrbitControls' own target, which persists between
  // frames. Spline has no such state — lookAt() is recomputed from scratch
  // every frame — so it needs its own smoothed point, or `damping` silently
  // does nothing there and the camera snaps to each new target.
  const smoothedRef = useRef(null);

  useFrame((_, delta) => {
    if (!enabled || !cameraNode) return;

    const point = resolveTarget(target);
    if (!point) return;

    const blend = damping > 0 ? Math.min(1, damping * delta) : 1;

    if (isOrbitMode) {
      if (!controlsNode?.target) return;
      controlsNode.target.lerp(point, blend);
      controlsNode.update();
      return;
    }

    if (isSplineMode) {
      if (!smoothedRef.current) smoothedRef.current = point.clone();
      smoothedRef.current.lerp(point, blend);
      cameraNode.lookAt(smoothedRef.current);
    }
  });
}
