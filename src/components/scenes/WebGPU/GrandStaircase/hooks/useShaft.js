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
  advanceRise,
  axisOriginFor,
  fbm1,
  fillProfile,
  riseAt,
  spinAt,
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
    const wallData = new Float32Array(SLICE_COUNT * 4);
    const landingData = new Float32Array(MAX_LANDINGS * 4);
    const landingAxisData = new Float32Array(MAX_LANDINGS * 4);
    const mouthData = new Float32Array(MAX_MOUTHS * 4);
    const mouthExtraData = new Float32Array(MAX_MOUTHS * 4);
    const flareData = new Float32Array(MAX_FLARES * 4);
    return {
      arrays: {
        axisData,
        angleData,
        lightData,
        wallData,
        landingData,
        landingAxisData,
        mouthData,
        mouthExtraData,
        flareData,
      },
      axisTexture: createProfileTexture(axisData),
      angleTexture: createProfileTexture(angleData),
      lightTexture: createProfileTexture(lightData),
      wallTexture: createProfileTexture(wallData),
      mouthTexture: createProfileTexture(mouthData, MAX_MOUTHS),
      mouthExtraTexture: createProfileTexture(mouthExtraData, MAX_MOUTHS),
      flareTexture: createProfileTexture(flareData, MAX_FLARES),
      flareCountRef: { current: 0 },
      landingAttribute: new THREE.InstancedBufferAttribute(landingData, 4),
      landingAxisAttribute: new THREE.InstancedBufferAttribute(
        landingAxisData,
        4
      ),
      landingCountRef: { current: 0 },
      uniforms: {
        aboveCamera: uniform(0),
        descent: uniform(0),
        riser: uniform(0.1),
        sBase: uniform(0),
        spin: uniform(0),
        riseSpan: uniform(1),
        sliceCount: uniform(SLICE_COUNT),
        landingWidthScale: uniform(2),
        stairWidth: uniform(6),
        stepsPerTurn: uniform(512),
        wallGap: uniform(2),
        uSpan: uniform(600),
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
      uTopRef: { current: 0 },
    };
  }, []);

  useEffect(
    () => () => {
      shaft.axisTexture.dispose();
      shaft.angleTexture.dispose();
      shaft.lightTexture.dispose();
      shaft.wallTexture.dispose();
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
      columnTighten: config.columnTighten,
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
      spinLock: config.spinLock,
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
      config.columnTighten,
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
      config.spinLock,
      config.voidRadius,
    ]
  );

  const geometry = useMemo(() => {
    const riseWindow = config.aboveCamera + config.belowCamera;
    // Headroom: landing plateaus consume `u` without gaining height, so the
    // path is always longer than the height it covers.
    const uSpan = riseWindow * 1.3;
    const riser = config.risePerTurn / config.stepsPerTurn;
    return {
      instanceCount: Math.min(60000, Math.max(1, Math.ceil(uSpan / riser) + 1)),
      riser,
      riseWindow,
      uSpan,
    };
  }, [
    config.aboveCamera,
    config.belowCamera,
    config.risePerTurn,
    config.stepsPerTurn,
  ]);

  useFrame((_, delta) => {
    const { uniforms, arrays, uTopRef } = shaft;
    const clamped = Math.min(delta, 1 / 20);

    const drift = fbm1(
      descentRef.current / Math.max(1, config.speedDriftWavelength) + 7.7,
      3
    );
    const gate = 1 - config.speedDriftAmount * (0.5 + 0.5 * drift);
    const step = config.fallSpeed * Math.max(0, gate) * clamped;
    descentRef.current += step;

    let landings = collectLandings(
      uTopRef.current,
      geometry.uSpan,
      profileParams
    );
    uTopRef.current = advanceRise(uTopRef.current, step, landings);
    landings = collectLandings(uTopRef.current, geometry.uSpan, profileParams);

    const uTop = uTopRef.current;
    const riseTop = riseAt(uTop, landings);
    shaft.landingCountRef.current = landings.length;

    // `aboveCamera` is metres of height, `uTop` is path — they cannot be
    // added. Walking the rise finds the path position at camera height, so
    // spin and lean stay continuous when the window top leaps a plateau.
    const uAtCamera = advanceRise(uTop, config.aboveCamera, landings);
    const origin = axisOriginFor(uAtCamera, profileParams);
    const spin = spinAt(uAtCamera, profileParams);
    uniforms.spin.value = spin;

    const counts = fillLandingBuffers(
      arrays,
      landings,
      profileParams,
      origin,
      spin,
      riseTop
    );
    shaft.flareCountRef.current = counts.flares;

    const riseSpan = fillProfile(
      arrays,
      uTop,
      geometry.uSpan,
      profileParams,
      landings,
      origin,
      spin
    );

    shaft.axisTexture.needsUpdate = true;
    shaft.angleTexture.needsUpdate = true;
    shaft.lightTexture.needsUpdate = true;
    shaft.wallTexture.needsUpdate = true;
    shaft.mouthTexture.needsUpdate = true;
    shaft.mouthExtraTexture.needsUpdate = true;
    shaft.flareTexture.needsUpdate = true;
    shaft.landingAttribute.needsUpdate = true;
    shaft.landingAxisAttribute.needsUpdate = true;

    const firstStep = Math.ceil(uTop / geometry.riser);
    uniforms.sBase.value = firstStep * geometry.riser - uTop;
    uniforms.descent.value = descentRef.current;
    uniforms.aboveCamera.value = config.aboveCamera;
    uniforms.uSpan.value = geometry.uSpan;
    uniforms.riseSpan.value = riseSpan;
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
