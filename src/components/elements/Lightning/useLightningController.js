import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFrame, useThree } from '@react-three/fiber';

import * as THREE from 'three';

import {
  createLightningAdapterResolvers,
  createLightningTargetResolvers,
  createSeededRandom,
  isLightningIgnoredObject,
  samplePointInBounds,
  toVector3Like,
} from './lightningUtils';

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const fallbackPlane = new THREE.Plane();
const planeHit = new THREE.Vector3();
const UP_NORMAL = new THREE.Vector3(0, 1, 0);

const DEFAULT_ARC_STRAND_OPTIONS = {
  branchCount: 0,
  branchLengthFactorMax: 0.1,
  branchLengthFactorMin: 0.04,
  branchMode: 'arc',
  branchRadiusScale: 0.35,
  mainFractalDepth: 5,
  mainRadiusScale: 0.75,
  roughness: 0.28,
};

function isTypingTarget(target) {
  const tagName = target?.tagName?.toLowerCase();

  return (
    target?.isContentEditable ||
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select'
  );
}

function hasShortcutModifier(event) {
  return event.altKey || event.ctrlKey || event.metaKey;
}

function normalizePointResolver(input, fallback) {
  if (typeof input === 'function') {
    return () => toVector3Like(input(), fallback);
  }

  const point = toVector3Like(input, fallback);
  return () => point.clone();
}

function normalizeNormalResolver(input, fallback = [0, 1, 0]) {
  if (typeof input === 'function') {
    return () => toVector3Like(input(), fallback).normalize();
  }

  const point = toVector3Like(input, fallback).normalize();
  return () => point.clone();
}

function createAutoSourceResolver(targetResolver, seed, bounds) {
  const random = createSeededRandom(seed + 2654435761);
  const { topJitter } = bounds;
  const minHeight = bounds.minHeight ?? 15;
  const maxHeight = bounds.maxHeight ?? 24;
  const sourceSpread = bounds.sourceSpread ?? 1.5;
  const height = minHeight + (maxHeight - minHeight) * random();
  const offset = new THREE.Vector3();

  if (topJitter == null || topJitter <= 0) {
    const angle = random() * Math.PI * 2;
    const radius = sourceSpread * (0.5 + random() * 0.5);

    offset.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
  } else {
    offset.set(
      (random() - 0.5) * topJitter,
      height,
      (random() - 0.5) * topJitter
    );
  }

  return () => targetResolver().add(offset);
}

function isPointTooCloseToCamera(point, cameraPosition, radius) {
  if (!cameraPosition || radius <= 0) {
    return false;
  }

  const dx = point.x - cameraPosition.x;
  const dz = point.z - cameraPosition.z;

  return dx * dx + dz * dz < radius * radius;
}

function findFirstLightningSurface(intersections, raycastFilter) {
  return intersections.find((intersection) => {
    if (!intersection.object?.isMesh) {
      return false;
    }

    if (isLightningIgnoredObject(intersection.object)) {
      return false;
    }

    return typeof raycastFilter === 'function'
      ? raycastFilter(intersection)
      : true;
  });
}

function resolveObjectSurfaceType(object) {
  let current = object;

  while (current) {
    if (current.userData?.lightningSurfaceType) {
      return current.userData.lightningSurfaceType;
    }

    current = current.parent;
  }

  return 'mesh';
}

function createDirectClickStrikeOptions(intersection) {
  const adapterResolvers = createLightningAdapterResolvers(intersection);

  if (adapterResolvers) {
    return adapterResolvers;
  }

  const normal = intersection.face?.normal
    ?.clone()
    .transformDirection(intersection.object.matrixWorld)
    .normalize();

  return {
    follow: false,
    normal: normal ?? UP_NORMAL,
    surfaceType: resolveObjectSurfaceType(intersection.object),
    target: intersection.point.clone(),
  };
}

function createArcStrandOptions(options = {}) {
  return {
    ...DEFAULT_ARC_STRAND_OPTIONS,
    ...(options.branchCount == null
      ? null
      : { branchCount: options.branchCount }),
    ...(options.mainFractalDepth == null
      ? null
      : { mainFractalDepth: options.mainFractalDepth }),
    ...(options.roughness == null ? null : { roughness: options.roughness }),
    ...(options.strandOptions ?? null),
  };
}

function normalizePreset(preset) {
  if (!preset) {
    return null;
  }

  if (
    Array.isArray(preset) ||
    preset instanceof THREE.Vector3 ||
    (typeof preset === 'object' &&
      'x' in preset &&
      'y' in preset &&
      'z' in preset)
  ) {
    return { target: preset };
  }

  return preset;
}

