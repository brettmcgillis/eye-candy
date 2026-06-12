/* eslint-disable no-nested-ternary */
import * as THREE from 'three';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useFrame } from '@react-three/fiber';

import useCameraFitToViewport from './useCameraFitToViewport';
import useCameraSpline from './useCameraSpline';
import useOperatorFreeCamera from './useOperatorFreeCamera';
import useOperatorInput from './useOperatorInput';
import useOrbitGamepadControls from './useOrbitGamepadControls';

const DEFAULT_MODE = 'fixed';
const DEFAULT_CAMERA_POSITION = Object.freeze([0, 0, 5]);
const DEFAULT_CAMERA_TARGET = Object.freeze([0, 0, 0]);
const DEFAULT_FOV = 50;
const DEFAULT_NEAR = 0.1;
const DEFAULT_FAR = 1000;
const DEFAULT_FIXED_SHOT_ID = 'default';
const DEFAULT_FIXED_SEQUENCE_INTERVAL_SECONDS = 5;
const DEFAULT_SPLINE_DURATION = 30;
const DEFAULT_SPLINE_TENSION = 0.5;
const DEFAULT_SPLINE_CLOSED = true;
const DEFAULT_SPLINE_FORWARD_DISTANCE = 1;
const DEFAULT_CAPTURE_TARGET_DISTANCE = 5;
const DEFAULT_CAPTURE_DECIMALS = 4;
const DEFAULT_OPERATOR_SPEED_SCALE_REFERENCE = 100;
const DEFAULT_OPERATOR_SPEED_SCALE_MIN_MULTIPLIER = 0.75;
const DEFAULT_OPERATOR_SPEED_SCALE_MAX_MULTIPLIER = 6;
const DEFAULT_OPERATOR_CAMERA = Object.freeze({
  moveSpeed: 6,
  liftSpeed: 6,
  boostMultiplier: 2,
  pointerLookSensitivity: 0.003,
  stickLookSpeed: 2.5,
  zoomSpeed: 24,
  minFov: 20,
  maxFov: 80,
});

function toFiniteNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function toPositiveNumber(value, fallback) {
  const normalized = toFiniteNumber(value, fallback);
  return normalized > 0 ? normalized : fallback;
}

function toVectorTuple(value, fallback) {
  if (Array.isArray(value)) {
    return [
      toFiniteNumber(value[0], fallback[0]),
      toFiniteNumber(value[1], fallback[1]),
      toFiniteNumber(value[2], fallback[2]),
    ];
  }

  if (value && typeof value === 'object') {
    return [
      toFiniteNumber(value.x, fallback[0]),
      toFiniteNumber(value.y, fallback[1]),
      toFiniteNumber(value.z, fallback[2]),
    ];
  }

  return [...fallback];
}

function toVector3(value, fallback) {
  const tuple = toVectorTuple(value, fallback);
  return new THREE.Vector3(tuple[0], tuple[1], tuple[2]);
}

function toRoundedNumber(value, decimals = DEFAULT_CAPTURE_DECIMALS) {
  const factor = 10 ** decimals;
  const rounded = Math.round(toFiniteNumber(value, 0) * factor) / factor;

  return Object.is(rounded, -0) ? 0 : rounded;
}

function toRoundedTuple(value, fallback = DEFAULT_CAMERA_TARGET) {
  const tuple = toVectorTuple(value, fallback);

  return tuple.map((entry) => toRoundedNumber(entry));
}

function toObjectLiteral(snapshot) {
  return JSON.stringify(snapshot, null, 2).replace(
    /"([A-Za-z_$][A-Za-z0-9_$]*)":/g,
    '$1:'
  );
}

function normalizeMode(value) {
  const normalized = `${value ?? DEFAULT_MODE}`.trim().toLowerCase();

  switch (normalized) {
    case 'fixed':
    case 'orbit':
    case 'operator':
    case 'spline':
      return normalized;
    case 'spline motion':
      return 'spline';
    default:
      return DEFAULT_MODE;
  }
}

