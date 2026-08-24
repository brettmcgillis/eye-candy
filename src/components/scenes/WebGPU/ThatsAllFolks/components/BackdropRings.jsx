/* eslint-disable react/no-array-index-key */
import React, { useMemo } from 'react';

import * as THREE from 'three';

import Halo from '@elements/Halo/Halo';
import getColorsInRange from '@utils/colors';

const LAYER_COUNT = 5;
const GRADIENT_STEPS = 24;
const BACK_START = '#e1a03c';
const FRONT_START = '#ffd975';
const BACK_END = '#6a2314';
const FRONT_END = '#8f2b15';

function createCoreMaterial() {
  return new THREE.MeshStandardMaterial({
    color: '#261cff',
    roughness: 0.5,
    metalness: 0.06,
    emissive: new THREE.Color('#3a2cff'),
    emissiveIntensity: 0.24,
    side: THREE.DoubleSide,
  });
}

function buildGradientRings(
  innerRadius,
  outerRadius,
  startColor,
  endColor,
  steps
) {
  const width = outerRadius - innerRadius;

  return getColorsInRange(startColor, endColor, steps).map((color) => ({
    width: width / steps,
    color,
  }));
}

export default function BackdropRings({
  position = [0, 0, 0],
  outerRadius = 2.2,
  layerDepth = 0.18,
  layerGap = 0.06,
}) {
  const depthStep = layerDepth + layerGap;

  const layerConfigs = useMemo(() => {
    const startColors = getColorsInRange(FRONT_START, BACK_START, LAYER_COUNT);
    const endColors = getColorsInRange(FRONT_END, BACK_END, LAYER_COUNT);

    return Array.from({ length: LAYER_COUNT }, (_value, index) => {
      const t = index / (LAYER_COUNT - 1);
      const layerInnerRadius =
        outerRadius * THREE.MathUtils.lerp(0.44, 0.82, t);
      const layerOuterRadius = outerRadius * THREE.MathUtils.lerp(0.58, 1.0, t);

      return {
        innerRadius: layerInnerRadius,
        outerRadius: layerOuterRadius,
        rings: buildGradientRings(
          layerInnerRadius,
          layerOuterRadius,
          startColors[index],
          endColors[index],
          GRADIENT_STEPS
        ),
        z: index * depthStep,
      };
    });
  }, [depthStep, outerRadius]);

  const coreRadius = useMemo(
    () => layerConfigs[0].innerRadius * 1.02,
    [layerConfigs]
  );

  const coreMaterial = useMemo(() => createCoreMaterial(), []);

  return (
    <group position={position}>
      <mesh material={coreMaterial} position={[0, 0, -depthStep * 0.55]}>
        <circleGeometry args={[coreRadius, 128]} />
      </mesh>

      {layerConfigs.map((layer, index) => (
        <Halo
          key={`backdrop-layer-${index}`}
          rings={layer.rings}
          innerRadius={layer.innerRadius}
          position={[0, 0, layer.z]}
        />
      ))}
    </group>
  );
}