function resolveTargetResolver(options, intersectionResolvers, groundPlaneY) {
  if (intersectionResolvers?.targetResolver) {
    return intersectionResolvers.targetResolver;
  }

  if (options.targetResolver) {
    return normalizePointResolver(options.targetResolver, [0, groundPlaneY, 0]);
  }

  return normalizePointResolver(options.target, [0, groundPlaneY, 0]);
}

function resolveNormalResolver(options, intersectionResolvers) {
  if (intersectionResolvers?.normalResolver) {
    return intersectionResolvers.normalResolver;
  }

  if (options.normalResolver) {
    return normalizeNormalResolver(options.normalResolver);
  }

  return normalizeNormalResolver(options.normal, [0, 1, 0]);
}

function resolveSurfaceType(options, intersectionResolvers) {
  if (options.surfaceType) {
    return options.surfaceType;
  }

  return intersectionResolvers?.surfaceType ?? 'generic';
}

function resolveSourceResolver(
  options,
  targetResolver,
  strikeSeed,
  defaultSource,
  randomBounds
) {
  const fallback = [0, randomBounds.maxHeight, 0];

  if (options.sourceResolver) {
    return normalizePointResolver(options.sourceResolver, fallback);
  }

  if (options.source) {
    return normalizePointResolver(options.source, fallback);
  }

  if (defaultSource) {
    return normalizePointResolver(defaultSource, fallback);
  }

  return createAutoSourceResolver(targetResolver, strikeSeed, randomBounds);
}

