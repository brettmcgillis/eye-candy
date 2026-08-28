import { useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { uniform } from 'three/tsl';
import * as THREE from 'three/webgpu';

import {
  MAX_FLARES,
  MAX_LANDINGS,
  MAX_MOUTHS,
  collectLandings,
  fillLandingBuffers,
} from '../utils/landings';
import {
  SLICE_COUNT,
  axisOriginFor,
  fbm1,
  fillProfile,
} from '../utils/shaftProfile';

function createProfileTexture(data, width = SLICE_COUNT) {
  const texture = new THREE.DataTexture(
    data,
    width,
    1,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

export default function useShaft(config) {
  const descentRef = useRef(0);

  const shaft = useMemo(() => {
    const axisData = new Float32Array(SLICE_COUNT * 4);
    const angleData = new Float32Array(SLICE_COUNT * 4);
    const lightData = new Float32Array(SLICE_COUNT * 4);
    const landingData = new Float32Array(MAX_LANDINGS * 4);
    const mouthData = new Float32Array(MAX_MOUTHS * 4);
    const mouthExtraData = new Float32Array(MAX_MOUTHS * 4);
    const flareData = new Float32Array(MAX_FLARES * 4);
    return {
      arrays: {
        axisData,
        angleData,
        lightData,
        landingData,
        mouthData,
        mouthExtraData,
        flareData,
      },
      axisTexture: createProfileTexture(axisData),
      angleTexture: createProfileTexture(angleData),
      lightTexture: createProfileTexture(lightData),
      mouthTexture: createProfileTexture(mouthData, MAX_MOUTHS),
      mouthExtraTexture: createProfileTexture(mouthExtraData, MAX_MOUTHS),
      flareTexture: createProfileTexture(flareData, MAX_FLARES),
      flareCountRef: { current: 0 },
      landingAttribute: new THREE.InstancedBufferAttribute(landingData, 4),
      landingCountRef: { current: 0 },
      uniforms: {
        aboveCamera: uniform(0),
        descent: uniform(0),
        riser: uniform(0.1),
        sBase: uniform(0),
        sliceCount: uniform(SLICE_COUNT),
        landingWidthScale: uniform(2),
        stairWidth: uniform(6),
        stepsPerTurn: uniform(512),
        wallGap: uniform(2),
        windowDepth: uniform(600),
      },
      surface: {
        inkAmount: uniform(0),
        inkFlow: uniform(0.01),
        inkScale: uniform(0.06),
        inkThreshold: uniform(0.62),
        inkWarp: uniform(4),
        mottleAmount: uniform(0.12),
        mottleScale: uniform(0.35),
      },
      windowTopRef: { current: 0 },
    };
  }, []);

  useEffect(
    () => () => {
      shaft.axisTexture.dispose();
      shaft.angleTexture.dispose();
      shaft.lightTexture.dispose();
      shaft.mouthTexture.dispose();
      shaft.mouthExtraTexture.dispose();
      shaft.flareTexture.dispose();
    },
    [shaft]
  );

  const profileParams = useMemo(
    () => ({
      aboveCamera: config.aboveCamera,
      flareHeight: config.flareHeight,
      flareIntensity: config.flareIntensity,
      flareLandingChance: config.flareLandingChance,
      landingWidthScale: config.landingWidthScale,
      mouthWidth: config.mouthWidth,
      roomDepth: config.roomDepth,
      stairWidth: config.stairWidth,
      tunnelLength: config.tunnelLength,
      wallGap: config.wallGap,
      axisDriftAmount: config.axisDriftAmount,
      axisDriftWavelength: config.axisDriftWavelength,
      clockwise: config.clockwise,
      columnRecovery: config.columnRecovery,
      flareRoomChance: config.flareRoomChance,
      landingArc: config.landingArc,
      landingDriftAmount: config.landingDriftAmount,
      landingDriftPeriod: config.landingDriftPeriod,
      landingSpacing: config.landingSpacing,
      mouthChanceNone: config.mouthChanceNone,
      mouthChanceOne: config.mouthChanceOne,
      mouthHeight: config.mouthHeight,
      mouthSill: config.mouthSill,
      overlapAmount: config.overlapAmount,
      overlapWavelength: config.overlapWavelength,
      radiusDriftAmount: config.radiusDriftAmount,
      radiusDriftWavelength: config.radiusDriftWavelength,
      risePerTurn: config.risePerTurn,
      shaftFalloff: config.shaftFalloff,
      shaftFloor: config.shaftFloor,
      voidRadius: config.voidRadius,
    }),
    [
      config.aboveCamera,
      config.flareHeight,
      config.flareIntensity,
      config.flareLandingChance,
      config.landingWidthScale,
      config.mouthWidth,
      config.roomDepth,
      config.stairWidth,
      config.tunnelLength,
      config.wallGap,
      config.axisDriftAmount,
      config.axisDriftWavelength,
      config.clockwise,
      config.columnRecovery,
      config.flareRoomChance,
      config.landingArc,
      config.landingDriftAmount,
      config.landingDriftPeriod,
      config.landingSpacing,
      config.mouthChanceNone,
      config.mouthChanceOne,
      config.mouthHeight,
      config.mouthSill,
      config.overlapAmount,
      config.overlapWavelength,
      config.radiusDriftAmount,
      config.radiusDriftWavelength,
      config.risePerTurn,
      config.shaftFalloff,
      config.shaftFloor,
      config.voidRadius,
    ]
  );

  const geometry = useMemo(() => {
    const windowDepth = config.aboveCamera + config.belowCamera;
    const riser = config.risePerTurn / config.stepsPerTurn;
    return {
      instanceCount: Math.min(
        60000,
        Math.max(1, Math.ceil(windowDepth / riser) + 1)
      ),
      riser,
      windowDepth,
    };
  }, [
    config.aboveCamera,
    config.belowCamera,
    config.risePerTurn,
    config.stepsPerTurn,
  ]);

  useFrame((_, delta) => {
    const { uniforms, arrays, windowTopRef } = shaft;
    const clamped = Math.min(delta, 1 / 20);

    const drift = fbm1(
      descentRef.current / Math.max(1, config.speedDriftWavelength) + 7.7,
      3
    );
    const gate = 1 - config.speedDriftAmount * (0.5 + 0.5 * drift);
    descentRef.current += config.fallSpeed * Math.max(0, gate) * clamped;

    const windowTop = descentRef.current - config.aboveCamera;
    windowTopRef.current = windowTop;

    const landings = collectLandings(
      windowTop,
      geometry.windowDepth,
      profileParams
    );
    shaft.landingCountRef.current = landings.length;
    const origin = axisOriginFor(windowTop, profileParams);
    const counts = fillLandingBuffers(arrays, landings, profileParams, origin);
    shaft.flareCountRef.current = counts.flares;
    fillProfile(
      arrays,
      windowTop,
      geometry.windowDepth,
      profileParams,
      landings,
      origin
    );

    shaft.axisTexture.needsUpdate = true;
    shaft.angleTexture.needsUpdate = true;
    shaft.lightTexture.needsUpdate = true;
    shaft.mouthTexture.needsUpdate = true;
    shaft.mouthExtraTexture.needsUpdate = true;
    shaft.flareTexture.needsUpdate = true;
    shaft.landingAttribute.needsUpdate = true;

    const firstStep = Math.ceil(windowTop / geometry.riser);
    uniforms.sBase.value = firstStep * geometry.riser - windowTop;
    uniforms.descent.value = descentRef.current;
    uniforms.aboveCamera.value = config.aboveCamera;
    uniforms.windowDepth.value = geometry.windowDepth;
    uniforms.riser.value = geometry.riser;
    uniforms.stairWidth.value = config.stairWidth;
    uniforms.stepsPerTurn.value = config.stepsPerTurn;
    uniforms.wallGap.value = config.wallGap;
    uniforms.landingWidthScale.value = config.landingWidthScale;

    const { surface } = shaft;
    surface.inkAmount.value = config.inkAmount;
    surface.inkFlow.value = config.inkFlow;
    surface.inkScale.value = config.inkScale;
    surface.inkThreshold.value = config.inkThreshold;
    surface.inkWarp.value = config.inkWarp;
    surface.mottleAmount.value = config.mottleAmount;
    surface.mottleScale.value = config.mottleScale;
  });

  return useMemo(
    () => ({ ...shaft, ...geometry, descentRef, profileParams }),
    [geometry, profileParams, shaft]
  );
}
