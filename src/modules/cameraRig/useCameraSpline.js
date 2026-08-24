import { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

/**
 * Moves a camera along a spline path, optionally interpolating authored lookAt targets.
 */
const DEFAULT_ORIENTATION_MODE = 'target';
const DEFAULT_FORWARD_DISTANCE = 1;

function resolveOrientationMode(orientationMode, points) {
  const normalized = `${orientationMode ?? ''}`.trim().toLowerCase();

  if (normalized === 'authored' || normalized === 'forward') {
    return normalized;
  }

  if (normalized === 'target') {
    return DEFAULT_ORIENTATION_MODE;
  }

  return points.some((point) => point?.lookAt instanceof THREE.Vector3)
    ? 'authored'
    : DEFAULT_ORIENTATION_MODE;
}

export default function useCameraSpline({
  enabled = false,
  cameraRef = null,
  points = [],
  duration = 30,
  tension = 0.5,
  closed = true,
  lookAt = [0, 0, 0],
  orientationMode = DEFAULT_ORIENTATION_MODE,
  forwardDistance = DEFAULT_FORWARD_DISTANCE,
} = {}) {
  const startTimeRef = useRef(null);
  const positionCurveRef = useRef(null);
  const lookAtCurveRef = useRef(null);
  const globalLookAtRef = useRef(new THREE.Vector3());
  const prevEnabledRef = useRef(false);
  const resolvedOrientationMode = useMemo(() => {
    return resolveOrientationMode(orientationMode, points);
  }, [orientationMode, points]);

  useEffect(() => {
    globalLookAtRef.current.set(lookAt[0], lookAt[1], lookAt[2]);
  }, [lookAt[0], lookAt[1], lookAt[2]]);

  useEffect(() => {
    const wasEnabled = prevEnabledRef.current;
    prevEnabledRef.current = enabled;

    if (!enabled || !points || points.length < 2) return;

    const positions = points.map((point) => point.position.clone());
    positionCurveRef.current = new THREE.CatmullRomCurve3(
      positions,
      closed,
      'centripetal',
      tension
    );

    const hasPerPointLookAt =
      resolvedOrientationMode === 'authored' &&
      points[0]?.lookAt instanceof THREE.Vector3;

    if (hasPerPointLookAt) {
      const targets = points.map((point) =>
        point.lookAt instanceof THREE.Vector3
          ? point.lookAt.clone()
          : new THREE.Vector3()
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

    // Only reset the clock when enabling for the first time; preserve progress
    // across curve rebuilds (e.g. when unrelated leva controls change and cause
    // new point object references to flow through).
    if (!wasEnabled || startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }
  }, [closed, enabled, points, resolvedOrientationMode, tension]);

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
    const progress = (elapsed / duration) % 1;

    const position = new THREE.Vector3();
    positionCurveRef.current.getPoint(progress, position);
    activeCamera.position.copy(position);

    const target = new THREE.Vector3();

    if (resolvedOrientationMode === 'forward') {
      const tangent = new THREE.Vector3();
      positionCurveRef.current.getTangent(progress, tangent);

      if (tangent.lengthSq() > 0) {
        target
          .copy(position)
          .addScaledVector(tangent.normalize(), forwardDistance);
      } else {
        target.copy(globalLookAtRef.current);
      }
    } else if (lookAtCurveRef.current) {
      lookAtCurveRef.current.getPoint(progress, target);
    } else {
      target.copy(globalLookAtRef.current);
    }

    activeCamera.lookAt(target);
  });

  return {
    camera: cameraRef?.current || null,
    orientationMode: resolvedOrientationMode,
    startTime: startTimeRef.current,
  };
}
