import * as THREE from 'three';

import { useCallback, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

export const MAX_RIPPLES = 8;

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

function toSimulationUv(x, z, bounds) {
  return {
    u: x / bounds + 0.5,
    v: 0.5 - z / bounds,
  };
}

function sampleInteractionHeightAt(x, z, bounds, state) {
  const { current, size } = state;
  const { u, v } = toSimulationUv(x, z, bounds);

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

function stepInteractionState(state, interaction, pointerTarget) {
  const { bounds } = interaction;
  const { current, next, previous, size, texture, textureData } = state;

  for (let y = 0; y < size; y += 1) {
    const v = y / (size - 1);
    const worldZ = (0.5 - v) * bounds;
    const northRow = Math.max(y - 1, 0) * size;
    const row = y * size;
    const southRow = Math.min(y + 1, size - 1) * size;

    for (let x = 0; x < size; x += 1) {
      const u = x / (size - 1);
      const worldX = (u - 0.5) * bounds;
      const westIndex = row + Math.max(x - 1, 0);
      const eastIndex = row + Math.min(x + 1, size - 1);
      const index = row + x;
      const north = current[northRow + x];
      const south = current[southRow + x];
      const east = current[eastIndex];
      const west = current[westIndex];
      let nextHeight =
        ((north + south + east + west) * 0.5 - previous[index]) *
        interaction.viscosity;

      if (interaction.enabled && pointerTarget.active) {
        const dx = worldX - pointerTarget.x;
        const dz = worldZ - pointerTarget.z;
        const phase = Math.min(
          Math.PI,
          (Math.sqrt(dx * dx + dz * dz) * Math.PI) /
            Math.max(interaction.radius, 0.0001)
        );

        nextHeight -= (Math.cos(phase) + 1) * interaction.depth;
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

const SWELL_WAVES = [
  { x: 0.86, z: 0.51, freq: 0.42, amp: 1.0 },
  { x: -0.34, z: 0.94, freq: 0.66, amp: 0.72 },
  { x: 0.57, z: -0.82, freq: 0.92, amp: 0.48 },
];

const CHOP_WAVES = [
  { x: 0.91, z: -0.21, freq: 1.55, amp: 1.0 },
  { x: -0.72, z: -0.69, freq: 2.1, amp: 0.65 },
  { x: 0.18, z: 0.98, freq: 2.65, amp: 0.4 },
];

const DETAIL_WAVES = [
  { x: -0.9, z: 0.43, freq: 4.2, amp: 1.0 },
  { x: 0.49, z: 0.87, freq: 5.1, amp: 0.58 },
  { x: -0.17, z: -0.98, freq: 6.6, amp: 0.32 },
];

function normalizeWaveSet(waves) {
  return waves.map((wave) => {
    const direction = new THREE.Vector2(wave.x, wave.z).normalize();

    return {
      amp: wave.amp,
      freq: wave.freq,
      x: direction.x,
      z: direction.y,
    };
  });
}

const SWELL = normalizeWaveSet(SWELL_WAVES);
const CHOP = normalizeWaveSet(CHOP_WAVES);
const DETAIL = normalizeWaveSet(DETAIL_WAVES);

function sampleWaveSet(
  x,
  z,
  time,
  waves,
  amplitude,
  frequencyScale,
  speedScale
) {
  let value = 0;

  for (let index = 0; index < waves.length; index += 1) {
    const wave = waves[index];
    const theta =
      (wave.x * x + wave.z * z) * wave.freq * frequencyScale +
      time * speedScale * (0.55 + index * 0.23);

    value += Math.sin(theta) * wave.amp * amplitude;
  }

  return value;
}

function sampleOceanHeightAt(x, z, time, ocean) {
  return (
    sampleWaveSet(
      x,
      z,
      time,
      SWELL,
      ocean.swellAmplitude,
      ocean.swellFrequency,
      ocean.swellSpeed
    ) +
    sampleWaveSet(
      x,
      z,
      time,
      CHOP,
      ocean.chopAmplitude,
      ocean.chopFrequency,
      ocean.chopSpeed
    ) +
    sampleWaveSet(
      x,
      z,
      time,
      DETAIL,
      ocean.detailAmplitude,
      ocean.detailFrequency,
      ocean.detailSpeed
    )
  );
}

function updateColorUniform(uniform, value) {
  uniform.value.set(value);
}

export default function useOceanRuntime({ interaction, ocean }) {
  const interactionStateRef = useRef();
  const pointerTargetRef = useRef({ active: false, x: 0, z: 0 });
  const timeRef = useRef(0);
  const interactionState = useMemo(
    () => createInteractionState(interaction.resolution),
    [interaction.resolution]
  );

  interactionStateRef.current = interactionState;

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSwellAmplitude: { value: ocean.swellAmplitude },
      uSwellFrequency: { value: ocean.swellFrequency },
      uSwellSpeed: { value: ocean.swellSpeed },
      uChopAmplitude: { value: ocean.chopAmplitude },
      uChopFrequency: { value: ocean.chopFrequency },
      uChopSpeed: { value: ocean.chopSpeed },
      uDetailAmplitude: { value: ocean.detailAmplitude },
      uDetailFrequency: { value: ocean.detailFrequency },
      uDetailSpeed: { value: ocean.detailSpeed },
      uNormalEpsilon: { value: ocean.normalEpsilon },
      uInteractionBounds: { value: interaction.bounds },
      uInteractionHeightmap: { value: interactionState.texture },
      uDeepColor: { value: new THREE.Color(ocean.deepColor) },
      uShallowColor: { value: new THREE.Color(ocean.shallowColor) },
      uHorizonColor: { value: new THREE.Color(ocean.horizonColor) },
      uFoamColor: { value: new THREE.Color(ocean.foamColor) },
      uFresnelPower: { value: ocean.fresnelPower },
      uFresnelStrength: { value: ocean.fresnelStrength },
      uFoamStrength: { value: ocean.foamStrength },
      uFoamThreshold: { value: ocean.foamThreshold },
      uFoamSoftness: { value: ocean.foamSoftness },
      uFoamWaveInfluence: { value: ocean.foamWaveInfluence },
    }),
    [interaction.bounds, interactionState.texture, ocean]
  );

  const setPointerTarget = useCallback((x, z) => {
    pointerTargetRef.current.active = true;
    pointerTargetRef.current.x = x;
    pointerTargetRef.current.z = z;
  }, []);

  const clearPointerTarget = useCallback(() => {
    pointerTargetRef.current.active = false;
  }, []);

  const addRipple = useCallback(
    (x, z) => {
      if (!interaction.enabled) {
        return;
      }

      setPointerTarget(x, z);
    },
    [interaction.enabled, setPointerTarget]
  );

  const emitInteractiveRipple = useCallback(
    (x, z) => {
      if (!interaction.enabled) {
        return;
      }

      setPointerTarget(x, z);
    },
    [interaction.enabled, setPointerTarget]
  );

  const sampleHeight = useCallback(
    (x, z) => {
      const baseHeight = sampleOceanHeightAt(x, z, timeRef.current, ocean);

      return (
        baseHeight +
        sampleInteractionHeightAt(
          x,
          z,
          interaction.bounds,
          interactionStateRef.current
        )
      );
    },
    [interaction, ocean]
  );

  const sampleNormal = useCallback(
    (x, z, target = new THREE.Vector3()) => {
      const epsilon = Math.max(0.01, ocean.normalEpsilon);
      const left = sampleHeight(x - epsilon, z);
      const right = sampleHeight(x + epsilon, z);
      const back = sampleHeight(x, z - epsilon);
      const front = sampleHeight(x, z + epsilon);

      return target.set(left - right, epsilon * 2, back - front).normalize();
    },
    [ocean.normalEpsilon, sampleHeight]
  );

  useFrame((_, delta) => {
    timeRef.current += delta;

    interactionStateRef.current = stepInteractionState(
      interactionStateRef.current,
      interaction,
      pointerTargetRef.current
    );

    uniforms.uTime.value = timeRef.current;
    uniforms.uSwellAmplitude.value = ocean.swellAmplitude;
    uniforms.uSwellFrequency.value = ocean.swellFrequency;
    uniforms.uSwellSpeed.value = ocean.swellSpeed;
    uniforms.uChopAmplitude.value = ocean.chopAmplitude;
    uniforms.uChopFrequency.value = ocean.chopFrequency;
    uniforms.uChopSpeed.value = ocean.chopSpeed;
    uniforms.uDetailAmplitude.value = ocean.detailAmplitude;
    uniforms.uDetailFrequency.value = ocean.detailFrequency;
    uniforms.uDetailSpeed.value = ocean.detailSpeed;
    uniforms.uNormalEpsilon.value = ocean.normalEpsilon;
    uniforms.uInteractionBounds.value = interaction.bounds;
    uniforms.uInteractionHeightmap.value = interactionStateRef.current.texture;
    uniforms.uFresnelPower.value = ocean.fresnelPower;
    uniforms.uFresnelStrength.value = ocean.fresnelStrength;
    uniforms.uFoamStrength.value = ocean.foamStrength;
    uniforms.uFoamThreshold.value = ocean.foamThreshold;
    uniforms.uFoamSoftness.value = ocean.foamSoftness;
    uniforms.uFoamWaveInfluence.value = ocean.foamWaveInfluence;

    updateColorUniform(uniforms.uDeepColor, ocean.deepColor);
    updateColorUniform(uniforms.uShallowColor, ocean.shallowColor);
    updateColorUniform(uniforms.uHorizonColor, ocean.horizonColor);
    updateColorUniform(uniforms.uFoamColor, ocean.foamColor);
  });

  return {
    addRipple,
    clearPointerTarget,
    emitInteractiveRipple,
    pointerTargetRef,
    sampleHeight,
    sampleNormal,
    setPointerTarget,
    timeRef,
    uniforms,
  };
}