export default function useLightningController({
  apiRef,
  autoRandom,
  autoRandomInterval,
  clickToStrike,
  defaultSource,
  defaultTotalDuration,
  fallbackPlaneEnabled,
  fadeDuration,
  groundPlaneY,
  keyboardShortcuts,
  maxConcurrentStrikes,
  presetTargets,
  randomStrikeBounds,
  raycastFilter,
  strikeDuration,
}) {
  const camera = useThree((state) => state.camera);
  const clock = useThree((state) => state.clock);
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const [strikes, setStrikes] = useState([]);
  const strikeIdRef = useRef(0);
  const presetIndexRef = useRef(0);
  const nextAutoAtRef = useRef(null);

  const randomBounds = useMemo(
    () => ({
      maxHeight: 24,
      maxX: 5,
      maxZ: 5,
      minHeight: 15,
      minX: -5,
      minZ: -5,
      sourceSpread: 1.5,
      targetY: groundPlaneY,
      topJitter: 1.5,
      ...randomStrikeBounds,
    }),
    [groundPlaneY, randomStrikeBounds]
  );

  const sampleAutoInterval = useCallback(() => {
    const [minInterval = 4, maxInterval = minInterval] =
      autoRandomInterval || [];
    return minInterval + Math.random() * Math.max(0, maxInterval - minInterval);
  }, [autoRandomInterval]);

  const completeStrike = useCallback((strikeId) => {
    setStrikes((current) => current.filter((strike) => strike.id !== strikeId));
  }, []);

  const spawnStrike = useCallback(
    (options = {}) => {
      const strikeIdRefValue = strikeIdRef.current + 1;
      strikeIdRef.current = strikeIdRefValue;

      const strikeSeed =
        options.seed ??
        Math.floor(Math.random() * 2147483646) + strikeIdRefValue;

      const intersectionResolvers = options.intersection
        ? createLightningTargetResolvers(options.intersection)
        : null;

      const targetResolver = resolveTargetResolver(
        options,
        intersectionResolvers,
        groundPlaneY
      );
      const normalResolver = resolveNormalResolver(
        options,
        intersectionResolvers
      );
      const sourceResolver = resolveSourceResolver(
        options,
        targetResolver,
        strikeSeed,
        defaultSource,
        randomBounds
      );

      const nextStrike = {
        branchCount: options.branchCount,
        follow: options.follow ?? intersectionResolvers?.follow ?? false,
        id: `lightning-${strikeIdRefValue}`,
        mainFractalDepth: options.mainFractalDepth,
        normalResolver,
        roughness: options.roughness,
        seed: strikeSeed,
        sourceResolver,
        startTime: clock.elapsedTime,
        strandOptions: options.strandOptions,
        strikeDuration,
        surfaceType: resolveSurfaceType(options, intersectionResolvers),
        targetResolver,
        totalDuration:
          options.totalDuration ??
          defaultTotalDuration ??
          strikeDuration + fadeDuration,
      };

      setStrikes((current) =>
        [...current, nextStrike].slice(-maxConcurrentStrikes)
      );

      return nextStrike.id;
    },
    [
      clock.elapsedTime,
      defaultSource,
      defaultTotalDuration,
      fadeDuration,
      groundPlaneY,
      maxConcurrentStrikes,
      randomBounds,
      strikeDuration,
    ]
  );

  const spawnRandomStrike = useCallback(
    (options = {}) => {
      const avoidCameraRadius = randomBounds.avoidCameraRadius ?? 0;
      const maxAttempts = Math.max(
        1,
        Math.floor(randomBounds.maxAttempts ?? 1)
      );
      let target = samplePointInBounds(randomBounds, Math.random);

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        if (
          !isPointTooCloseToCamera(target, camera.position, avoidCameraRadius)
        ) {
          break;
        }

        target = samplePointInBounds(randomBounds, Math.random);
      }

      return spawnStrike({
        ...options,
        follow: options.follow ?? false,
        normal: options.normal ?? [0, 1, 0],
        target,
      });
    },
    [camera.position, randomBounds, spawnStrike]
  );

  const spawnPresetStrike = useCallback(
    (index) => {
      if (!presetTargets.length) {
        return null;
      }

      const nextIndex =
        index == null
          ? presetIndexRef.current % presetTargets.length
          : ((index % presetTargets.length) + presetTargets.length) %
            presetTargets.length;

      presetIndexRef.current = nextIndex + 1;

      const preset = normalizePreset(presetTargets[nextIndex]);

      if (!preset) {
        return null;
      }

      return spawnStrike({
        ...preset,
        follow: preset.follow ?? false,
        normal: preset.normal ?? [0, 1, 0],
        target: preset.target ?? preset.point,
      });
    },
    [presetTargets, spawnStrike]
  );

  const spawnArc = useCallback(
    (options) => {
      return spawnStrike({
        ...options,
        follow: options?.follow ?? true,
        strandOptions: createArcStrandOptions(options),
        surfaceType: options?.surfaceType ?? 'air',
      });
    },
    [spawnStrike]
  );

  const clear = useCallback(() => {
    setStrikes([]);
  }, []);

  useEffect(() => {
    if (!apiRef) {
      return undefined;
    }

    const lightningApiRef = apiRef;

    lightningApiRef.current = {
      clear,
      spawnArc,
      spawnPresetStrike,
      spawnRandomStrike,
      spawnStrike,
    };

    return () => {
      if (lightningApiRef.current) {
        lightningApiRef.current = null;
      }
    };
  }, [
    apiRef,
    clear,
    spawnArc,
    spawnPresetStrike,
    spawnRandomStrike,
    spawnStrike,
  ]);

  useEffect(() => {
    if (!clickToStrike) {
      return undefined;
    }

    const element = gl.domElement;

    function handlePointerDown(event) {
      if (event.button !== 0) {
        return;
      }

      const rect = element.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -(((event.clientY - rect.top) / rect.height) * 2 - 1)
      );

      raycaster.setFromCamera(pointer, camera);

      const resolvedHit = findFirstLightningSurface(
        raycaster.intersectObjects(scene.children, true),
        raycastFilter
      );

      if (resolvedHit) {
        spawnStrike(createDirectClickStrikeOptions(resolvedHit));
        return;
      }

      if (!fallbackPlaneEnabled) {
        return;
      }

      fallbackPlane.set(new THREE.Vector3(0, 1, 0), -groundPlaneY);

      if (!raycaster.ray.intersectPlane(fallbackPlane, planeHit)) {
        return;
      }

      spawnStrike({
        follow: false,
        normal: [0, 1, 0],
        target: planeHit.clone(),
      });
    }

    element.addEventListener('pointerdown', handlePointerDown);

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [
    camera,
    clickToStrike,
    fallbackPlaneEnabled,
    gl,
    groundPlaneY,
    raycastFilter,
    scene,
    spawnStrike,
  ]);

  useEffect(() => {
    const randomKey = keyboardShortcuts?.random;
    const presetKey = keyboardShortcuts?.preset;
    const clearKey = keyboardShortcuts?.clear;

    if (!randomKey && !presetKey && !clearKey) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (isTypingTarget(event.target) || hasShortcutModifier(event)) {
        return;
      }

      if (event.code === randomKey) {
        spawnRandomStrike();
        event.preventDefault();
      }

      if (event.code === presetKey) {
        spawnPresetStrike();
        event.preventDefault();
      }

      if (event.code === clearKey) {
        clear();
        event.preventDefault();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [clear, keyboardShortcuts, spawnPresetStrike, spawnRandomStrike]);

  useEffect(() => {
    nextAutoAtRef.current = null;
  }, [autoRandom, autoRandomInterval]);

  useFrame(({ clock: frameClock }) => {
    if (!autoRandom) {
      return;
    }

    if (nextAutoAtRef.current == null) {
      nextAutoAtRef.current = frameClock.elapsedTime + sampleAutoInterval();
      return;
    }

    if (frameClock.elapsedTime < nextAutoAtRef.current) {
      return;
    }

    spawnRandomStrike();
    nextAutoAtRef.current = frameClock.elapsedTime + sampleAutoInterval();
  });

  return {
    clear,
    completeStrike,
    spawnArc,
    spawnPresetStrike,
    spawnRandomStrike,
    spawnStrike,
    strikes,
  };
}