function normalizeFrame(value, fallback = {}) {
  const fallbackPosition = fallback.position ?? DEFAULT_CAMERA_POSITION;
  const fallbackTarget = fallback.target ?? DEFAULT_CAMERA_TARGET;
  const fallbackPivot = fallback.pivot ?? fallbackTarget;
  const fallbackFov = fallback.fov ?? DEFAULT_FOV;

  return {
    position: toVectorTuple(value?.position, fallbackPosition),
    target: toVectorTuple(value?.target, fallbackTarget),
    pivot: toVectorTuple(value?.pivot, value?.target ?? fallbackPivot),
    fov: toFiniteNumber(value?.fov, fallbackFov),
  };
}

function toResponsiveCameraConfig(value, fallback = {}) {
  const desktop = normalizeFrame(value?.desktop ?? value, fallback);
  const mobile = normalizeFrame(
    value?.mobile ?? value?.desktop ?? value,
    desktop
  );

  return {
    desktopPosition: desktop.position,
    desktopTarget: desktop.target,
    desktopFov: desktop.fov,
    mobilePosition: mobile.position,
    mobileTarget: mobile.target,
    mobileFov: mobile.fov,
  };
}

function getResponsiveFrame(config, isPortrait, fallback = {}) {
  const desktop = config?.desktop ?? config ?? {};
  const mobile = config?.mobile ?? desktop;

  return normalizeFrame(isPortrait ? mobile : desktop, fallback);
}

function normalizeSplinePoints(points = []) {
  return points.map((point) => {
    const position =
      point?.position instanceof THREE.Vector3
        ? point.position.clone()
        : toVector3(point?.position, DEFAULT_CAMERA_TARGET);

    if (point?.lookAt === undefined || point?.lookAt === null) {
      return { position };
    }

    const lookAt =
      point.lookAt instanceof THREE.Vector3
        ? point.lookAt.clone()
        : toVector3(point.lookAt, DEFAULT_CAMERA_TARGET);

    return {
      position,
      lookAt,
    };
  });
}

function normalizeOperatorSpeedScale(config = {}) {
  const source =
    Number.isFinite(config) || typeof config === 'number'
      ? { worldScale: config }
      : config && typeof config === 'object'
        ? config
        : {};

  const worldScale = toPositiveNumber(source.worldScale, 1);
  const referenceScale = toPositiveNumber(
    source.referenceScale,
    DEFAULT_OPERATOR_SPEED_SCALE_REFERENCE
  );
  const minMultiplier = toPositiveNumber(
    source.minMultiplier,
    DEFAULT_OPERATOR_SPEED_SCALE_MIN_MULTIPLIER
  );
  const maxMultiplier = toPositiveNumber(
    source.maxMultiplier,
    DEFAULT_OPERATOR_SPEED_SCALE_MAX_MULTIPLIER
  );

  return {
    minMultiplier: Math.min(minMultiplier, maxMultiplier),
    maxMultiplier: Math.max(minMultiplier, maxMultiplier),
    referenceScale,
    worldScale,
  };
}

function getScaledOperatorDefaults(scaleConfig) {
  const rawMultiplier = scaleConfig.worldScale / scaleConfig.referenceScale;
  const speedMultiplier = THREE.MathUtils.clamp(
    rawMultiplier,
    scaleConfig.minMultiplier,
    scaleConfig.maxMultiplier
  );

  return {
    ...DEFAULT_OPERATOR_CAMERA,
    moveSpeed: DEFAULT_OPERATOR_CAMERA.moveSpeed * speedMultiplier,
    liftSpeed: DEFAULT_OPERATOR_CAMERA.liftSpeed * speedMultiplier,
  };
}

function normalizeOperatorCamera(
  config = {},
  defaults = DEFAULT_OPERATOR_CAMERA
) {
  const minFov = toFiniteNumber(config.minFov, defaults.minFov);
  const maxFov = toFiniteNumber(config.maxFov, defaults.maxFov);

  return {
    moveSpeed: toFiniteNumber(config.moveSpeed, defaults.moveSpeed),
    liftSpeed: toFiniteNumber(config.liftSpeed, defaults.liftSpeed),
    boostMultiplier: toFiniteNumber(
      config.boostMultiplier,
      defaults.boostMultiplier
    ),
    pointerLookSensitivity: toFiniteNumber(
      config.pointerLookSensitivity,
      defaults.pointerLookSensitivity
    ),
    stickLookSpeed: toFiniteNumber(
      config.stickLookSpeed,
      defaults.stickLookSpeed
    ),
    zoomSpeed: toFiniteNumber(config.zoomSpeed, defaults.zoomSpeed),
    minFov: Math.min(minFov, maxFov),
    maxFov: Math.max(minFov, maxFov),
  };
}

