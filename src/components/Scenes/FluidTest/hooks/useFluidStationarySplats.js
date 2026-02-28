import * as THREE from 'three';

import { useEffect, useRef } from 'react';

const MAX_STATIONARY_SPLATS = 8;

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

export default function useFluidStationarySplats({ config, pointerEvents }) {
  const stationaryPointersRef = useRef([]);
  const idRef = useRef(0);

  useEffect(() => {
    const desiredCount = THREE.MathUtils.clamp(
      Math.max(0, Math.floor(config?.stationarySplatCount || 0)),
      0,
      MAX_STATIONARY_SPLATS
    );

    const next = stationaryPointersRef.current.slice(0, desiredCount);
    while (next.length < desiredCount) {
      const nextId = `stationary-${idRef.current}`;
      idRef.current += 1;
      next.push(normalizePoint(createRandomPoint(), nextId));
    }
    stationaryPointersRef.current = next;
  }, [config?.stationarySplatCount]);

  return {
    stationaryPointersRef,
    pointerEvents: pointerEvents || {},
  };
}
