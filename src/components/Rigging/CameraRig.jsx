import React, { useEffect } from 'react';

import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

import useSceneCamera from '../../hooks/useSceneCamera';

export default function CameraRig({
  actions,
  apiRef = null,
  camera,
  orbitAutoFitFrame,
  orbitControlsProps,
  orbitInteractionEnabled = true,
  perspectiveCameraProps,
  shouldBlockPointerLook,
}) {
  const {
    captureCurrentCameraFrame,
    copyCurrentCameraConfig,
    controlsProps,
    getCurrentCameraConfigSnapshot,
    handleCameraRef,
    handleControlsRef,
    isOrbitMode,
    perspectiveCameraProps: resolvedPerspectiveCameraProps,
  } = useSceneCamera({
    actions,
    camera,
    orbitAutoFitFrame,
    orbitControlsProps,
    orbitInteractionEnabled,
    shouldBlockPointerLook,
  });

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
    </>
  );
}
