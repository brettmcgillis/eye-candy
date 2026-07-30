const DEFAULT_MODE = 'fixed';
const DEFAULT_CAMERA_POSITION = Object.freeze([0, 0, 5]);
const DEFAULT_CAMERA_TARGET = Object.freeze([0, 0, 0]);
const DEFAULT_CAMERA_SCALE = Object.freeze([1, 1, 1]);
const DEFAULT_FOV = 50;
const DEFAULT_NEAR = 0.1;
const DEFAULT_FAR = 1000;
const DEFAULT_FIXED_SHOT_ID = 'default';
const DEFAULT_FIXED_SEQUENCE_INTERVAL_SECONDS = 5;
const DEFAULT_ORBIT_AUTO_ROTATE = false;
const DEFAULT_ORBIT_AUTO_ROTATE_SPEED = 2;
const DEFAULT_ORBIT_ENABLE_PAN = true;
// Angle limits are authored/displayed in degrees (a Leva-friendly, human
// unit) and converted to radians only where OrbitControls actually consumes
// them, in buildSceneCameraRuntimeConfig. 0/180 and -180/180 are the full,
// unrestricted range, matching OrbitControls' own default behavior.
const DEFAULT_ORBIT_MIN_DISTANCE = 0;
const DEFAULT_ORBIT_MAX_DISTANCE = 100;
const DEFAULT_ORBIT_MAX_DISTANCE_UNLIMITED = true;
const DEFAULT_ORBIT_MIN_POLAR_ANGLE_DEG = 0;
const DEFAULT_ORBIT_MAX_POLAR_ANGLE_DEG = 180;
const DEFAULT_ORBIT_MIN_AZIMUTH_ANGLE_DEG = -180;
const DEFAULT_ORBIT_MAX_AZIMUTH_ANGLE_DEG = 180;
// OrbitControls' autoRotate never wraps theta — it just increments it every
// frame — so even a "full circle" +/-180deg clamp stops continuous rotation
// dead after one lap. Azimuth limits are opt-in (via orbitAzimuthUnlimited)
// so the unrestricted case gets a real +/-Infinity, not a +/-180deg wall.
const DEFAULT_ORBIT_AZIMUTH_UNLIMITED = true;
const DEFAULT_SPLINE_DURATION = 30;
const DEFAULT_SPLINE_TENSION = 0.5;
const DEFAULT_SPLINE_CLOSED = true;
const DEFAULT_SPLINE_FORWARD_DISTANCE = 1;
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

export const SCENE_CAMERA_MODE_OPTIONS = Object.freeze({
  Fixed: 'fixed',
  Orbit: 'orbit',
  Operator: 'operator',
  'Spline Motion': 'spline',
});

export const SCENE_CAMERA_FIXED_BEHAVIOR_OPTIONS = Object.freeze({
  Single: 'single',
  Sequence: 'sequence',
});

export const SCENE_CAMERA_SPLINE_ORIENTATION_OPTIONS = Object.freeze({
  Target: 'target',
  Authored: 'authored',
  Forward: 'forward',
});

// Every control key buildSceneCameraControls generates starts with one of
// these prefixes (cameraMode/cameraAutoFit/..., fixed*, orbit*, spline*,
// operator*), plus the scene-level 'preset' key.
const CAMERA_CONTROL_PREFIXES = Object.freeze([
  'camera',
  'fixed',
  'orbit',
  'spline',
  'operator',
]);

export function isCameraControlKey(key) {
  return (
    key === 'preset' ||
    CAMERA_CONTROL_PREFIXES.some((prefix) => key.startsWith(prefix))
  );
}

// Scene controls objects change identity on every Leva edit, so
// buildCamera(controls) can't be memoized on `controls` directly — any
// unrelated edit (lighting, materials, etc.) would rebuild the camera and
// snap an orbited/fixed view back to its default. Memoize buildCamera on
// this key instead: it only changes when a camera-relevant control changes.
export function getCameraControlsKey(controls = {}) {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(controls).filter(([key]) => isCameraControlKey(key))
    )
  );
}

// Builds a `controlOverrides`-shaped object (see buildSceneCameraControls)
// from a preset/controls snapshot's camera-prefixed keys, so the camera
// folder's Leva schema is seeded with the ACTIVE preset's camera values on
// first mount — not just the scene's static camera.js declaration. Without
// this, a preset's cameraMode/orbitAutoRotate/orbitDesktopPosition/etc. only
// take effect after pressing the presets folder's "reset" button (the only
// thing that explicitly re-applies them via Leva's setControls); on first
// load the camera folder silently falls back to camera.js's defaults while
// every other folder correctly starts from the preset. Keys absent from the
// snapshot are left alone, so scenes with no camera keys in their preset are
// unaffected.
export function buildCameraControlOverridesFromSnapshot(snapshot = {}) {
  const overrides = {};

  Object.keys(snapshot ?? {}).forEach((key) => {
    if (key !== 'preset' && isCameraControlKey(key)) {
      overrides[key] = { value: snapshot[key] };
    }
  });

  return overrides;
}

function cloneSnapshot(snapshot) {
  return JSON.parse(JSON.stringify(snapshot));
}

