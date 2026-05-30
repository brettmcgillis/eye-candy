import * as THREE from 'three';

import { useEffect, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

/**
 * Moves a camera along a spline path, optionally interpolating authored lookAt targets.
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

  useEffect(() => {
    globalLookAtRef.current.set(lookAt[0], lookAt[1], lookAt[2]);
  }, [lookAt[0], lookAt[1], lookAt[2]]);

  useEffect(() => {
    if (!enabled || !points || points.length < 2) return;

    const positions = points.map((point) => point.position.clone());
    positionCurveRef.current = new THREE.CatmullRomCurve3(
      positions,
      closed,
      'centripetal',
      tension
    );

    const hasPerPointLookAt = points[0]?.lookAt instanceof THREE.Vector3;

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

    startTimeRef.current = Date.now();
  }, [closed, enabled, points, tension]);

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

    if (lookAtCurveRef.current) {
      lookAtCurveRef.current.getPoint(progress, target);
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
