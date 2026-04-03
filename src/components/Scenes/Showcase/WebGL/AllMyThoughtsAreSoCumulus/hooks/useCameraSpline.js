import * as THREE from 'three';

import { useEffect, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

/**
 * useCameraSpline - Moves camera along a spline path, looking at an interpolated target.
 *
 * Props:
 * - enabled: boolean - Whether the spline camera is active
 * - points: array of { position: Vector3, lookAt?: Vector3 } - Spline keyframes.
 *     If points have a `lookAt` vector, a second CatmullRom curve is built from those
 *     targets and the camera smoothly interpolates between them. If no per-point lookAt
 *     is provided, the global `lookAt` fallback is used instead.
 * - duration: number - Time in seconds for one complete loop
 * - tension: number (default 0.5) - CatmullRom curve tension
 * - closed: boolean (default true) - Whether the spline forms a closed loop
 * - lookAt: [x, y, z] - Global fallback look-at target when points have no lookAt
 */
export default function useCameraSpline({
  enabled = false,
  cameraRef = null,
  points = [],
  duration = 30,
  tension = 0.5,
  closed = true,
  lookAt = [0, 0, 0],
} = {}) {
  const startTimeRef = useRef(null);
  const positionCurveRef = useRef(null);
  const lookAtCurveRef = useRef(null);
  const globalLookAtRef = useRef(new THREE.Vector3());

  // Update global fallback target whenever lookAt prop changes
  useEffect(() => {
    globalLookAtRef.current.set(lookAt[0], lookAt[1], lookAt[2]);
  }, [lookAt[0], lookAt[1], lookAt[2]]);

  // Build spline curves
  useEffect(() => {
    if (!enabled || !points || points.length < 2) return;

    // Position curve
    const positions = points.map((p) => p.position.clone());
    positionCurveRef.current = new THREE.CatmullRomCurve3(
      positions,
      closed,
      'centripetal',
      tension
    );

    // Per-point lookAt curve — only built if points supply lookAt vectors
    const hasPerPointLookAt = points[0]?.lookAt instanceof THREE.Vector3;
    if (hasPerPointLookAt) {
      const targets = points.map((p) =>
        p.lookAt instanceof THREE.Vector3 ? p.lookAt.clone() : new THREE.Vector3()
      );
      lookAtCurveRef.current = new THREE.CatmullRomCurve3(
        targets,
        closed,
        'centripetal',
        tension
      );
    } else {
      lookAtCurveRef.current = null;
    }

    startTimeRef.current = Date.now();
  }, [enabled, points, tension, closed]);

  // Animate camera each frame
  useFrame((state) => {
    const activeCamera = cameraRef?.current || state.camera;
    if (
      !enabled ||
      !activeCamera ||
      !positionCurveRef.current ||
      points.length < 2
    ) {
      return;
    }

    const now = Date.now();
    const elapsed = (now - startTimeRef.current) / 1000;
    const t = (elapsed / duration) % 1;

    // Position
    const position = new THREE.Vector3();
    positionCurveRef.current.getPoint(t, position);
    activeCamera.position.copy(position);

    // LookAt target — per-point curve or global fallback
    const target = new THREE.Vector3();
    if (lookAtCurveRef.current) {
      lookAtCurveRef.current.getPoint(t, target);
    } else {
      target.copy(globalLookAtRef.current);
    }

    activeCamera.lookAt(target);
  });

  return {
    camera: cameraRef?.current || null,
    startTime: startTimeRef.current,
  };
}
