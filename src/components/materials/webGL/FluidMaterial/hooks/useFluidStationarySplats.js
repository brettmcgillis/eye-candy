import * as THREE from 'three';

import { useEffect, useRef } from 'react';

import { MAX_STATIONARY_SPLATS } from '../utils/constants';

function clamp01(value, fallback = 0.5) {
  if (Number.isFinite(value)) {
    return THREE.MathUtils.clamp(value, 0, 1);
  }
  return fallback;
}

function normalizePoint(point, id) {
  return {
    id,
    x: clamp01(point?.x),
    y: clamp01(point?.y),
  };
}

function createRandomPoint() {
  return {
    x: 0.1 + Math.random() * 0.8,
    y: 0.1 + Math.random() * 0.8,
  };
}

function getConfiguredPoints(config) {
  if (Array.isArray(config?.stationarySplats)) {
    return config.stationarySplats;
  }
  return [];
}

function getConfiguredDebugMarkerPoints(config) {
  if (Array.isArray(config?.stationaryDebugMarkers)) {
    return config.stationaryDebugMarkers;
  }
  return getConfiguredPoints(config);
}

export default function useFluidStationarySplats({ config, pointerEvents }) {
  const stationaryPointersRef = useRef([]);
  const stationaryDebugMarkersRef = useRef([]);
  const idRef = useRef(0);
  const debugIdRef = useRef(0);

  useEffect(() => {
    const desiredCount = THREE.MathUtils.clamp(
      Math.max(0, Math.floor(config?.stationarySplatCount || 0)),
      0,
      MAX_STATIONARY_SPLATS
    );

    const configuredPoints = getConfiguredPoints(config);
    const next = stationaryPointersRef.current.slice(0, desiredCount);

    while (next.length < desiredCount) {
      const nextId = `stationary-${idRef.current}`;
      idRef.current += 1;
      const configuredPoint = configuredPoints[next.length];
      const point = configuredPoint || createRandomPoint();
      next.push(normalizePoint(point, nextId));
    }

    for (let i = 0; i < next.length; i += 1) {
      if (configuredPoints[i]) {
        next[i] = normalizePoint(configuredPoints[i], next[i].id);
      }
    }

    stationaryPointersRef.current = next;
  }, [config?.stationarySplatCount, config?.stationarySplats]);

  useEffect(() => {
    const configuredDebugPoints = getConfiguredDebugMarkerPoints(config);
    const fallbackCount = Math.max(
      0,
      Math.floor(config?.stationarySplatCount || 0)
    );
    const desiredCount = THREE.MathUtils.clamp(
      Math.max(
        0,
        Math.floor(config?.stationaryDebugMarkerCount ?? fallbackCount)
      ),
      0,
      MAX_STATIONARY_SPLATS
    );
    const next = stationaryDebugMarkersRef.current.slice(0, desiredCount);

    while (next.length < desiredCount) {
      const nextId = `stationary-debug-${debugIdRef.current}`;
      debugIdRef.current += 1;
      const configuredPoint = configuredDebugPoints[next.length];
      const point = configuredPoint || createRandomPoint();
      next.push(normalizePoint(point, nextId));
    }

    for (let i = 0; i < next.length; i += 1) {
      if (configuredDebugPoints[i]) {
        next[i] = normalizePoint(configuredDebugPoints[i], next[i].id);
      }
    }

    stationaryDebugMarkersRef.current = next;
  }, [
    config?.stationaryDebugMarkerCount,
    config?.stationaryDebugMarkers,
    config?.stationarySplatCount,
    config?.stationarySplats,
  ]);

  return {
    stationaryPointersRef,
    stationaryDebugMarkersRef,
    pointerEvents: pointerEvents || {},
  };
}
