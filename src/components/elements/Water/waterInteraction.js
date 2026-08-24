import { useCallback, useEffect, useMemo, useRef } from 'react';

import * as THREE from 'three';

import { sampleWaveHeight, sampleWaveNormal } from './waterUtils';

const MAX_RUNTIME_STEP = 1 / 30;

function createInteractionState(size) {
  const textureData = new Float32Array(size * size * 4);

  for (let index = 0; index < size * size; index += 1) {
    textureData[index * 4 + 3] = 1;
  }

  const texture = new THREE.DataTexture(
    textureData,
    size,
    size,
    THREE.RGBAFormat,
    THREE.FloatType
  );

  texture.colorSpace = THREE.NoColorSpace;
  texture.generateMipmaps = false;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  return {
    current: new Float32Array(size * size),
    previous: new Float32Array(size * size),
    next: new Float32Array(size * size),
    size,
    texture,
    textureData,
  };
}

export function resetWaterInteractionState(state) {
  const nextState = state;

  nextState.current.fill(0);
  nextState.previous.fill(0);
  nextState.next.fill(0);

  for (let index = 0; index < nextState.size * nextState.size; index += 1) {
    const offset = index * 4;

    nextState.textureData[offset] = 0;
    nextState.textureData[offset + 1] = 0;
    nextState.textureData[offset + 2] = 0;
    nextState.textureData[offset + 3] = 1;
  }

  nextState.texture.needsUpdate = true;
}

export function toWaterInteractionUv(x, z, fieldWidth, fieldDepth) {
  return {
    u: x / Math.max(fieldWidth, 0.0001) + 0.5,
    v: 0.5 - z / Math.max(fieldDepth, 0.0001),
  };
}

export function sampleWaterInteractionHeight(
  x,
  z,
  fieldWidth,
  fieldDepth,
  state
) {
  if (!state) {
    return 0;
  }

  const { current, size } = state;
  const { u, v } = toWaterInteractionUv(x, z, fieldWidth, fieldDepth);

  if (u < 0 || u > 1 || v < 0 || v > 1) {
    return 0;
  }

  const px = u * (size - 1);
  const py = v * (size - 1);
  const x0 = Math.floor(px);
  const y0 = Math.floor(py);
  const x1 = Math.min(x0 + 1, size - 1);
  const y1 = Math.min(y0 + 1, size - 1);
  const tx = px - x0;
  const ty = py - y0;
  const topLeft = current[y0 * size + x0];
  const topRight = current[y0 * size + x1];
  const bottomLeft = current[y1 * size + x0];
  const bottomRight = current[y1 * size + x1];
  const top = THREE.MathUtils.lerp(topLeft, topRight, tx);
  const bottom = THREE.MathUtils.lerp(bottomLeft, bottomRight, tx);

  return THREE.MathUtils.lerp(top, bottom, ty);
}

export function sampleWaterInteractionNormal(
  x,
  z,
  fieldWidth,
  fieldDepth,
  state,
  target = new THREE.Vector3()
) {
  if (!state) {
    return target.set(0, 1, 0);
  }

  const resolution = Math.max(state.size, 1);
  const sampleStepX = Math.max(fieldWidth / resolution, 0.0001);
  const sampleStepZ = Math.max(fieldDepth / resolution, 0.0001);
  const left = sampleWaterInteractionHeight(
    x - sampleStepX,
    z,
    fieldWidth,
    fieldDepth,
    state
  );
  const right = sampleWaterInteractionHeight(
    x + sampleStepX,
    z,
    fieldWidth,
    fieldDepth,
    state
  );
  const back = sampleWaterInteractionHeight(
    x,
    z - sampleStepZ,
    fieldWidth,
    fieldDepth,
    state
  );
  const front = sampleWaterInteractionHeight(
    x,
    z + sampleStepZ,
    fieldWidth,
    fieldDepth,
    state
  );

  return target
    .set(
      (left - right) / (sampleStepX * 2),
      1,
      (back - front) / (sampleStepZ * 2)
    )
    .normalize();
}

export function combineWaterSurfaceNormals(
  baseNormal,
  detailNormal,
  target = new THREE.Vector3()
) {
  const safeBaseY = Math.max(Math.abs(baseNormal.y), 0.0001);
  const safeDetailY = Math.max(Math.abs(detailNormal.y), 0.0001);
  const baseSlopeX = -baseNormal.x / safeBaseY;
  const baseSlopeZ = -baseNormal.z / safeBaseY;
  const detailSlopeX = -detailNormal.x / safeDetailY;
  const detailSlopeZ = -detailNormal.z / safeDetailY;

  return target
    .set(-(baseSlopeX + detailSlopeX), 1, -(baseSlopeZ + detailSlopeZ))
    .normalize();
}

export function sampleNurbsWaterSurfaceHeight({
  x,
  z,
  width,
  depth,
  waveHeight,
  waveChoppiness,
  waveSpeed,
  interactionState = null,
}) {
  return (
    sampleWaveHeight(x, z, waveHeight, waveChoppiness, waveSpeed) +
    sampleWaterInteractionHeight(x, z, width, depth, interactionState)
  );
}

