import * as THREE from 'three';

import { useCallback, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

export const MAX_RIPPLES = 8;

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

const ripplePointScratch = new THREE.Vector2();

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

function sampleRippleHeight(x, z, time, ripples, interaction) {
  if (!interaction.rippleEnabled) {
    return 0;
  }

  let value = 0;

  for (let index = 0; index < ripples.length; index += 1) {
    const ripple = ripples[index];
    const age = time - ripple.start;

    if (ripple.strength > 0 && age >= 0) {
      const radius =
        interaction.rippleRadius + age * interaction.rippleExpansion;
      const dx = x - ripple.x;
      const dz = z - ripple.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance <= radius) {
        const influence =
          1 - THREE.MathUtils.smoothstep(distance, radius * 0.35, radius);
        const decay = Math.exp(-age * interaction.rippleDecay);
        const oscillation = Math.sin(
          distance * interaction.rippleFrequency - age * interaction.rippleSpeed
        );

        value += oscillation * influence * decay * ripple.strength;
      }
    }
  }

  return value;
}

function sampleOceanHeightAt(x, z, time, ocean, interaction, ripples) {
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
    ) +
    sampleRippleHeight(x, z, time, ripples, interaction)
  );
}

function updateColorUniform(uniform, value) {
  uniform.value.set(value);
}

export default function useOceanRuntime({ interaction, ocean }) {
  const lastEmissionTimeRef = useRef(-Infinity);
  const lastRipplePointRef = useRef(
    new THREE.Vector2(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)
  );
  const pointerTargetRef = useRef({ active: false, x: 0, z: 0 });
  const rippleCursorRef = useRef(0);
  const ripplesRef = useRef(
    Array.from({ length: MAX_RIPPLES }, () => ({
      start: -1000,
      strength: 0,
      x: 0,
      z: 0,
    }))
  );
  const timeRef = useRef(0);
  const rippleData = useMemo(
    () =>
      Array.from(
        { length: MAX_RIPPLES },
        () => new THREE.Vector4(0, 0, -1000, 0)
      ),
    []
  );
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
      uRippleRadius: { value: interaction.rippleRadius },
      uRippleExpansion: { value: interaction.rippleExpansion },
      uRippleFrequency: { value: interaction.rippleFrequency },
      uRippleSpeed: { value: interaction.rippleSpeed },
      uRippleDecay: { value: interaction.rippleDecay },
      uRippleVisualStrength: { value: interaction.rippleVisualStrength },
      uRippleData: { value: rippleData },
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
    [interaction, ocean, rippleData]
  );

  const addRipple = useCallback(
    (x, z, strength = interaction.rippleStrength) => {
      if (!interaction.rippleEnabled) {
        return;
      }

      const slot = rippleCursorRef.current % MAX_RIPPLES;
      const ripple = ripplesRef.current[slot];

      ripple.x = x;
      ripple.z = z;
      ripple.start = timeRef.current;
      ripple.strength = strength;
      rippleData[slot].set(x, z, ripple.start, strength);
      rippleCursorRef.current += 1;
    },
    [interaction.rippleEnabled, interaction.rippleStrength, rippleData]
  );

  const setPointerTarget = useCallback((x, z) => {
    pointerTargetRef.current.active = true;
    pointerTargetRef.current.x = x;
    pointerTargetRef.current.z = z;
  }, []);

  const clearPointerTarget = useCallback(() => {
    pointerTargetRef.current.active = false;
  }, []);

  const emitInteractiveRipple = useCallback(
    (x, z) => {
      if (!interaction.rippleEnabled) {
        return;
      }

      const now = timeRef.current;

      if (now - lastEmissionTimeRef.current < interaction.rippleInterval) {
        return;
      }

      ripplePointScratch.set(x, z);

      if (
        lastRipplePointRef.current.distanceToSquared(ripplePointScratch) <
        interaction.rippleMinDistance * interaction.rippleMinDistance
      ) {
        return;
      }

      lastEmissionTimeRef.current = now;
      lastRipplePointRef.current.copy(ripplePointScratch);
      addRipple(x, z, interaction.rippleStrength);
    },
    [
      addRipple,
      interaction.rippleEnabled,
      interaction.rippleInterval,
      interaction.rippleMinDistance,
      interaction.rippleStrength,
    ]
  );

  const sampleHeight = useCallback(
    (x, z) =>
      sampleOceanHeightAt(
        x,
        z,
        timeRef.current,
        ocean,
        interaction,
        ripplesRef.current
      ),
    [interaction, ocean]
  );

  const sampleNormal = useCallback(
    (x, z, target = new THREE.Vector3()) => {
      const epsilon = Math.max(0.01, ocean.normalEpsilon);
      const left = sampleOceanHeightAt(
        x - epsilon,
        z,
        timeRef.current,
        ocean,
        interaction,
        ripplesRef.current
      );
      const right = sampleOceanHeightAt(
        x + epsilon,
        z,
        timeRef.current,
        ocean,
        interaction,
        ripplesRef.current
      );
      const back = sampleOceanHeightAt(
        x,
        z - epsilon,
        timeRef.current,
        ocean,
        interaction,
        ripplesRef.current
      );
      const front = sampleOceanHeightAt(
        x,
        z + epsilon,
        timeRef.current,
        ocean,
        interaction,
        ripplesRef.current
      );

      return target.set(left - right, epsilon * 2, back - front).normalize();
    },
    [interaction, ocean]
  );

  useFrame((_, delta) => {
    timeRef.current += delta;
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
    uniforms.uRippleRadius.value = interaction.rippleRadius;
    uniforms.uRippleExpansion.value = interaction.rippleExpansion;
    uniforms.uRippleFrequency.value = interaction.rippleFrequency;
    uniforms.uRippleSpeed.value = interaction.rippleSpeed;
    uniforms.uRippleDecay.value = interaction.rippleDecay;
    uniforms.uRippleVisualStrength.value = interaction.rippleVisualStrength;
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

    for (let index = 0; index < ripplesRef.current.length; index += 1) {
      const ripple = ripplesRef.current[index];

      if (timeRef.current - ripple.start > 8) {
        ripple.strength = 0;
        rippleData[index].w = 0;
      }
    }
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
