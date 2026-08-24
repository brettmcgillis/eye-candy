import { button, folder } from 'leva';

import { localEnv } from '@utils/appUtils';

import {
  SCENE_CAMERA_FIXED_BEHAVIOR_OPTIONS,
  SCENE_CAMERA_MODE_OPTIONS,
  SCENE_CAMERA_SPLINE_ORIENTATION_OPTIONS,
  buildCameraControlOverridesFromSnapshot,
  buildSceneCameraControlSnapshot,
  getFixedShotControlKeys,
  getFixedShotDescriptors,
  normalizeSceneCameraDeclaration,
  serializeSceneCameraControlSnapshot,
  toVectorObject,
} from './sceneCameraUtils';

const DEFAULT_FOLDER_OPTIONS = Object.freeze({ collapsed: true });
const DEFAULT_VECTOR_STEP = 0.1;

function applyControlOverride(controlKey, control, controlOverrides) {
  if (!controlOverrides?.[controlKey]) {
    return control;
  }

  return {
    ...control,
    ...controlOverrides[controlKey],
  };
}

function buildRender(cameraFolderPath, expectedMode) {
  if (!cameraFolderPath) {
    return undefined;
  }

  return (get) => get(`${cameraFolderPath}.cameraMode`) === expectedMode;
}

function buildSequenceRender(cameraFolderPath) {
  if (!cameraFolderPath) {
    return undefined;
  }

  return (get) => get(`${cameraFolderPath}.Fixed.fixedBehavior`) === 'sequence';
}

function buildOrbitMaxDistanceRender(cameraFolderPath) {
  if (!cameraFolderPath) {
    return undefined;
  }

  return (get) => !get(`${cameraFolderPath}.Orbit.orbitMaxDistanceUnlimited`);
}

function buildOrbitAzimuthRender(cameraFolderPath) {
  if (!cameraFolderPath) {
    return undefined;
  }

  return (get) => !get(`${cameraFolderPath}.Orbit.orbitAzimuthUnlimited`);
}

function buildForwardRender(cameraFolderPath) {
  if (!cameraFolderPath) {
    return undefined;
  }

  return (get) => {
    return get(`${cameraFolderPath}.splineOrientationMode`) === 'forward';
  };
}

function hasControls(controls) {
  return !!controls && Object.keys(controls).length > 0;
}

function buildCameraSection(label, controls, folderOptions) {
  if (!hasControls(controls)) {
    return {};
  }

  return {
    [label]: folder(controls, {
      ...DEFAULT_FOLDER_OPTIONS,
      ...folderOptions,
    }),
  };
}

function resolveCopyCurrentCameraOptions(copyCurrentCameraOptions) {
  if (typeof copyCurrentCameraOptions === 'function') {
    return copyCurrentCameraOptions() ?? {};
  }

  return copyCurrentCameraOptions ?? {};
}

async function copyCurrentCameraSnapshot({
  apiRef,
  camera,
  controlsSnapshotRef,
  copyCurrentCameraOptions,
  includeClipPlaneControls,
}) {
  const options = resolveCopyCurrentCameraOptions(copyCurrentCameraOptions);
  const captureCurrentCameraFrame = apiRef?.current?.captureCurrentCameraFrame;
  const capturedFrame =
    typeof captureCurrentCameraFrame === 'function'
      ? captureCurrentCameraFrame(options)
      : null;
  const snapshot = buildSceneCameraControlSnapshot({
    camera,
    capturedFrame,
    controls: controlsSnapshotRef?.current ?? {},
    options: { includeClipPlaneControls, ...options },
  });
  const serializedSnapshot = (
    options.transform ?? serializeSceneCameraControlSnapshot
  )(snapshot);
  const clipboard = globalThis?.navigator?.clipboard;

  if (clipboard?.writeText) {
    await clipboard.writeText(serializedSnapshot);
  }

  return serializedSnapshot;
}