function toFiniteNumber(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
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

export function toVectorObject(value, fallback) {
  const [x, y, z] = toVectorTuple(value, fallback);

  return { x, y, z };
}

export function normalizeSceneCameraMode(value, fallback = DEFAULT_MODE) {
  const normalized = `${value ?? fallback}`.trim().toLowerCase();

  switch (normalized) {
    case 'fixed':
    case 'orbit':
    case 'operator':
    case 'spline':
      return normalized;
    case 'spline motion':
      return 'spline';
    default:
      return fallback;
  }
}

function normalizeFixedBehavior(value) {
  return `${value ?? 'single'}`.trim().toLowerCase() === 'sequence'
    ? 'sequence'
    : 'single';
}

function normalizeSplineOrientationMode(value) {
  const normalized = `${value ?? ''}`.trim().toLowerCase();

  if (
    normalized === 'target' ||
    normalized === 'authored' ||
    normalized === 'forward'
  ) {
    return normalized;
  }

  return 'target';
}

function formatObjectLiteral(snapshot) {
  return JSON.stringify(snapshot, null, 2).replace(
    /"([A-Za-z_$][A-Za-z0-9_$]*)":/g,
    '$1:'
  );
}

function toPascalCase(value, fallback = 'Default') {
  const segments = `${value ?? ''}`
    .split(/[^A-Za-z0-9]+/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!segments.length) {
    return fallback;
  }

  return segments
    .map((segment) => {
      return `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`;
    })
    .join('');
}

function formatShotLabel(shotId, index, totalShots) {
  if (totalShots === 1) {
    return 'Shot';
  }

  const normalized = `${shotId ?? ''}`.trim();

  if (!normalized) {
    return `Shot ${index + 1}`;
  }

  return normalized.replace(/[-_]+/g, ' ');
}

function resolveViewportFrameInput(value, viewport) {
  const viewportValue = value?.[viewport];

  if (viewportValue && typeof viewportValue === 'object') {
    return viewportValue;
  }

  if (viewport === 'mobile') {
    return {
      fov: value?.mobileFov ?? value?.desktopFov ?? value?.fov,
      pivot:
        value?.mobilePivot ??
        value?.desktopPivot ??
        value?.pivot ??
        value?.mobileTarget ??
        value?.desktopTarget ??
        value?.target,
      position:
        value?.mobilePosition ?? value?.desktopPosition ?? value?.position,
      target: value?.mobileTarget ?? value?.desktopTarget ?? value?.target,
    };
  }

  return {
    fov: value?.desktopFov ?? value?.fov,
    pivot:
      value?.desktopPivot ??
      value?.pivot ??
      value?.desktopTarget ??
      value?.target,
    position: value?.desktopPosition ?? value?.position,
    target: value?.desktopTarget ?? value?.target,
  };
}

function normalizeFixedFrame(value, fallback = {}) {
  return {
    fov: toFiniteNumber(value?.fov, fallback.fov ?? DEFAULT_FOV),
    position: toVectorTuple(
      value?.position,
      fallback.position ?? DEFAULT_CAMERA_POSITION
    ),
    target: toVectorTuple(
      value?.target,
      fallback.target ?? DEFAULT_CAMERA_TARGET
    ),
  };
}

function normalizeOrbitFrame(value, fallback = {}) {
  const fallbackTarget = fallback.target ?? DEFAULT_CAMERA_TARGET;

  return {
    fov: toFiniteNumber(value?.fov, fallback.fov ?? DEFAULT_FOV),
    pivot: toVectorTuple(value?.pivot, fallback.pivot ?? fallbackTarget),
    position: toVectorTuple(
      value?.position,
      fallback.position ?? DEFAULT_CAMERA_POSITION
    ),
    target: toVectorTuple(value?.target, fallbackTarget),
  };
}

function normalizeSplineFrame(value, fallback = {}) {
  return {
    fov: toFiniteNumber(value?.fov, fallback.fov ?? DEFAULT_FOV),
    target: toVectorTuple(
      value?.target,
      fallback.target ?? DEFAULT_CAMERA_TARGET
    ),
  };
}

function normalizeResponsiveFrames(value, fallback, frameNormalizer) {
  const desktop = frameNormalizer(
    resolveViewportFrameInput(value, 'desktop'),
    fallback
  );
  const mobile = frameNormalizer(
    resolveViewportFrameInput(value, 'mobile'),
    desktop
  );

  return {
    desktop,
    mobile,
  };
}

function normalizeFixedShots(config = {}) {
  if (Array.isArray(config?.shots)) {
    return config.shots.map((shot, index) => ({
      declaration: shot ?? {},
      id: `${shot?.id ?? `${DEFAULT_FIXED_SHOT_ID}-${index + 1}`}`,
    }));
  }

  if (config?.shots && typeof config.shots === 'object') {
    return Object.entries(config.shots).map(([id, declaration]) => ({
      declaration: declaration ?? {},
      id,
    }));
  }

  return [
    {
      declaration: config,
      id: `${config?.id ?? DEFAULT_FIXED_SHOT_ID}`,
    },
  ];
}

function getLegacyFixedConfig(camera = {}) {
  return {
    desktopFov: camera?.desktopFov,
    desktopPosition: camera?.desktopPosition,
    desktopTarget: camera?.desktopTarget,
    fov: camera?.fov,
    id: DEFAULT_FIXED_SHOT_ID,
    mobileFov: camera?.mobileFov,
    mobilePosition: camera?.mobilePosition,
    mobileTarget: camera?.mobileTarget,
    position: camera?.position,
    target: camera?.target,
  };
}

function normalizeFixedDeclaration(camera = {}) {
  const fixedSource = camera?.fixed;
  const source =
    fixedSource && Object.keys(fixedSource).length
      ? fixedSource
      : getLegacyFixedConfig(camera);
  const shots = normalizeFixedShots(source);
  const shotEntries = shots.map((shot) => {
    return [
      shot.id,
      normalizeResponsiveFrames(shot.declaration, {}, normalizeFixedFrame),
    ];
  });
  const shotIds = shotEntries.map(([shotId]) => shotId);
  const shotMap = Object.fromEntries(shotEntries);
  const requestedActiveShot =
    typeof source?.activeShot === 'string' ? source.activeShot : shotIds[0];
  const activeShot = shotMap[requestedActiveShot]
    ? requestedActiveShot
    : (shotIds[0] ?? DEFAULT_FIXED_SHOT_ID);
  const sequenceOrder = (
    Array.isArray(source?.sequenceOrder) ? source.sequenceOrder : shotIds
  ).filter((shotId) => shotMap[shotId]);

  return {
    activeShot,
    behavior: normalizeFixedBehavior(source?.behavior),
    sequenceIntervalSeconds: toPositiveNumber(
      source?.sequenceIntervalSeconds,
      DEFAULT_FIXED_SEQUENCE_INTERVAL_SECONDS
    ),
    sequenceOrder: sequenceOrder.length ? sequenceOrder : shotIds,
    shotIds,
    shots: shotMap,
  };
}

function normalizeSplinePathPoint(point) {
  if (
    Array.isArray(point) ||
    (point && typeof point === 'object' && point.x !== undefined)
  ) {
    return {
      position: toVectorTuple(point, DEFAULT_CAMERA_TARGET),
    };
  }

  const normalizedPoint = {
    position: toVectorTuple(point?.position, DEFAULT_CAMERA_TARGET),
  };

  if (point?.lookAt !== undefined && point?.lookAt !== null) {
    normalizedPoint.lookAt = toVectorTuple(point.lookAt, DEFAULT_CAMERA_TARGET);
  }

  return normalizedPoint;
}

function normalizeSplinePathDefinition(pathDefinition) {
  if (!pathDefinition) {
    return null;
  }

  if (Array.isArray(pathDefinition)) {
    return {
      points: pathDefinition.map((point) => normalizeSplinePathPoint(point)),
    };
  }

  const points = Array.isArray(pathDefinition.points)
    ? pathDefinition.points.map((point) => normalizeSplinePathPoint(point))
    : [];

  if (!points.length) {
    return null;
  }

  return {
    ...(pathDefinition.closed !== undefined
      ? { closed: !!pathDefinition.closed }
      : {}),
    ...(pathDefinition.tension !== undefined
      ? {
          tension: toFiniteNumber(
            pathDefinition.tension,
            DEFAULT_SPLINE_TENSION
          ),
        }
      : {}),
    points,
  };
}

function normalizeSplinePaths(paths) {
  if (!paths || typeof paths !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(paths)
      .map(([key, pathDefinition]) => {
        return [key, normalizeSplinePathDefinition(pathDefinition)];
      })
      .filter(([, pathDefinition]) => !!pathDefinition)
  );
}

function normalizeOrbitDeclaration(camera, fixedDeclaration) {
  const resolvedCamera = camera ?? {};
  const fixedFallback =
    fixedDeclaration.shots[fixedDeclaration.activeShot] ??
    fixedDeclaration.shots[fixedDeclaration.shotIds[0]] ??
    normalizeResponsiveFrames({}, {}, normalizeFixedFrame);
  const normalizedOrbitFrames = normalizeResponsiveFrames(
    resolvedCamera.orbit,
    {
      fov: fixedFallback.desktop.fov,
      pivot: fixedFallback.desktop.target,
      position: fixedFallback.desktop.position,
      target: fixedFallback.desktop.target,
    },
    normalizeOrbitFrame
  );

  return {
    ...normalizedOrbitFrames,
    autoRotate:
      resolvedCamera?.orbit?.autoRotate ??
      resolvedCamera?.orbit?.enableAutoRotate ??
      DEFAULT_ORBIT_AUTO_ROTATE,
    autoRotateSpeed: toFiniteNumber(
      resolvedCamera?.orbit?.autoRotateSpeed,
      DEFAULT_ORBIT_AUTO_ROTATE_SPEED
    ),
    enablePan: resolvedCamera?.orbit?.enablePan ?? DEFAULT_ORBIT_ENABLE_PAN,
    minDistance: toFiniteNumber(
      resolvedCamera?.orbit?.minDistance,
      DEFAULT_ORBIT_MIN_DISTANCE
    ),
    maxDistance: toFiniteNumber(
      resolvedCamera?.orbit?.maxDistance,
      DEFAULT_ORBIT_MAX_DISTANCE
    ),
    maxDistanceUnlimited:
      resolvedCamera?.orbit?.maxDistanceUnlimited ??
      DEFAULT_ORBIT_MAX_DISTANCE_UNLIMITED,
    minPolarAngle: toFiniteNumber(
      resolvedCamera?.orbit?.minPolarAngle,
      DEFAULT_ORBIT_MIN_POLAR_ANGLE_DEG
    ),
    maxPolarAngle: toFiniteNumber(
      resolvedCamera?.orbit?.maxPolarAngle,
      DEFAULT_ORBIT_MAX_POLAR_ANGLE_DEG
    ),
    minAzimuthAngle: toFiniteNumber(
      resolvedCamera?.orbit?.minAzimuthAngle,
      DEFAULT_ORBIT_MIN_AZIMUTH_ANGLE_DEG
    ),
    maxAzimuthAngle: toFiniteNumber(
      resolvedCamera?.orbit?.maxAzimuthAngle,
      DEFAULT_ORBIT_MAX_AZIMUTH_ANGLE_DEG
    ),
    azimuthUnlimited:
      resolvedCamera?.orbit?.azimuthUnlimited ??
      DEFAULT_ORBIT_AZIMUTH_UNLIMITED,
  };
}

function normalizeSplineDeclaration(camera, fixedDeclaration) {
  const splineConfig = camera?.spline ?? {};
  const fixedFallback =
    fixedDeclaration.shots[fixedDeclaration.activeShot] ??
    fixedDeclaration.shots[fixedDeclaration.shotIds[0]] ??
    normalizeResponsiveFrames({}, {}, normalizeFixedFrame);
  const paths = normalizeSplinePaths(splineConfig.paths);
  const presetOptions = Object.keys(paths);
  const requestedPreset =
    typeof splineConfig.preset === 'string' ? splineConfig.preset : null;
  const preset = paths[requestedPreset]
    ? requestedPreset
    : (presetOptions[0] ?? null);
  const selectedPath = preset ? paths[preset] : null;
  const path = normalizeSplinePathDefinition(
    splineConfig.path ?? splineConfig.points
  );

  return {
    closed:
      splineConfig.closed ?? selectedPath?.closed ?? DEFAULT_SPLINE_CLOSED,
    desktop: normalizeSplineFrame(
      resolveViewportFrameInput(splineConfig, 'desktop'),
      {
        fov: fixedFallback.desktop.fov,
        target: fixedFallback.desktop.target,
      }
    ),
    duration: toFiniteNumber(splineConfig.duration, DEFAULT_SPLINE_DURATION),
    forwardDistance: toPositiveNumber(
      splineConfig.forwardDistance,
      DEFAULT_SPLINE_FORWARD_DISTANCE
    ),
    mobile: normalizeSplineFrame(
      resolveViewportFrameInput(splineConfig, 'mobile'),
      {
        fov: fixedFallback.mobile.fov,
        target: fixedFallback.mobile.target,
      }
    ),
    orientationMode: normalizeSplineOrientationMode(
      splineConfig.orientationMode
    ),
    path,
    paths,
    position: toVectorTuple(splineConfig.position, DEFAULT_CAMERA_TARGET),
    preset,
    presetOptions,
    scale: toVectorTuple(splineConfig.scale, DEFAULT_CAMERA_SCALE),
    showPath: !!splineConfig.showPath,
    tension: toFiniteNumber(
      splineConfig.tension,
      selectedPath?.tension ?? path?.tension ?? DEFAULT_SPLINE_TENSION
    ),
  };
}

function normalizeOperatorDeclaration(camera = {}) {
  const operatorConfig = camera?.operator ?? {};
  const minFov = toFiniteNumber(
    operatorConfig.minFov,
    DEFAULT_OPERATOR_CAMERA.minFov
  );
  const maxFov = toFiniteNumber(
    operatorConfig.maxFov,
    DEFAULT_OPERATOR_CAMERA.maxFov
  );

  return {
    boostMultiplier: toFiniteNumber(
      operatorConfig.boostMultiplier,
      DEFAULT_OPERATOR_CAMERA.boostMultiplier
    ),
    liftSpeed: toFiniteNumber(
      operatorConfig.liftSpeed,
      DEFAULT_OPERATOR_CAMERA.liftSpeed
    ),
    maxFov: Math.max(minFov, maxFov),
    minFov: Math.min(minFov, maxFov),
    moveSpeed: toFiniteNumber(
      operatorConfig.moveSpeed,
      DEFAULT_OPERATOR_CAMERA.moveSpeed
    ),
    pointerLookSensitivity: toFiniteNumber(
      operatorConfig.pointerLookSensitivity,
      DEFAULT_OPERATOR_CAMERA.pointerLookSensitivity
    ),
    stickLookSpeed: toFiniteNumber(
      operatorConfig.stickLookSpeed,
      DEFAULT_OPERATOR_CAMERA.stickLookSpeed
    ),
    zoomSpeed: toFiniteNumber(
      operatorConfig.zoomSpeed,
      DEFAULT_OPERATOR_CAMERA.zoomSpeed
    ),
  };
}

export function normalizeSceneCameraDeclaration(camera = {}) {
  const fixed = normalizeFixedDeclaration(camera);

  return {
    cameraAutoFit: camera?.cameraAutoFit ?? camera?.autoFit ?? true,
    defaultMode: normalizeSceneCameraMode(
      camera?.defaultMode ?? camera?.mode ?? camera?.cameraMode
    ),
    far: toPositiveNumber(camera?.far, DEFAULT_FAR),
    fixed,
    near: toPositiveNumber(camera?.near, DEFAULT_NEAR),
    operator: normalizeOperatorDeclaration(camera),
    orbit: normalizeOrbitDeclaration(camera, fixed),
    spline: normalizeSplineDeclaration(camera, fixed),
  };
}

export function getFixedShotDescriptors(fixedCamera = {}) {
  const usedSegments = new Set();
  const shotIds = Array.isArray(fixedCamera.shotIds) ? fixedCamera.shotIds : [];

  return shotIds.map((shotId, index) => {
    let controlSegment = toPascalCase(shotId, `Shot${index + 1}`);

    while (usedSegments.has(controlSegment)) {
      controlSegment = `${controlSegment}${index + 1}`;
    }

    usedSegments.add(controlSegment);

    return {
      controlPrefix: `fixedShot${controlSegment}`,
      id: shotId,
      label: formatShotLabel(shotId, index, shotIds.length),
    };
  });
}

export function getFixedShotControlKeys(descriptor) {
  return {
    desktopFov: `${descriptor.controlPrefix}DesktopFov`,
    desktopPosition: `${descriptor.controlPrefix}DesktopPosition`,
    desktopTarget: `${descriptor.controlPrefix}DesktopTarget`,
    mobileFov: `${descriptor.controlPrefix}MobileFov`,
    mobilePosition: `${descriptor.controlPrefix}MobilePosition`,
    mobileTarget: `${descriptor.controlPrefix}MobileTarget`,
  };
}

export function buildSceneCameraControlValues(camera = {}, options = {}) {
  const { includeClipPlaneControls = false } = options;
  const normalizedCamera = normalizeSceneCameraDeclaration(camera);
  const fixedShotDescriptors = getFixedShotDescriptors(normalizedCamera.fixed);

  return {
    cameraMode: normalizedCamera.defaultMode,
    cameraAutoFit: normalizedCamera.cameraAutoFit,
    ...(includeClipPlaneControls
      ? {
          cameraFar: normalizedCamera.far,
          cameraNear: normalizedCamera.near,
        }
      : {}),
    fixedBehavior: normalizedCamera.fixed.behavior,
    ...(normalizedCamera.fixed.shotIds.length > 1
      ? {
          fixedActiveShot: normalizedCamera.fixed.activeShot,
          fixedSequenceIntervalSeconds:
            normalizedCamera.fixed.sequenceIntervalSeconds,
          fixedSequenceOrder: normalizedCamera.fixed.sequenceOrder.join(', '),
        }
      : {}),
    ...fixedShotDescriptors.reduce((accumulator, descriptor) => {
      const shotConfig = normalizedCamera.fixed.shots[descriptor.id];
      const controlKeys = getFixedShotControlKeys(descriptor);

      return {
        ...accumulator,
        [controlKeys.desktopFov]: shotConfig.desktop.fov,
        [controlKeys.desktopPosition]: toVectorObject(
          shotConfig.desktop.position,
          shotConfig.desktop.position
        ),
        [controlKeys.desktopTarget]: toVectorObject(
          shotConfig.desktop.target,
          shotConfig.desktop.target
        ),
        [controlKeys.mobileFov]: shotConfig.mobile.fov,
        [controlKeys.mobilePosition]: toVectorObject(
          shotConfig.mobile.position,
          shotConfig.mobile.position
        ),
        [controlKeys.mobileTarget]: toVectorObject(
          shotConfig.mobile.target,
          shotConfig.mobile.target
        ),
      };
    }, {}),
    orbitDesktopFov: normalizedCamera.orbit.desktop.fov,
    orbitAutoRotate: normalizedCamera.orbit.autoRotate,
    orbitAutoRotateSpeed: normalizedCamera.orbit.autoRotateSpeed,
    orbitEnablePan: normalizedCamera.orbit.enablePan,
    orbitMinDistance: normalizedCamera.orbit.minDistance,
    orbitMaxDistance: normalizedCamera.orbit.maxDistance,
    orbitMaxDistanceUnlimited: normalizedCamera.orbit.maxDistanceUnlimited,
    orbitMinPolarAngle: normalizedCamera.orbit.minPolarAngle,
    orbitMaxPolarAngle: normalizedCamera.orbit.maxPolarAngle,
    orbitMinAzimuthAngle: normalizedCamera.orbit.minAzimuthAngle,
    orbitMaxAzimuthAngle: normalizedCamera.orbit.maxAzimuthAngle,
    orbitAzimuthUnlimited: normalizedCamera.orbit.azimuthUnlimited,
    orbitDesktopPivot: toVectorObject(
      normalizedCamera.orbit.desktop.pivot,
      normalizedCamera.orbit.desktop.pivot
    ),
    orbitDesktopPosition: toVectorObject(
      normalizedCamera.orbit.desktop.position,
      normalizedCamera.orbit.desktop.position
    ),
    orbitDesktopTarget: toVectorObject(
      normalizedCamera.orbit.desktop.target,
      normalizedCamera.orbit.desktop.target
    ),
    orbitMobileFov: normalizedCamera.orbit.mobile.fov,
    orbitMobilePivot: toVectorObject(
      normalizedCamera.orbit.mobile.pivot,
      normalizedCamera.orbit.mobile.pivot
    ),
    orbitMobilePosition: toVectorObject(
      normalizedCamera.orbit.mobile.position,
      normalizedCamera.orbit.mobile.position
    ),
    orbitMobileTarget: toVectorObject(
      normalizedCamera.orbit.mobile.target,
      normalizedCamera.orbit.mobile.target
    ),
    ...(normalizedCamera.spline.presetOptions.length
      ? {
          splinePreset:
            normalizedCamera.spline.preset ??
            normalizedCamera.spline.presetOptions[0],
        }
      : {}),
    splineClosed: normalizedCamera.spline.closed,
    splineDesktopFov: normalizedCamera.spline.desktop.fov,
    splineDesktopTarget: toVectorObject(
      normalizedCamera.spline.desktop.target,
      normalizedCamera.spline.desktop.target
    ),
    splineDuration: normalizedCamera.spline.duration,
    splineForwardDistance: normalizedCamera.spline.forwardDistance,
    splineMobileFov: normalizedCamera.spline.mobile.fov,
    splineMobileTarget: toVectorObject(
      normalizedCamera.spline.mobile.target,
      normalizedCamera.spline.mobile.target
    ),
    splineOrientationMode: normalizedCamera.spline.orientationMode,
    splinePosition: toVectorObject(
      normalizedCamera.spline.position,
      normalizedCamera.spline.position
    ),
    splineScale: toVectorObject(
      normalizedCamera.spline.scale,
      normalizedCamera.spline.scale
    ),
    splineShowPath: normalizedCamera.spline.showPath,
    splineTension: normalizedCamera.spline.tension,
    operatorBoostMultiplier: normalizedCamera.operator.boostMultiplier,
    operatorLiftSpeed: normalizedCamera.operator.liftSpeed,
    operatorMaxFov: normalizedCamera.operator.maxFov,
    operatorMinFov: normalizedCamera.operator.minFov,
    operatorMoveSpeed: normalizedCamera.operator.moveSpeed,
    operatorPointerLookSensitivity:
      normalizedCamera.operator.pointerLookSensitivity,
    operatorStickLookSpeed: normalizedCamera.operator.stickLookSpeed,
    operatorZoomSpeed: normalizedCamera.operator.zoomSpeed,
  };
}

function parseSequenceOrder(value, validShotIds) {
  const parsedValues = Array.isArray(value)
    ? value
    : `${value ?? ''}`
        .split(',')
        .map((shotId) => shotId.trim())
        .filter(Boolean);
  const filteredValues = parsedValues.filter((shotId) =>
    validShotIds.includes(shotId)
  );

  return filteredValues.length ? filteredValues : validShotIds;
}

function resolveSplinePathDefinition(splineConfig, preset) {
  if (preset && splineConfig.paths[preset]) {
    return splineConfig.paths[preset];
  }

  return splineConfig.path;
}

function applySplineTransform(value, position, scale) {
  return [
    value[0] * scale[0] + position[0],
    value[1] * scale[1] + position[1],
    value[2] * scale[2] + position[2],
  ];
}

function transformSplinePoints(pathDefinition, position, scale) {
  if (!pathDefinition?.points?.length) {
    return [];
  }

  return pathDefinition.points.map((point) => {
    const normalizedPoint = {
      position: applySplineTransform(point.position, position, scale),
    };

    if (point.lookAt) {
      normalizedPoint.lookAt = applySplineTransform(
        point.lookAt,
        position,
        scale
      );
    }

    return normalizedPoint;
  });
}

function buildFixedShotRuntimeConfig(descriptor, shotConfig, controls) {
  const controlKeys = getFixedShotControlKeys(descriptor);

  return {
    desktop: {
      fov: toFiniteNumber(
        controls[controlKeys.desktopFov],
        shotConfig.desktop.fov
      ),
      position: toVectorTuple(
        controls[controlKeys.desktopPosition],
        shotConfig.desktop.position
      ),
      target: toVectorTuple(
        controls[controlKeys.desktopTarget],
        shotConfig.desktop.target
      ),
    },
    mobile: {
      fov: toFiniteNumber(
        controls[controlKeys.mobileFov],
        shotConfig.mobile.fov
      ),
      position: toVectorTuple(
        controls[controlKeys.mobilePosition],
        shotConfig.mobile.position
      ),
      target: toVectorTuple(
        controls[controlKeys.mobileTarget],
        shotConfig.mobile.target
      ),
    },
  };
}

export function buildSceneCameraRuntimeConfig({ camera, controls = {} } = {}) {
  const normalizedCamera = normalizeSceneCameraDeclaration(camera);
  const shotDescriptors = getFixedShotDescriptors(normalizedCamera.fixed);
  const fixedShots = Object.fromEntries(
    shotDescriptors.map((descriptor) => {
      return [
        descriptor.id,
        buildFixedShotRuntimeConfig(
          descriptor,
          normalizedCamera.fixed.shots[descriptor.id],
          controls
        ),
      ];
    })
  );
  const fixedActiveShot = fixedShots[controls.fixedActiveShot]
    ? controls.fixedActiveShot
    : normalizedCamera.fixed.activeShot;
  const sequenceOrder = parseSequenceOrder(
    controls.fixedSequenceOrder,
    normalizedCamera.fixed.shotIds
  );
  const splinePreset = normalizedCamera.spline.presetOptions.includes(
    controls.splinePreset
  )
    ? controls.splinePreset
    : normalizedCamera.spline.preset;
  const splinePosition = toVectorTuple(
    controls.splinePosition,
    normalizedCamera.spline.position
  );
  const splineScale = toVectorTuple(
    controls.splineScale,
    normalizedCamera.spline.scale
  );
  const splinePath = resolveSplinePathDefinition(
    normalizedCamera.spline,
    splinePreset
  );
  const splinePoints = transformSplinePoints(
    splinePath,
    splinePosition,
    splineScale
  );
  const orbitAzimuthUnlimited =
    controls.orbitAzimuthUnlimited ?? normalizedCamera.orbit.azimuthUnlimited;

  return {
    cameraAutoFit: controls.cameraAutoFit ?? normalizedCamera.cameraAutoFit,
    defaultMode: normalizedCamera.defaultMode,
    far: toPositiveNumber(controls.cameraFar, normalizedCamera.far),
    fixed: {
      activeShot: fixedActiveShot,
      behavior: normalizeFixedBehavior(
        controls.fixedBehavior ?? normalizedCamera.fixed.behavior
      ),
      sequenceIntervalSeconds: toPositiveNumber(
        controls.fixedSequenceIntervalSeconds,
        normalizedCamera.fixed.sequenceIntervalSeconds
      ),
      sequenceOrder,
      shots: fixedShots,
    },
    mode: normalizeSceneCameraMode(
      controls.cameraMode,
      normalizedCamera.defaultMode
    ),
    near: toPositiveNumber(controls.cameraNear, normalizedCamera.near),
    operator: {
      boostMultiplier: toFiniteNumber(
        controls.operatorBoostMultiplier,
        normalizedCamera.operator.boostMultiplier
      ),
      liftSpeed: toFiniteNumber(
        controls.operatorLiftSpeed,
        normalizedCamera.operator.liftSpeed
      ),
      maxFov: toFiniteNumber(
        controls.operatorMaxFov,
        normalizedCamera.operator.maxFov
      ),
      minFov: toFiniteNumber(
        controls.operatorMinFov,
        normalizedCamera.operator.minFov
      ),
      moveSpeed: toFiniteNumber(
        controls.operatorMoveSpeed,
        normalizedCamera.operator.moveSpeed
      ),
      pointerLookSensitivity: toFiniteNumber(
        controls.operatorPointerLookSensitivity,
        normalizedCamera.operator.pointerLookSensitivity
      ),
      stickLookSpeed: toFiniteNumber(
        controls.operatorStickLookSpeed,
        normalizedCamera.operator.stickLookSpeed
      ),
      zoomSpeed: toFiniteNumber(
        controls.operatorZoomSpeed,
        normalizedCamera.operator.zoomSpeed
      ),
    },
    orbit: {
      autoRotate: controls.orbitAutoRotate ?? normalizedCamera.orbit.autoRotate,
      autoRotateSpeed: toFiniteNumber(
        controls.orbitAutoRotateSpeed,
        normalizedCamera.orbit.autoRotateSpeed
      ),
      enablePan: controls.orbitEnablePan ?? normalizedCamera.orbit.enablePan,
      minDistance: toFiniteNumber(
        controls.orbitMinDistance,
        normalizedCamera.orbit.minDistance
      ),
      maxDistance:
        (controls.orbitMaxDistanceUnlimited ??
        normalizedCamera.orbit.maxDistanceUnlimited)
          ? Infinity
          : toFiniteNumber(
              controls.orbitMaxDistance,
              normalizedCamera.orbit.maxDistance
            ),
      minPolarAngle: degToRad(
        toFiniteNumber(
          controls.orbitMinPolarAngle,
          normalizedCamera.orbit.minPolarAngle
        )
      ),
      maxPolarAngle: degToRad(
        toFiniteNumber(
          controls.orbitMaxPolarAngle,
          normalizedCamera.orbit.maxPolarAngle
        )
      ),
      minAzimuthAngle: orbitAzimuthUnlimited
        ? -Infinity
        : degToRad(
            toFiniteNumber(
              controls.orbitMinAzimuthAngle,
              normalizedCamera.orbit.minAzimuthAngle
            )
          ),
      maxAzimuthAngle: orbitAzimuthUnlimited
        ? Infinity
        : degToRad(
            toFiniteNumber(
              controls.orbitMaxAzimuthAngle,
              normalizedCamera.orbit.maxAzimuthAngle
            )
          ),
      desktop: {
        fov: toFiniteNumber(
          controls.orbitDesktopFov,
          normalizedCamera.orbit.desktop.fov
        ),
        pivot: toVectorTuple(
          controls.orbitDesktopPivot,
          normalizedCamera.orbit.desktop.pivot
        ),
        position: toVectorTuple(
          controls.orbitDesktopPosition,
          normalizedCamera.orbit.desktop.position
        ),
        target: toVectorTuple(
          controls.orbitDesktopTarget,
          normalizedCamera.orbit.desktop.target
        ),
      },
      mobile: {
        fov: toFiniteNumber(
          controls.orbitMobileFov,
          normalizedCamera.orbit.mobile.fov
        ),
        pivot: toVectorTuple(
          controls.orbitMobilePivot,
          normalizedCamera.orbit.mobile.pivot
        ),
        position: toVectorTuple(
          controls.orbitMobilePosition,
          normalizedCamera.orbit.mobile.position
        ),
        target: toVectorTuple(
          controls.orbitMobileTarget,
          normalizedCamera.orbit.mobile.target
        ),
      },
    },
    spline: {
      closed: controls.splineClosed ?? normalizedCamera.spline.closed,
      desktop: {
        fov: toFiniteNumber(
          controls.splineDesktopFov,
          normalizedCamera.spline.desktop.fov
        ),
        target: toVectorTuple(
          controls.splineDesktopTarget,
          normalizedCamera.spline.desktop.target
        ),
      },
      duration: toFiniteNumber(
        controls.splineDuration,
        normalizedCamera.spline.duration
      ),
      forwardDistance: toPositiveNumber(
        controls.splineForwardDistance,
        normalizedCamera.spline.forwardDistance
      ),
      mobile: {
        fov: toFiniteNumber(
          controls.splineMobileFov,
          normalizedCamera.spline.mobile.fov
        ),
        target: toVectorTuple(
          controls.splineMobileTarget,
          normalizedCamera.spline.mobile.target
        ),
      },
      orientationMode: normalizeSplineOrientationMode(
        controls.splineOrientationMode ??
          normalizedCamera.spline.orientationMode
      ),
      path: splinePath,
      paths: normalizedCamera.spline.paths,
      points: splinePoints,
      position: splinePosition,
      preset: splinePreset,
      scale: splineScale,
      showPath: controls.splineShowPath ?? normalizedCamera.spline.showPath,
      tension: toFiniteNumber(
        controls.splineTension,
        normalizedCamera.spline.tension
      ),
    },
  };
}

function getCaptureViewportKeys(viewport, currentViewport) {
  switch (`${viewport ?? 'both'}`.trim().toLowerCase()) {
    case 'desktop':
      return ['desktop'];
    case 'mobile':
      return ['mobile'];
    case 'current':
      return currentViewport ? [currentViewport] : ['desktop', 'mobile'];
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

  return normalizeSceneCameraMode(normalizedRequestedMode);
}

function pickViewportFrames(frames, viewportKeys) {
  return Object.fromEntries(
    viewportKeys
      .filter((viewportKey) => !!frames?.[viewportKey])
      .map((viewportKey) => [viewportKey, cloneSnapshot(frames[viewportKey])])
  );
}

function ensureFixedShot(snapshot, shotId) {
  if (snapshot.fixed.shots[shotId]) {
    return {
      fixedShot: snapshot.fixed.shots[shotId],
      snapshot,
    };
  }

  const fallbackShot = snapshot.fixed.shots[snapshot.fixed.activeShot] ??
    snapshot.fixed.shots[Object.keys(snapshot.fixed.shots)[0]] ?? {
      desktop: {
        fov: DEFAULT_FOV,
        position: [...DEFAULT_CAMERA_POSITION],
        target: [...DEFAULT_CAMERA_TARGET],
      },
      mobile: {
        fov: DEFAULT_FOV,
        position: [...DEFAULT_CAMERA_POSITION],
        target: [...DEFAULT_CAMERA_TARGET],
      },
    };

  const nextSnapshot = {
    ...snapshot,
    fixed: {
      ...snapshot.fixed,
      shots: {
        ...snapshot.fixed.shots,
        [shotId]: cloneSnapshot(fallbackShot),
      },
    },
  };

  return {
    fixedShot: nextSnapshot.fixed.shots[shotId],
    snapshot: nextSnapshot,
  };
}

function applyCapturedFrameToSnapshot(
  snapshot,
  capturedFrame,
  captureMode,
  viewportKeys,
  options
) {
  if (!capturedFrame) {
    return snapshot;
  }

  const nextSnapshot = cloneSnapshot(snapshot);

  if (captureMode === 'orbit') {
    viewportKeys.forEach((viewportKey) => {
      nextSnapshot.orbit[viewportKey] = {
        fov: capturedFrame.fov,
        pivot: [...capturedFrame.pivot],
        position: [...capturedFrame.position],
        target: [...capturedFrame.target],
      };
    });

    if (options.includeAutoFitToggle !== false) {
      nextSnapshot.cameraAutoFit = false;
    }

    return nextSnapshot;
  }

  if (captureMode === 'spline') {
    viewportKeys.forEach((viewportKey) => {
      nextSnapshot.spline[viewportKey] = {
        fov: capturedFrame.fov,
        target: [...capturedFrame.target],
      };
    });

    return nextSnapshot;
  }

  const fixedShotId =
    options.fixedShotId ??
    capturedFrame.activeFixedShotId ??
    nextSnapshot.fixed.activeShot;
  const { fixedShot, snapshot: ensuredSnapshot } = ensureFixedShot(
    nextSnapshot,
    fixedShotId
  );

  nextSnapshot.fixed = ensuredSnapshot.fixed;

  viewportKeys.forEach((viewportKey) => {
    fixedShot[viewportKey] = {
      fov: capturedFrame.fov,
      position: [...capturedFrame.position],
      target: [...capturedFrame.target],
    };
  });

  nextSnapshot.fixed.activeShot = fixedShotId;

  return nextSnapshot;
}

function buildFixedSnapshotFragment(snapshot, viewportKeys, options) {
  const fixedShotId = options.fixedShotId ?? snapshot.fixed.activeShot;
  const shotIds = options.includeAllFixedShots
    ? Object.keys(snapshot.fixed.shots)
    : [fixedShotId];
  const shots = Object.fromEntries(
    shotIds.map((shotId) => {
      return [
        shotId,
        pickViewportFrames(snapshot.fixed.shots[shotId], viewportKeys),
      ];
    })
  );

  if (options.includeFixedContext === false) {
    return {
      fixed: shots[fixedShotId] ?? {},
    };
  }

  return {
    fixed: {
      activeShot: fixedShotId,
      behavior: snapshot.fixed.behavior,
      sequenceIntervalSeconds: snapshot.fixed.sequenceIntervalSeconds,
      sequenceOrder: [...snapshot.fixed.sequenceOrder],
      shots,
    },
  };
}

function buildSplineSnapshotFragment(snapshot, viewportKeys) {
  return {
    spline: {
      ...pickViewportFrames(snapshot.spline, viewportKeys),
      ...(snapshot.spline.preset ? { preset: snapshot.spline.preset } : {}),
      ...(!snapshot.spline.preset && snapshot.spline.path
        ? { path: cloneSnapshot(snapshot.spline.path) }
        : {}),
      closed: snapshot.spline.closed,
      duration: snapshot.spline.duration,
      forwardDistance: snapshot.spline.forwardDistance,
      orientationMode: snapshot.spline.orientationMode,
      position: [...snapshot.spline.position],
      scale: [...snapshot.spline.scale],
      showPath: snapshot.spline.showPath,
      tension: snapshot.spline.tension,
    },
  };
}

function buildOrbitSnapshotFragment(snapshot, viewportKeys, options) {
  return {
    ...(options.includeAutoFitToggle === false
      ? {}
      : { cameraAutoFit: snapshot.cameraAutoFit }),
    orbit: {
      ...pickViewportFrames(snapshot.orbit, viewportKeys),
      autoRotate: snapshot.orbit.autoRotate,
      autoRotateSpeed: snapshot.orbit.autoRotateSpeed,
    },
  };
}

export function buildSceneCameraConfigSnapshot({
  camera,
  capturedFrame = null,
  controls = {},
  options = {},
} = {}) {
  const runtimeCamera = applyCapturedFrameToSnapshot(
    buildSceneCameraRuntimeConfig({ camera, controls }),
    capturedFrame,
    resolveCaptureMode(
      capturedFrame?.mode ??
        buildSceneCameraRuntimeConfig({ camera, controls }).mode,
      options.mode
    ),
    getCaptureViewportKeys(options.viewport, capturedFrame?.viewport),
    options
  );
  const captureMode = resolveCaptureMode(runtimeCamera.mode, options.mode);
  const viewportKeys = getCaptureViewportKeys(
    options.viewport,
    capturedFrame?.viewport
  );

  if (`${options.shape ?? 'fragment'}`.trim().toLowerCase() === 'full') {
    return runtimeCamera;
  }

  if (captureMode === 'orbit') {
    return buildOrbitSnapshotFragment(runtimeCamera, viewportKeys, options);
  }

  if (captureMode === 'spline') {
    return buildSplineSnapshotFragment(runtimeCamera, viewportKeys);
  }

  return buildFixedSnapshotFragment(runtimeCamera, viewportKeys, options);
}

export function serializeSceneCameraSnapshot(snapshot) {
  return formatObjectLiteral(snapshot);
}
