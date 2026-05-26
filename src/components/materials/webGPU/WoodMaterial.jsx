import * as THREE from 'three';
import {
  Finishes,
  GetWoodPreset,
  WoodGenuses,
  WoodNodeMaterial,
} from 'three/addons/materials/WoodNodeMaterial.js';

import React, { useEffect, useMemo } from 'react';

import { useThree } from '@react-three/fiber';

const MIN_DIMENSION = 0.0001;

export const DEFAULT_WOOD_FINISH = 'matte';
export const DEFAULT_WOOD_GENUS = 'white_oak';
export const WOOD_FINISH_OPTIONS = [...Finishes];
export const WOOD_GENUS_OPTIONS = [...WoodGenuses];

const DEFAULT_GRAIN_OFFSET = Object.freeze([0, 0, 0]);
const DEFAULT_GRAIN_ROTATION = Object.freeze([0, 0, 0]);
const DEFAULT_GRAIN_SCALE = Object.freeze([1, 1, 1]);

const sharedEuler = new THREE.Euler();

function toHexString(colorValue) {
  return `#${new THREE.Color(colorValue).getHexString()}`;
}

function resolveVector3(input, fallback) {
  if (!Array.isArray(input)) {
    return fallback;
  }

  return input.map((value, index) => {
    return Number.isFinite(value) ? value : fallback[index];
  });
}

function buildTransformationMatrix({
  dimensions,
  grainOffset,
  grainRotation,
  grainScale,
}) {
  const [width, height, depth] = dimensions.map((value) => {
    return Math.max(Math.abs(value) || 0, MIN_DIMENSION);
  });
  const [offsetX, offsetY, offsetZ] = resolveVector3(
    grainOffset,
    DEFAULT_GRAIN_OFFSET
  );
  const [rotationX, rotationY, rotationZ] = resolveVector3(
    grainRotation,
    DEFAULT_GRAIN_ROTATION
  );
  const [scaleX, scaleY, scaleZ] = resolveVector3(
    grainScale,
    DEFAULT_GRAIN_SCALE
  );
  const translationMatrix = new THREE.Matrix4();
  const rotationMatrix = new THREE.Matrix4();
  const scaleMatrix = new THREE.Matrix4();
  const transformationMatrix = new THREE.Matrix4();

  sharedEuler.set(
    THREE.MathUtils.degToRad(rotationX),
    THREE.MathUtils.degToRad(rotationY),
    THREE.MathUtils.degToRad(rotationZ)
  );
  translationMatrix.makeTranslation(offsetX, offsetY, offsetZ);
  rotationMatrix.makeRotationFromEuler(sharedEuler);
  scaleMatrix.makeScale(scaleX / width, scaleY / height, scaleZ / depth);

  transformationMatrix.multiplyMatrices(translationMatrix, rotationMatrix);
  transformationMatrix.multiply(scaleMatrix);

  return transformationMatrix;
}

export function getWoodMaterialPresetValues(
  genus = DEFAULT_WOOD_GENUS,
  finish = DEFAULT_WOOD_FINISH
) {
  const preset = GetWoodPreset(genus, finish);

  return {
    barkThickness: preset.barkThickness,
    cellScale: preset.cellScale,
    cellSize: preset.cellSize,
    centerSize: preset.centerSize,
    clearcoat: preset.clearcoat,
    clearcoatRoughness: preset.clearcoatRoughness,
    darkGrainColor: toHexString(preset.darkGrainColor),
    fineWarpScale: preset.fineWarpScale,
    fineWarpStrength: preset.fineWarpStrength,
    largeGrainStretch: preset.largeGrainStretch,
    largeWarpScale: preset.largeWarpScale,
    lightGrainColor: toHexString(preset.lightGrainColor),
    ringBias: preset.ringBias,
    ringSizeVariance: preset.ringSizeVariance,
    ringThickness: preset.ringThickness,
    ringVarianceScale: preset.ringVarianceScale,
    smallWarpScale: preset.smallWarpScale,
    smallWarpStrength: preset.smallWarpStrength,
    splotchIntensity: preset.splotchIntensity,
    splotchScale: preset.splotchScale,
  };
}

export default function WoodMaterial({
  barkThickness,
  cellScale,
  cellSize,
  centerSize,
  clearcoat,
  clearcoatRoughness,
  darkGrainColor,
  dimensions = [1, 1, 1],
  fallbackColor = '#bca88c',
  fineWarpScale,
  fineWarpStrength,
  grainOffset = DEFAULT_GRAIN_OFFSET,
  grainRotation = DEFAULT_GRAIN_ROTATION,
  grainScale = DEFAULT_GRAIN_SCALE,
  largeGrainStretch,
  largeWarpScale,
  lightGrainColor,
  metalness = 0,
  ringBias,
  ringSizeVariance,
  ringThickness,
  ringVarianceScale,
  roughness = 0.78,
  smallWarpScale,
  smallWarpStrength,
  splotchIntensity,
  splotchScale,
}) {
  const gl = useThree((state) => state.gl);
  const supportsWoodMaterial =
    gl?.backend?.isWebGPUBackend === true &&
    Boolean(gl?.backend?.device) &&
    Boolean(gl?.backend?.context) &&
    typeof navigator !== 'undefined' &&
    Boolean(navigator.gpu);
  const woodMaterial = useMemo(() => {
    if (!supportsWoodMaterial) {
      return null;
    }

    const nextMaterial = new WoodNodeMaterial({
      barkThickness,
      cellScale,
      cellSize,
      centerSize,
      clearcoat,
      clearcoatRoughness,
      darkGrainColor,
      fineWarpScale,
      fineWarpStrength,
      largeGrainStretch,
      largeWarpScale,
      lightGrainColor,
      ringBias,
      ringSizeVariance,
      ringThickness,
      ringVarianceScale,
      smallWarpScale,
      smallWarpStrength,
      splotchIntensity,
      splotchScale,
      transformationMatrix: buildTransformationMatrix({
        dimensions,
        grainOffset,
        grainRotation,
        grainScale,
      }),
    });

    nextMaterial.metalness = metalness;
    nextMaterial.roughness = roughness;

    return nextMaterial;
  }, [
    barkThickness,
    cellScale,
    cellSize,
    centerSize,
    clearcoat,
    clearcoatRoughness,
    darkGrainColor,
    dimensions,
    fineWarpScale,
    fineWarpStrength,
    grainOffset,
    grainRotation,
    grainScale,
    largeGrainStretch,
    largeWarpScale,
    lightGrainColor,
    metalness,
    ringBias,
    ringSizeVariance,
    ringThickness,
    ringVarianceScale,
    roughness,
    smallWarpScale,
    smallWarpStrength,
    splotchIntensity,
    splotchScale,
    supportsWoodMaterial,
  ]);

  useEffect(() => {
    return () => {
      woodMaterial?.dispose();
    };
  }, [woodMaterial]);

  if (!supportsWoodMaterial || !woodMaterial) {
    return (
      <meshStandardMaterial
        color={fallbackColor}
        metalness={metalness}
        roughness={roughness}
      />
    );
  }

  return <primitive attach="material" object={woodMaterial} />;
}