export function sampleNurbsWaterSurfaceNormal({
  x,
  z,
  width,
  depth,
  waveHeight,
  waveChoppiness,
  waveSpeed,
  interactionState = null,
  target = new THREE.Vector3(),
}) {
  const base = sampleWaveNormal(x, z, waveHeight, waveChoppiness, waveSpeed);

  if (!interactionState) {
    return target.set(base.x, base.y, base.z).normalize();
  }

  const interactionNormal = sampleWaterInteractionNormal(
    x,
    z,
    width,
    depth,
    interactionState
  );

  return combineWaterSurfaceNormals(
    new THREE.Vector3(base.x, base.y, base.z),
    interactionNormal,
    target
  );
}

function stepWaterInteractionState(state, config, pointerTarget) {
  const { current, next, previous, size, texture, textureData } = state;
  const planeWidth = Math.max(config.width, 0.0001);
  const planeDepth = Math.max(config.depth, 0.0001);

  for (let y = 0; y < size; y += 1) {
    const v = y / (size - 1);
    const worldZ = (0.5 - v) * planeDepth;
    const northRow = Math.max(y - 1, 0) * size;
    const row = y * size;
    const southRow = Math.min(y + 1, size - 1) * size;

    for (let x = 0; x < size; x += 1) {
      const u = x / (size - 1);
      const worldX = (u - 0.5) * planeWidth;
      const westIndex = row + Math.max(x - 1, 0);
      const eastIndex = row + Math.min(x + 1, size - 1);
      const index = row + x;
      const north = current[northRow + x];
      const south = current[southRow + x];
      const east = current[eastIndex];
      const west = current[westIndex];
      let nextHeight =
        ((north + south + east + west) * 0.5 - previous[index]) *
        config.viscosity;

      if (config.enabled && pointerTarget.active) {
        const dx = worldX - pointerTarget.x;
        const dz = worldZ - pointerTarget.z;
        const phase = Math.min(
          Math.PI,
          (Math.sqrt(dx * dx + dz * dz) * Math.PI) /
            Math.max(config.radius, 0.0001)
        );

        nextHeight -= (Math.cos(phase) + 1) * config.rippleDepth;
      }

      next[index] = nextHeight;
    }
  }

  const nextState = state;

  nextState.previous = current;
  nextState.current = next;
  nextState.next = previous;

  for (let index = 0; index < size * size; index += 1) {
    const offset = index * 4;

    textureData[offset] = nextState.current[index];
    textureData[offset + 1] = nextState.previous[index];
    textureData[offset + 2] = 0;
    textureData[offset + 3] = 1;
  }

  texture.needsUpdate = true;

  return nextState;
}

export default function useNurbsWaterInteractionRuntime({
  depth,
  enabled = false,
  radius = 0.28,
  resolution = 96,
  rippleDepth = 0.012,
  viscosity = 0.92,
  width,
}) {
  const pointerTargetRef = useRef({ active: false, x: 0, z: 0 });
  const interactionState = useMemo(
    () => createInteractionState(resolution),
    [resolution]
  );
  const interactionStateRef = useRef(interactionState);
  const configRef = useRef({
    depth,
    enabled,
    radius,
    rippleDepth,
    viscosity,
    width,
  });

  interactionStateRef.current = interactionState;
  configRef.current = {
    depth,
    enabled,
    radius,
    rippleDepth,
    viscosity,
    width,
  };

  const setPointerTarget = useCallback((x, z) => {
    pointerTargetRef.current.active = true;
    pointerTargetRef.current.x = x;
    pointerTargetRef.current.z = z;
  }, []);

  const clearPointerTarget = useCallback(() => {
    pointerTargetRef.current.active = false;
  }, []);

  const reset = useCallback(() => {
    clearPointerTarget();
    resetWaterInteractionState(interactionStateRef.current);
  }, [clearPointerTarget]);

  const advance = useCallback((delta) => {
    const boundedDelta = Math.min(Math.max(delta, 0), MAX_RUNTIME_STEP);

    if (boundedDelta <= 0 || !configRef.current.enabled) {
      return;
    }

    stepWaterInteractionState(
      interactionStateRef.current,
      configRef.current,
      pointerTargetRef.current
    );
  }, []);

  const sampleHeight = useCallback(
    (x, z, waveHeight, waveChoppiness, waveSpeed) =>
      sampleNurbsWaterSurfaceHeight({
        x,
        z,
        width: configRef.current.width,
        depth: configRef.current.depth,
        waveHeight,
        waveChoppiness,
        waveSpeed,
        interactionState: interactionStateRef.current,
      }),
    []
  );

  const sampleNormal = useCallback(
    (x, z, waveHeight, waveChoppiness, waveSpeed, target) =>
      sampleNurbsWaterSurfaceNormal({
        x,
        z,
        width: configRef.current.width,
        depth: configRef.current.depth,
        waveHeight,
        waveChoppiness,
        waveSpeed,
        interactionState: interactionStateRef.current,
        target,
      }),
    []
  );

  useEffect(() => {
    if (!enabled) {
      reset();
    }
  }, [enabled, reset]);

  useEffect(() => () => interactionState.texture.dispose(), [interactionState]);

  return useMemo(
    () => ({
      advance,
      clearPointerTarget,
      configRef,
      interactionStateRef,
      pointerTargetRef,
      reset,
      sampleHeight,
      sampleNormal,
      setPointerTarget,
    }),
    [
      advance,
      clearPointerTarget,
      reset,
      sampleHeight,
      sampleNormal,
      setPointerTarget,
    ]
  );
}
