import React, { useEffect, useMemo, useRef } from 'react';

import { Line, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useThree } from '@react-three/fiber';

import * as THREE from 'three';

import useSceneCamera from './useSceneCamera';

function SplinePathLineGL({ points }) {
  return <Line points={points} color="#00eeff" lineWidth={1.5} />;
}

function SplinePathLineWebGPU({ points }) {
  const geometry = useMemo(
    () => new THREE.BufferGeometry().setFromPoints(points),
    [points]
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <line geometry={geometry}>
      <lineBasicMaterial color="#00eeff" />
    </line>
  );
}

function SplinePathLine({ points }) {
  const { gl } = useThree();
  return gl.isWebGPURenderer ? (
    <SplinePathLineWebGPU points={points} />
  ) : (
    <SplinePathLineGL points={points} />
  );
}

export default function CameraRig({
  actions,
  apiRef = null,
  autoRotate,
  autoRotateSpeed,
  camera,
  onShotChange = null,
  orbitAutoFitFrame,
  operatorInputOptions,
  orbitControlsProps,
  orbitInteractionEnabled = true,
  perspectiveCameraProps,
  shouldBlockPointerLook,
}) {
  const resolvedOrbitControlsProps = useMemo(() => {
    return {
      ...(orbitControlsProps ?? {}),
      ...(autoRotate !== undefined ? { autoRotate } : {}),
      ...(autoRotateSpeed !== undefined ? { autoRotateSpeed } : {}),
    };
  }, [autoRotate, autoRotateSpeed, orbitControlsProps]);

  const {
    activeFixedShotId,
    captureCurrentCameraFrame,
    copyCurrentCameraConfig,
    controlsProps,
    getCurrentCameraConfigSnapshot,
    handleCameraRef,
    handleControlsRef,
    isOrbitMode,
    isSplineMode,
    perspectiveCameraProps: resolvedPerspectiveCameraProps,
    splineClosed,
    splinePoints,
    splineShowPath,
    splineTension,
  } = useSceneCamera({
    actions,
    camera,
    orbitAutoFitFrame,
    operatorInputOptions,
    orbitControlsProps: resolvedOrbitControlsProps,
    orbitInteractionEnabled,
    shouldBlockPointerLook,
  });

  const splinePathPoints = useMemo(() => {
    if (!isSplineMode || !splineShowPath || splinePoints.length < 2) {
      return null;
    }

    const curve = new THREE.CatmullRomCurve3(
      splinePoints.map((p) => p.position.clone()),
      splineClosed,
      'centripetal',
      splineTension
    );

    return curve.getPoints(200);
  }, [isSplineMode, splineShowPath, splinePoints, splineClosed, splineTension]);

  const onShotChangeRef = useRef(onShotChange);
  onShotChangeRef.current = onShotChange;

  useEffect(() => {
    onShotChangeRef.current?.(activeFixedShotId);
  }, [activeFixedShotId]);

  useEffect(() => {
    if (!apiRef) {
      return undefined;
    }

    const cameraApiRef = apiRef;
    const cameraApi =
      cameraApiRef.current && typeof cameraApiRef.current === 'object'
        ? cameraApiRef.current
        : {};

    cameraApi.captureCurrentCameraFrame = captureCurrentCameraFrame;
    cameraApi.copyCurrentCameraConfig = copyCurrentCameraConfig;
    cameraApi.getCurrentCameraConfigSnapshot = getCurrentCameraConfigSnapshot;
    cameraApiRef.current = cameraApi;

    return () => {
      if (!cameraApiRef.current || typeof cameraApiRef.current !== 'object') {
        return;
      }

      delete cameraApiRef.current.captureCurrentCameraFrame;
      delete cameraApiRef.current.copyCurrentCameraConfig;
      delete cameraApiRef.current.getCurrentCameraConfigSnapshot;

      if (!Object.keys(cameraApiRef.current).length) {
        cameraApiRef.current = null;
      }
    };
  }, [
    apiRef,
    captureCurrentCameraFrame,
    copyCurrentCameraConfig,
    getCurrentCameraConfigSnapshot,
  ]);

  return (
    <>
      <PerspectiveCamera
        {...perspectiveCameraProps}
        ref={handleCameraRef}
        makeDefault
        {...resolvedPerspectiveCameraProps}
      />
      {isOrbitMode ? (
        <OrbitControls
          {...orbitControlsProps}
          ref={handleControlsRef}
          makeDefault
          {...controlsProps}
        />
      ) : null}
      {splinePathPoints ? <SplinePathLine points={splinePathPoints} /> : null}
    </>
  );
}
