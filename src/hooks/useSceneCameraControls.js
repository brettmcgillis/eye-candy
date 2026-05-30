import { useCallback, useMemo } from 'react';

import buildSceneCameraControls from './buildSceneCameraControls';
import {
  buildSceneCameraConfigSnapshot,
  buildSceneCameraRuntimeConfig,
  normalizeSceneCameraDeclaration,
} from './sceneCameraUtils';

export default function useSceneCameraControls(options = {}) {
  const normalizedCamera = useMemo(() => {
    return normalizeSceneCameraDeclaration(options.camera);
  }, [options.camera]);

  const cameraControls = useMemo(() => {
    return buildSceneCameraControls({
      ...options,
      camera: normalizedCamera,
    });
  }, [
    normalizedCamera,
    options.additionalControls,
    options.apiRef,
    options.cameraFolderPath,
    options.controlOverrides,
    options.controlsSnapshotRef,
    options.copyCurrentCameraKey,
    options.copyCurrentCameraOptions,
    options.fixedAdditionalControls,
    options.fixedFolderOptions,
    options.includeClipPlaneControls,
    options.includeCopyCurrentCamera,
    options.operatorAdditionalControls,
    options.operatorFolderOptions,
    options.orbitAdditionalControls,
    options.orbitFolderOptions,
    options.splineAdditionalControls,
    options.splineFolderOptions,
  ]);

  const buildCamera = useCallback(
    (controls = {}) => {
      return buildSceneCameraRuntimeConfig({
        camera: normalizedCamera,
        controls,
      });
    },
    [normalizedCamera]
  );

  const buildCameraConfigSnapshot = useCallback(
    ({
      capturedFrame = null,
      controls = {},
      options: snapshotOptions = {},
    } = {}) => {
      return buildSceneCameraConfigSnapshot({
        camera: normalizedCamera,
        capturedFrame,
        controls,
        options: snapshotOptions,
      });
    },
    [normalizedCamera]
  );

  return {
    buildCamera,
    buildCameraConfigSnapshot,
    cameraControls,
    normalizedCamera,
  };
}