function normalizeSplineOrientationMode(value, points = []) {
  const normalized = `${value ?? ''}`.trim().toLowerCase();

  if (
    normalized === 'target' ||
    normalized === 'authored' ||
    normalized === 'forward'
  ) {
    return normalized;
  }

  return points.some((point) => point?.lookAt instanceof THREE.Vector3)
    ? 'authored'
    : 'target';
}

function normalizeFixedShots(config = {}) {
  if (Array.isArray(config?.shots)) {
    return config.shots.map((shot, index) => ({
      id: `${shot?.id ?? `${DEFAULT_FIXED_SHOT_ID}-${index + 1}`}`,
      declaration: shot ?? {},
    }));
  }

  if (config?.shots && typeof config.shots === 'object') {
    return Object.entries(config.shots).map(([id, declaration]) => ({
      id,
      declaration: declaration ?? {},
    }));
  }

  return [
    {
      id: `${config?.id ?? DEFAULT_FIXED_SHOT_ID}`,
      declaration: config,
    },
  ];
}

function normalizeFixedBehavior(value) {
  return `${value ?? 'single'}`.trim().toLowerCase() === 'sequence'
    ? 'sequence'
    : 'single';
}

function normalizeFixedCamera(config = {}) {
  const shots = normalizeFixedShots(config);
  const shotIds = shots.map((shot) => shot.id);
  const shotMap = Object.fromEntries(
    shots.map((shot) => [shot.id, shot.declaration])
  );
  const sequenceOrder = (
    Array.isArray(config.sequenceOrder) ? config.sequenceOrder : shotIds
  ).filter((id) => shotMap[id]);
  const requestedActiveShotId = shotMap[config.activeShot]
    ? config.activeShot
    : (shotIds[0] ?? DEFAULT_FIXED_SHOT_ID);

  return {
    activeShotId: requestedActiveShotId,
    behavior: normalizeFixedBehavior(config.behavior),
    sequenceIntervalSeconds: toPositiveNumber(
      config.sequenceIntervalSeconds,
      DEFAULT_FIXED_SEQUENCE_INTERVAL_SECONDS
    ),
    sequenceOrder: sequenceOrder.length ? sequenceOrder : shotIds,
    shotIds,
    shotMap,
  };
}

function getSequenceStartIndex(fixedCamera) {
  const startIndex = fixedCamera.sequenceOrder.indexOf(
    fixedCamera.activeShotId
  );
  return startIndex === -1 ? 0 : startIndex;
}

function resolveCaptureTargetDistance(
  cameraNode,
  fallbackTarget,
  requestedDistance
) {
  if (Number.isFinite(requestedDistance) && requestedDistance > 0) {
    return requestedDistance;
  }

  if (cameraNode) {
    const fallbackTargetVector = toVector3(
      fallbackTarget,
      DEFAULT_CAMERA_TARGET
    );
    const distance = cameraNode.position.distanceTo(fallbackTargetVector);

    if (Number.isFinite(distance) && distance > 0) {
      return distance;
    }
  }

  return DEFAULT_CAPTURE_TARGET_DISTANCE;
}

function getCaptureViewportKeys(viewport, isPortrait) {
  switch (`${viewport ?? 'both'}`.trim().toLowerCase()) {
    case 'desktop':
      return ['desktop'];
    case 'mobile':
      return ['mobile'];
    case 'current':
      return [isPortrait ? 'mobile' : 'desktop'];
    case 'both':
    default:
      return ['desktop', 'mobile'];
  }
}

function resolveCaptureMode(currentMode, requestedMode) {
  const normalizedRequestedMode = `${requestedMode ?? 'current'}`
    .trim()
    .toLowerCase();

  if (!normalizedRequestedMode || normalizedRequestedMode === 'current') {
    return currentMode === 'operator' ? 'fixed' : currentMode;
  }

  if (normalizedRequestedMode === 'operator') {
    return 'fixed';
  }

  return normalizeMode(normalizedRequestedMode);
}