export default function buildSceneCameraControls({
  additionalControls = null,
  apiRef = null,
  camera = null,
  cameraFolderPath = null,
  controlOverrides: explicitControlOverrides = null,
  controlsSnapshotRef = null,
  copyCurrentCameraOptions = null,
  copyCurrentCameraKey = 'Copy Current Camera',
  fixedAdditionalControls = null,
  fixedFolderOptions = null,
  includeClipPlaneControls = false,
  includeCopyCurrentCamera = true,
  operatorAdditionalControls = null,
  operatorFolderOptions = null,
  orbitAdditionalControls = null,
  orbitFolderOptions = null,
  splineAdditionalControls = null,
  splineFolderOptions = null,
} = {}) {
  const normalizedCamera = normalizeSceneCameraDeclaration(camera);
  // Seed the schema's `value:`s from the active preset's camera keys (via
  // controlsSnapshotRef, already populated with the preset snapshot at this
  // point — see usePresetsFolder) before falling back to camera.js's static
  // declaration, so the camera folder starts correct on first mount instead
  // of only after the presets "reset" button explicitly re-applies it.
  // Explicit controlOverrides (if a caller passes any) win per-key.
  const controlOverrides = {
    ...buildCameraControlOverridesFromSnapshot(controlsSnapshotRef?.current),
    ...(explicitControlOverrides ?? {}),
  };
  const fixedShotDescriptors = getFixedShotDescriptors(normalizedCamera.fixed);
  const canCopyCurrentCamera =
    includeCopyCurrentCamera && localEnv() && !!apiRef;
  const fixedFolderRender = buildRender(cameraFolderPath, 'fixed');
  const orbitFolderRender = buildRender(cameraFolderPath, 'orbit');
  const splineFolderRender = buildRender(cameraFolderPath, 'spline');
  const operatorFolderRender = buildRender(cameraFolderPath, 'operator');
  const fixedSequenceRender = buildSequenceRender(cameraFolderPath);
  const splineForwardRender = buildForwardRender(cameraFolderPath);
  const orbitMaxDistanceRender = buildOrbitMaxDistanceRender(cameraFolderPath);
  const orbitAzimuthRender = buildOrbitAzimuthRender(cameraFolderPath);

  const fixedControls = {
    fixedBehavior: applyControlOverride(
      'fixedBehavior',
      {
        label: 'Behavior',
        options: SCENE_CAMERA_FIXED_BEHAVIOR_OPTIONS,
        value: normalizedCamera.fixed.behavior,
      },
      controlOverrides
    ),
    ...(normalizedCamera.fixed.shotIds.length > 1
      ? {
          fixedActiveShot: applyControlOverride(
            'fixedActiveShot',
            {
              label: 'Active Shot',
              options: normalizedCamera.fixed.shotIds,
              value: normalizedCamera.fixed.activeShot,
            },
            controlOverrides
          ),
          fixedSequenceIntervalSeconds: applyControlOverride(
            'fixedSequenceIntervalSeconds',
            {
              label: 'Sequence Interval',
              max: 60,
              min: 0.25,
              render: fixedSequenceRender,
              step: 0.25,
              value: normalizedCamera.fixed.sequenceIntervalSeconds,
            },
            controlOverrides
          ),
          fixedSequenceOrder: applyControlOverride(
            'fixedSequenceOrder',
            {
              label: 'Shot Order',
              render: fixedSequenceRender,
              value: normalizedCamera.fixed.sequenceOrder.join(', '),
            },
            controlOverrides
          ),
        }
      : {}),
    ...fixedShotDescriptors.reduce((accumulator, descriptor) => {
      const shotConfig = normalizedCamera.fixed.shots[descriptor.id];
      const controlKeys = getFixedShotControlKeys(descriptor);

      accumulator[descriptor.label] = folder(
        {
          [controlKeys.desktopPosition]: applyControlOverride(
            controlKeys.desktopPosition,
            {
              label: 'Desktop Position',
              step: DEFAULT_VECTOR_STEP,
              value: toVectorObject(
                shotConfig.desktop.position,
                shotConfig.desktop.position
              ),
            },
            controlOverrides
          ),
          [controlKeys.desktopTarget]: applyControlOverride(
            controlKeys.desktopTarget,
            {
              label: 'Desktop Target',
              step: DEFAULT_VECTOR_STEP,
              value: toVectorObject(
                shotConfig.desktop.target,
                shotConfig.desktop.target
              ),
            },
            controlOverrides
          ),
          [controlKeys.desktopFov]: applyControlOverride(
            controlKeys.desktopFov,
            {
              label: 'Desktop FOV',
              max: 120,
              min: 5,
              step: 1,
              value: shotConfig.desktop.fov,
            },
            controlOverrides
          ),
          [controlKeys.mobilePosition]: applyControlOverride(
            controlKeys.mobilePosition,
            {
              label: 'Mobile Position',
              step: DEFAULT_VECTOR_STEP,
              value: toVectorObject(
                shotConfig.mobile.position,
                shotConfig.mobile.position
              ),
            },
            controlOverrides
          ),
          [controlKeys.mobileTarget]: applyControlOverride(
            controlKeys.mobileTarget,
            {
              label: 'Mobile Target',
              step: DEFAULT_VECTOR_STEP,
              value: toVectorObject(
                shotConfig.mobile.target,
                shotConfig.mobile.target
              ),
            },
            controlOverrides
          ),
          [controlKeys.mobileFov]: applyControlOverride(
            controlKeys.mobileFov,
            {
              label: 'Mobile FOV',
              max: 120,
              min: 5,
              step: 1,
              value: shotConfig.mobile.fov,
            },
            controlOverrides
          ),
        },
        DEFAULT_FOLDER_OPTIONS
      );

      return accumulator;
    }, {}),
    ...(fixedAdditionalControls ?? {}),
  };

  const orbitControls = {
    orbitAutoRotate: applyControlOverride(
      'orbitAutoRotate',
      {
        label: 'Auto Rotate',
        value: normalizedCamera.orbit.autoRotate,
      },
      controlOverrides
    ),
    orbitAutoRotateSpeed: applyControlOverride(
      'orbitAutoRotateSpeed',
      {
        label: 'Rotate Speed',
        max: 16,
        min: -16,
        step: 0.1,
        value: normalizedCamera.orbit.autoRotateSpeed,
      },
      controlOverrides
    ),
    orbitEnablePan: applyControlOverride(
      'orbitEnablePan',
      {
        label: 'Enable Pan',
        value: normalizedCamera.orbit.enablePan,
      },
      controlOverrides
    ),
    orbitMinPolarAngle: applyControlOverride(
      'orbitMinPolarAngle',
      {
        label: 'Min Polar Angle',
        max: 180,
        min: 0,
        step: 1,
        value: normalizedCamera.orbit.minPolarAngle,
      },
      controlOverrides
    ),
    orbitMaxPolarAngle: applyControlOverride(
      'orbitMaxPolarAngle',
      {
        label: 'Max Polar Angle',
        max: 180,
        min: 0,
        step: 1,
        value: normalizedCamera.orbit.maxPolarAngle,
      },
      controlOverrides
    ),
    orbitAzimuthUnlimited: applyControlOverride(
      'orbitAzimuthUnlimited',
      {
        label: 'Azimuth Unlimited',
        value: normalizedCamera.orbit.azimuthUnlimited,
      },
      controlOverrides
    ),
    orbitMinAzimuthAngle: applyControlOverride(
      'orbitMinAzimuthAngle',
      {
        label: 'Min Azimuth Angle',
        max: 180,
        min: -180,
        render: orbitAzimuthRender,
        step: 1,
        value: normalizedCamera.orbit.minAzimuthAngle,
      },
      controlOverrides
    ),
    orbitMaxAzimuthAngle: applyControlOverride(
      'orbitMaxAzimuthAngle',
      {
        label: 'Max Azimuth Angle',
        max: 180,
        min: -180,
        render: orbitAzimuthRender,
        step: 1,
        value: normalizedCamera.orbit.maxAzimuthAngle,
      },
      controlOverrides
    ),
    orbitMinDistance: applyControlOverride(
      'orbitMinDistance',
      {
        label: 'Min Distance',
        min: 0,
        step: 0.5,
        value: normalizedCamera.orbit.minDistance,
      },
      controlOverrides
    ),
    orbitMaxDistanceUnlimited: applyControlOverride(
      'orbitMaxDistanceUnlimited',
      {
        label: 'Max Distance Unlimited',
        value: normalizedCamera.orbit.maxDistanceUnlimited,
      },
      controlOverrides
    ),
    orbitMaxDistance: applyControlOverride(
      'orbitMaxDistance',
      {
        label: 'Max Distance',
        min: 0,
        render: orbitMaxDistanceRender,
        step: 0.5,
        value: normalizedCamera.orbit.maxDistance,
      },
      controlOverrides
    ),
    orbitDesktopPosition: applyControlOverride(
      'orbitDesktopPosition',
      {
        label: 'Desktop Position',
        step: DEFAULT_VECTOR_STEP,
        value: toVectorObject(
          normalizedCamera.orbit.desktop.position,
          normalizedCamera.orbit.desktop.position
        ),
      },
      controlOverrides
    ),
    orbitDesktopTarget: applyControlOverride(
      'orbitDesktopTarget',
      {
        label: 'Desktop Target',
        step: DEFAULT_VECTOR_STEP,
        value: toVectorObject(
          normalizedCamera.orbit.desktop.target,
          normalizedCamera.orbit.desktop.target
        ),
      },
      controlOverrides
    ),
    orbitDesktopPivot: applyControlOverride(
      'orbitDesktopPivot',
      {
        label: 'Desktop Pivot',
        step: DEFAULT_VECTOR_STEP,
        value: toVectorObject(
          normalizedCamera.orbit.desktop.pivot,
          normalizedCamera.orbit.desktop.pivot
        ),
      },
      controlOverrides
    ),
    orbitDesktopFov: applyControlOverride(
      'orbitDesktopFov',
      {
        label: 'Desktop FOV',
        max: 120,
        min: 5,
        step: 1,
        value: normalizedCamera.orbit.desktop.fov,
      },
      controlOverrides
    ),
    orbitMobilePosition: applyControlOverride(
      'orbitMobilePosition',
      {
        label: 'Mobile Position',
        step: DEFAULT_VECTOR_STEP,
        value: toVectorObject(
          normalizedCamera.orbit.mobile.position,
          normalizedCamera.orbit.mobile.position
        ),
      },
      controlOverrides
    ),
    orbitMobileTarget: applyControlOverride(
      'orbitMobileTarget',
      {
        label: 'Mobile Target',
        step: DEFAULT_VECTOR_STEP,
        value: toVectorObject(
          normalizedCamera.orbit.mobile.target,
          normalizedCamera.orbit.mobile.target
        ),
      },
      controlOverrides
    ),
    orbitMobilePivot: applyControlOverride(
      'orbitMobilePivot',
      {
        label: 'Mobile Pivot',
        step: DEFAULT_VECTOR_STEP,
        value: toVectorObject(
          normalizedCamera.orbit.mobile.pivot,
          normalizedCamera.orbit.mobile.pivot
        ),
      },
      controlOverrides
    ),
    orbitMobileFov: applyControlOverride(
      'orbitMobileFov',
      {
        label: 'Mobile FOV',
        max: 120,
        min: 5,
        step: 1,
        value: normalizedCamera.orbit.mobile.fov,
      },
      controlOverrides
    ),
    ...(orbitAdditionalControls ?? {}),
  };

  const splineControls = {
    splinePreset: applyControlOverride(
      'splinePreset',
      {
        label: 'Path',
        options: normalizedCamera.spline.presetOptions,
        value: normalizedCamera.spline.preset,
      },
      controlOverrides
    ),
    splineDesktopTarget: applyControlOverride(
      'splineDesktopTarget',
      {
        label: 'Desktop Target',
        step: DEFAULT_VECTOR_STEP,
        value: toVectorObject(
          normalizedCamera.spline.desktop.target,
          normalizedCamera.spline.desktop.target
        ),
      },
      controlOverrides
    ),
    splineDesktopFov: applyControlOverride(
      'splineDesktopFov',
      {
        label: 'Desktop FOV',
        max: 120,
        min: 5,
        step: 1,
        value: normalizedCamera.spline.desktop.fov,
      },
      controlOverrides
    ),
    splineMobileTarget: applyControlOverride(
      'splineMobileTarget',
      {
        label: 'Mobile Target',
        step: DEFAULT_VECTOR_STEP,
        value: toVectorObject(
          normalizedCamera.spline.mobile.target,
          normalizedCamera.spline.mobile.target
        ),
      },
      controlOverrides
    ),
    splineMobileFov: applyControlOverride(
      'splineMobileFov',
      {
        label: 'Mobile FOV',
        max: 120,
        min: 5,
        step: 1,
        value: normalizedCamera.spline.mobile.fov,
      },
      controlOverrides
    ),
    splineOrientationMode: applyControlOverride(
      'splineOrientationMode',
      {
        label: 'Orientation',
        options: SCENE_CAMERA_SPLINE_ORIENTATION_OPTIONS,
        value: normalizedCamera.spline.orientationMode,
      },
      controlOverrides
    ),
    splineForwardDistance: applyControlOverride(
      'splineForwardDistance',
      {
        label: 'Forward Distance',
        max: 20,
        min: 0.1,
        render: splineForwardRender,
        step: 0.1,
        value: normalizedCamera.spline.forwardDistance,
      },
      controlOverrides
    ),
    splinePosition: applyControlOverride(
      'splinePosition',
      {
        label: 'Position',
        step: DEFAULT_VECTOR_STEP,
        value: toVectorObject(
          normalizedCamera.spline.position,
          normalizedCamera.spline.position
        ),
      },
      controlOverrides
    ),
    splineScale: applyControlOverride(
      'splineScale',
      {
        label: 'Scale',
        min: 0.1,
        step: DEFAULT_VECTOR_STEP,
        value: toVectorObject(
          normalizedCamera.spline.scale,
          normalizedCamera.spline.scale
        ),
      },
      controlOverrides
    ),
    splineDuration: applyControlOverride(
      'splineDuration',
      {
        label: 'Loop Duration',
        max: 240,
        min: 1,
        step: 1,
        value: normalizedCamera.spline.duration,
      },
      controlOverrides
    ),
    splineTension: applyControlOverride(
      'splineTension',
      {
        label: 'Curve Tension',
        max: 1,
        min: 0,
        step: 0.01,
        value: normalizedCamera.spline.tension,
      },
      controlOverrides
    ),
    splineClosed: applyControlOverride(
      'splineClosed',
      {
        label: 'Closed',
        value: normalizedCamera.spline.closed,
      },
      controlOverrides
    ),
    splineShowPath: applyControlOverride(
      'splineShowPath',
      {
        label: 'Show Path',
        value: normalizedCamera.spline.showPath,
      },
      controlOverrides
    ),
    ...(splineAdditionalControls ?? {}),
  };

  const operatorControls = {
    operatorMoveSpeed: applyControlOverride(
      'operatorMoveSpeed',
      {
        label: 'Move Speed',
        max: 40,
        min: 0.5,
        step: 0.1,
        value: normalizedCamera.operator.moveSpeed,
      },
      controlOverrides
    ),
    operatorLiftSpeed: applyControlOverride(
      'operatorLiftSpeed',
      {
        label: 'Lift Speed',
        max: 40,
        min: 0.5,
        step: 0.1,
        value: normalizedCamera.operator.liftSpeed,
      },
      controlOverrides
    ),
    operatorBoostMultiplier: applyControlOverride(
      'operatorBoostMultiplier',
      {
        label: 'Boost Multiplier',
        max: 8,
        min: 1,
        step: 0.1,
        value: normalizedCamera.operator.boostMultiplier,
      },
      controlOverrides
    ),
    operatorPointerLookSensitivity: applyControlOverride(
      'operatorPointerLookSensitivity',
      {
        label: 'Pointer Look',
        max: 0.02,
        min: 0.0005,
        step: 0.0001,
        value: normalizedCamera.operator.pointerLookSensitivity,
      },
      controlOverrides
    ),
    operatorStickLookSpeed: applyControlOverride(
      'operatorStickLookSpeed',
      {
        label: 'Stick Look',
        max: 15,
        min: 0.1,
        step: 0.1,
        value: normalizedCamera.operator.stickLookSpeed,
      },
      controlOverrides
    ),
    operatorZoomSpeed: applyControlOverride(
      'operatorZoomSpeed',
      {
        label: 'Zoom Speed',
        max: 120,
        min: 1,
        step: 0.5,
        value: normalizedCamera.operator.zoomSpeed,
      },
      controlOverrides
    ),
    operatorMinFov: applyControlOverride(
      'operatorMinFov',
      {
        label: 'Min FOV',
        max: 90,
        min: 5,
        step: 1,
        value: normalizedCamera.operator.minFov,
      },
      controlOverrides
    ),
    operatorMaxFov: applyControlOverride(
      'operatorMaxFov',
      {
        label: 'Max FOV',
        max: 120,
        min: 5,
        step: 1,
        value: normalizedCamera.operator.maxFov,
      },
      controlOverrides
    ),
    ...(operatorAdditionalControls ?? {}),
  };

  return {
    cameraMode: applyControlOverride(
      'cameraMode',
      {
        label: 'Mode',
        options: SCENE_CAMERA_MODE_OPTIONS,
        value: normalizedCamera.defaultMode,
      },
      controlOverrides
    ),
    cameraAutoFit: applyControlOverride(
      'cameraAutoFit',
      {
        label: 'Camera Auto-Fit',
        value: normalizedCamera.cameraAutoFit,
      },
      controlOverrides
    ),
    ...(includeClipPlaneControls
      ? {
          cameraNear: applyControlOverride(
            'cameraNear',
            {
              label: 'Near',
              max: 100,
              min: 0.001,
              step: 0.001,
              value: normalizedCamera.near,
            },
            controlOverrides
          ),
          cameraFar: applyControlOverride(
            'cameraFar',
            {
              label: 'Far',
              max: 10000,
              min: 1,
              step: 1,
              value: normalizedCamera.far,
            },
            controlOverrides
          ),
        }
      : {}),
    ...(additionalControls ?? {}),
    ...(canCopyCurrentCamera
      ? {
          [copyCurrentCameraKey]: button(async () => {
            await copyCurrentCameraSnapshot({
              apiRef,
              camera: normalizedCamera,
              controlsSnapshotRef,
              copyCurrentCameraOptions,
              includeClipPlaneControls,
            });
          }),
        }
      : {}),
    ...buildCameraSection('Fixed', fixedControls, {
      ...fixedFolderOptions,
      ...(fixedFolderRender ? { render: fixedFolderRender } : {}),
    }),
    ...buildCameraSection('Orbit', orbitControls, {
      ...orbitFolderOptions,
      ...(orbitFolderRender ? { render: orbitFolderRender } : {}),
    }),
    ...buildCameraSection('Spline', splineControls, {
      ...splineFolderOptions,
      ...(splineFolderRender ? { render: splineFolderRender } : {}),
    }),
    ...buildCameraSection('Operator', operatorControls, {
      ...operatorFolderOptions,
      ...(operatorFolderRender ? { render: operatorFolderRender } : {}),
    }),
  };
}