export default function useSceneCamera({
  camera,
  actions,
  orbitAutoFitFrame,
  operatorInputOptions,
  orbitControlsProps = {},
  orbitInteractionEnabled = true,
  shouldBlockPointerLook,
} = {}) {
  const [cameraNode, setCameraNode] = useState(null);
  const [controlsNode, setControlsNode] = useState(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);

  const mode = normalizeMode(
    camera?.mode ?? camera?.cameraMode ?? camera?.defaultMode
  );
  const isFixedMode = mode === 'fixed';
  const isOrbitMode = mode === 'orbit';
  const isOperatorMode = mode === 'operator';
  const isSplineMode = mode === 'spline';
  const cameraAutoFit = camera?.autoFit ?? camera?.cameraAutoFit ?? true;
  const operatorSpeedScale = normalizeOperatorSpeedScale(
    camera?.operatorSpeedScale
  );
  const operatorDefaults = useMemo(() => {
    return getScaledOperatorDefaults(operatorSpeedScale);
  }, [operatorSpeedScale]);
  const operatorCamera = useMemo(() => {
    return normalizeOperatorCamera(camera?.operator, operatorDefaults);
  }, [camera?.operator, operatorDefaults]);
  const near = toFiniteNumber(camera?.near, DEFAULT_NEAR);
  const far = toFiniteNumber(camera?.far, DEFAULT_FAR);
  const fixedCamera = useMemo(() => {
    return normalizeFixedCamera(camera?.fixed ?? {});
  }, [camera?.fixed]);
  const fixedSequenceOrderKey = useMemo(() => {
    return fixedCamera.sequenceOrder.join('|');
  }, [fixedCamera.sequenceOrder]);
  const [fixedSequenceIndex, setFixedSequenceIndex] = useState(() => {
    return getSequenceStartIndex(fixedCamera);
  });

  useEffect(() => {
    setFixedSequenceIndex(getSequenceStartIndex(fixedCamera));
  }, [fixedCamera.activeShotId, fixedCamera.behavior, fixedSequenceOrderKey]);

  useEffect(() => {
    if (
      !isFixedMode ||
      fixedCamera.behavior !== 'sequence' ||
      fixedCamera.sequenceOrder.length < 2
    ) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setFixedSequenceIndex((previousIndex) => {
        return (previousIndex + 1) % fixedCamera.sequenceOrder.length;
      });
    }, fixedCamera.sequenceIntervalSeconds * 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    fixedCamera.behavior,
    fixedCamera.sequenceIntervalSeconds,
    fixedCamera.sequenceOrder.length,
    fixedSequenceOrderKey,
    isFixedMode,
  ]);

  const activeFixedShotId =
    fixedCamera.behavior === 'sequence'
      ? (fixedCamera.sequenceOrder[fixedSequenceIndex] ??
        fixedCamera.activeShotId)
      : fixedCamera.activeShotId;
  const activeFixedShot =
    fixedCamera.shotMap[activeFixedShotId] ??
    fixedCamera.shotMap[fixedCamera.shotIds[0]] ??
    {};

  const fixedCameraConfig = useMemo(() => {
    return toResponsiveCameraConfig(activeFixedShot, {
      fov: DEFAULT_FOV,
      position: DEFAULT_CAMERA_POSITION,
      target: DEFAULT_CAMERA_TARGET,
    });
  }, [activeFixedShot]);

  const {
    cameraFov: fixedCameraFov,
    cameraPosition: fixedCameraPosition,
    cameraTarget: fixedCameraTarget,
    isPortrait,
  } = useCameraFitToViewport(fixedCameraConfig);

  const fixedFrame = useMemo(() => {
    return {
      position: fixedCameraPosition,
      target: fixedCameraTarget,
      pivot: fixedCameraTarget,
      fov: fixedCameraFov,
    };
  }, [fixedCameraFov, fixedCameraPosition, fixedCameraTarget]);

  const manualOrbitFrame = useMemo(() => {
    return getResponsiveFrame(camera?.orbit, isPortrait, {
      position: fixedFrame.position,
      target: fixedFrame.target,
      pivot: fixedFrame.target,
      fov: fixedFrame.fov,
    });
  }, [camera, fixedFrame, isPortrait]);

  const activeOrbitFrame = useMemo(() => {
    if (!cameraAutoFit || !orbitAutoFitFrame) {
      return manualOrbitFrame;
    }

    return normalizeFrame(orbitAutoFitFrame, manualOrbitFrame);
  }, [cameraAutoFit, manualOrbitFrame, orbitAutoFitFrame]);

  const splineFrame = useMemo(() => {
    return getResponsiveFrame(camera?.spline, isPortrait, {
      position: fixedFrame.position,
      target: fixedFrame.target,
      pivot: fixedFrame.target,
      fov: fixedFrame.fov,
    });
  }, [camera, fixedFrame, isPortrait]);

  const splinePoints = useMemo(() => {
    return normalizeSplinePoints(camera?.spline?.points);
  }, [camera]);
  const splineOrientationMode = useMemo(() => {
    return normalizeSplineOrientationMode(
      camera?.spline?.orientationMode,
      splinePoints
    );
  }, [camera?.spline?.orientationMode, splinePoints]);
  const splineForwardDistance = toPositiveNumber(
    camera?.spline?.forwardDistance,
    DEFAULT_SPLINE_FORWARD_DISTANCE
  );

  const splineDuration = toFiniteNumber(
    camera?.spline?.duration,
    DEFAULT_SPLINE_DURATION
  );
  const splineTension = toFiniteNumber(
    camera?.spline?.tension,
    DEFAULT_SPLINE_TENSION
  );
  const splineClosed = camera?.spline?.closed ?? DEFAULT_SPLINE_CLOSED;
  const splineShowPath = !!camera?.spline?.showPath;
  const splineStartPosition = useMemo(() => {
    return splinePoints[0]?.position?.toArray?.() ?? fixedFrame.position;
  }, [fixedFrame.position, splinePoints]);

  const initialFrame = useMemo(() => {
    if (isOrbitMode) {
      return activeOrbitFrame;
    }

    if (isSplineMode) {
      return {
        position: splineStartPosition,
        target: splineFrame.target,
        pivot: splineFrame.target,
        fov: splineFrame.fov,
      };
    }

    return fixedFrame;
  }, [
    activeOrbitFrame,
    fixedFrame,
    isOrbitMode,
    isSplineMode,
    splineFrame.fov,
    splineFrame.target,
    splineStartPosition,
  ]);

  const orbitInteractionActive = isOrbitMode && orbitInteractionEnabled;
  const hasActions = !!(actions?.action1 || actions?.action2);
  const resolvedOrbitControlsProps = useMemo(() => {
    const enablePan = orbitControlsProps.enablePan ?? true;
    const enableRotate = orbitControlsProps.enableRotate ?? true;
    const enableZoom = orbitControlsProps.enableZoom ?? true;
    const autoRotate =
      orbitControlsProps.autoRotate ??
      orbitControlsProps.enableAutoRotate ??
      camera?.orbit?.autoRotate ??
      camera?.orbit?.enableAutoRotate ??
      false;
    const autoRotateSpeed = toFiniteNumber(
      orbitControlsProps.autoRotateSpeed ?? camera?.orbit?.autoRotateSpeed,
      2
    );

    return {
      ...orbitControlsProps,
      target: isOrbitMode ? activeOrbitFrame.pivot : fixedFrame.target,
      enabled: orbitInteractionActive,
      enablePan: orbitInteractionActive && enablePan,
      enableRotate: orbitInteractionActive && enableRotate,
      enableZoom: orbitInteractionActive && enableZoom,
      autoRotate: orbitInteractionActive && autoRotate,
      autoRotateSpeed,
    };
  }, [
    activeOrbitFrame.pivot,
    fixedFrame.target,
    camera?.orbit,
    isOrbitMode,
    orbitControlsProps,
    orbitInteractionActive,
  ]);

  const actionHandlers = useMemo(
    () => ({
      action1: actions?.action1 ?? null,
      action2: actions?.action2 ?? null,
    }),
    [actions?.action1, actions?.action2]
  );
  const sharedInputEnabled =
    isOperatorMode || orbitInteractionActive || hasActions;
  const sharedInputRef = useOperatorInput({
    ...operatorInputOptions,
    enabled: sharedInputEnabled,
  });

  useFrame(() => {
    if (!hasActions) {
      return;
    }

    const input = sharedInputRef.current;

    if (!input) {
      return;
    }

    if (input.action1 && actionHandlers.action1) {
      actionHandlers.action1();
    }

    if (input.action2 && actionHandlers.action2) {
      actionHandlers.action2();
    }
  });

  useOperatorFreeCamera({
    config: operatorCamera,
    enabled: isOperatorMode,
    inputRef: sharedInputRef,
    shouldBlockPointerLook,
  });

  useOrbitGamepadControls({
    controlsRef,
    enabled: orbitInteractionActive,
    inputRef: sharedInputRef,
  });

  useCameraSpline({
    cameraRef,
    closed: splineClosed,
    duration: splineDuration,
    enabled: isSplineMode,
    forwardDistance: splineForwardDistance,
    lookAt: splineFrame.target,
    orientationMode: splineOrientationMode,
    points: splinePoints,
    tension: splineTension,
  });

  useLayoutEffect(() => {
    if (!cameraNode) {
      return;
    }

    cameraNode.near = near;
    cameraNode.far = far;
    cameraNode.updateProjectionMatrix();
  }, [cameraNode, far, near]);

  useLayoutEffect(() => {
    if (!cameraNode || isOperatorMode || isSplineMode) {
      return;
    }

    const nextFrame = isOrbitMode ? activeOrbitFrame : fixedFrame;

    cameraNode.position.set(...nextFrame.position);
    cameraNode.fov = nextFrame.fov;
    cameraNode.updateProjectionMatrix();

    if (!controlsNode) {
      cameraNode.lookAt(...nextFrame.target);
      return;
    }

    controlsNode.target.set(
      ...(isOrbitMode ? activeOrbitFrame.pivot : fixedFrame.target)
    );
    controlsNode.update();
  }, [
    activeOrbitFrame,
    cameraNode,
    controlsNode,
    fixedFrame,
    isOperatorMode,
    isOrbitMode,
    isSplineMode,
  ]);

  useLayoutEffect(() => {
    if (!cameraNode || !isSplineMode) {
      return;
    }

    cameraNode.fov = splineFrame.fov;
    cameraNode.updateProjectionMatrix();
  }, [cameraNode, isSplineMode, splineFrame.fov]);

  const handleCameraRef = useCallback((node) => {
    cameraRef.current = node;
    setCameraNode(node);
  }, []);

  const handleControlsRef = useCallback((node) => {
    controlsRef.current = node;
    setControlsNode(node);
  }, []);

  const captureCurrentCameraFrame = useCallback(
    (options = {}) => {
      if (!cameraNode) {
        return null;
      }

      const {
        fallbackTarget: requestedFallbackTarget,
        targetDistance: requestedTargetDistance,
      } = options;
      let fallbackTarget = requestedFallbackTarget;

      if (!fallbackTarget) {
        if (isOrbitMode) {
          fallbackTarget = activeOrbitFrame.target;
        } else if (isSplineMode) {
          fallbackTarget = splineFrame.target;
        } else {
          fallbackTarget = fixedFrame.target;
        }
      }

      const targetDistance = resolveCaptureTargetDistance(
        cameraNode,
        fallbackTarget,
        requestedTargetDistance
      );
      const position = toRoundedTuple(
        cameraNode.position.toArray(),
        DEFAULT_CAMERA_POSITION
      );
      let target = null;
      let pivot = null;

      if (controlsNode?.target instanceof THREE.Vector3) {
        target = toRoundedTuple(controlsNode.target.toArray(), fallbackTarget);
        pivot = [...target];
      } else {
        const forward = new THREE.Vector3();

        cameraNode.getWorldDirection(forward);

        if (!Number.isFinite(forward.lengthSq()) || forward.lengthSq() <= 0) {
          forward.set(0, 0, -1);
        }

        const derivedTarget = cameraNode.position
          .clone()
          .add(forward.normalize().multiplyScalar(targetDistance));

        target = toRoundedTuple(derivedTarget.toArray(), fallbackTarget);
        pivot = [...target];
      }

      return {
        activeFixedShotId,
        fov: toRoundedNumber(cameraNode.fov),
        mode,
        pivot,
        position,
        target,
        viewport: isPortrait ? 'mobile' : 'desktop',
      };
    },
    [
      activeFixedShotId,
      activeOrbitFrame.target,
      cameraNode,
      controlsNode,
      fixedFrame.target,
      isOrbitMode,
      isPortrait,
      isSplineMode,
      mode,
      splineFrame.target,
    ]
  );

  const getCurrentCameraConfigSnapshot = useCallback(
    (options = {}) => {
      const capturedFrame = captureCurrentCameraFrame(options);

      if (!capturedFrame) {
        return null;
      }

      const captureMode = resolveCaptureMode(mode, options.mode);
      const viewportKeys = getCaptureViewportKeys(options.viewport, isPortrait);
      const responsiveFrame = Object.fromEntries(
        viewportKeys.map((viewportKey) => {
          if (captureMode === 'orbit') {
            return [
              viewportKey,
              {
                fov: capturedFrame.fov,
                pivot: [...capturedFrame.pivot],
                position: [...capturedFrame.position],
                target: [...capturedFrame.target],
              },
            ];
          }

          if (captureMode === 'spline') {
            return [
              viewportKey,
              {
                fov: capturedFrame.fov,
                target: [...capturedFrame.target],
              },
            ];
          }

          return [
            viewportKey,
            {
              fov: capturedFrame.fov,
              position: [...capturedFrame.position],
              target: [...capturedFrame.target],
            },
          ];
        })
      );

      if (captureMode === 'orbit') {
        return options.includeAutoFitToggle === false
          ? { orbit: responsiveFrame }
          : {
              cameraAutoFit: false,
              orbit: responsiveFrame,
            };
      }

      if (captureMode === 'spline') {
        return { spline: responsiveFrame };
      }

      if (
        options.includeFixedContext === false ||
        (fixedCamera.shotIds.length <= 1 &&
          activeFixedShotId ===
            (fixedCamera.shotIds[0] ?? DEFAULT_FIXED_SHOT_ID))
      ) {
        return { fixed: responsiveFrame };
      }

      return {
        fixed: {
          activeShot: activeFixedShotId,
          shots: {
            [activeFixedShotId]: responsiveFrame,
          },
        },
      };
    },
    [
      activeFixedShotId,
      captureCurrentCameraFrame,
      fixedCamera.shotIds,
      isPortrait,
      mode,
    ]
  );

  const copyCurrentCameraConfig = useCallback(
    async (options = {}) => {
      const snapshot = getCurrentCameraConfigSnapshot(options);

      if (!snapshot) {
        return null;
      }

      const serializedSnapshot = toObjectLiteral(snapshot);
      const clipboard = globalThis?.navigator?.clipboard;

      if (clipboard?.writeText) {
        await clipboard.writeText(serializedSnapshot);
      }

      return serializedSnapshot;
    },
    [getCurrentCameraConfigSnapshot]
  );

  return {
    activeFixedShotId,
    cameraNode,
    cameraRef,
    captureCurrentCameraFrame,
    copyCurrentCameraConfig,
    controlsNode,
    controlsRef,
    controlsProps: resolvedOrbitControlsProps,
    getCurrentCameraConfigSnapshot,
    handleCameraRef,
    handleControlsRef,
    isFixedMode,
    isFixedSequenceMode:
      isFixedMode &&
      fixedCamera.behavior === 'sequence' &&
      fixedCamera.sequenceOrder.length > 1,
    isOperatorMode,
    isOrbitAutoFitEnabled: isOrbitMode && cameraAutoFit && !!orbitAutoFitFrame,
    isOrbitMode,
    isPortrait,
    isSplineMode,
    splineClosed,
    splineOrientationMode,
    splinePoints,
    splineShowPath,
    splineTension,
    perspectiveCameraProps: {
      far,
      fov: initialFrame.fov,
      near,
      position: initialFrame.position,
    },
  };
}
