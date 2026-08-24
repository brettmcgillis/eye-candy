/* eslint-disable no-param-reassign */

/* eslint-disable no-underscore-dangle */
import { useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import * as THREE from 'three';

const _base = new THREE.Color();
const _override = new THREE.Color();
const _emissive = new THREE.Color();

function resetMaterials(mats, baseColors) {
  mats.forEach((mat, i) => {
    mat.color.set(baseColors[i]);
    mat.emissive.set(0, 0, 0);
    mat.emissiveIntensity = 0;
  });
}

export default function useSceneAnimation({
  mode,
  color,
  emissive,
  emissiveIntensity,
  speed,
  stackMaterials,
  chipsMaterials,
  colors,
}) {
  const configRef = useRef({});
  configRef.current = {
    mode,
    color,
    emissive,
    emissiveIntensity,
    speed,
    stackMaterials,
    chipsMaterials,
    colors,
  };

  const timeRef = useRef(0);
  const prevModeRef = useRef('None');

  useFrame((_, delta) => {
    const cfg = configRef.current;
    const {
      mode: currentMode,
      stackMaterials: sMats,
      chipsMaterials: cMats,
      colors: baseColors,
    } = cfg;

    if (currentMode === 'None') {
      if (prevModeRef.current !== 'None') {
        resetMaterials(sMats, baseColors);
        resetMaterials(cMats, baseColors);
        timeRef.current = 0;
      }
      prevModeRef.current = currentMode;
      return;
    }

    prevModeRef.current = currentMode;

    if (currentMode === 'Scanner') {
      const {
        color: animColor,
        emissive: animEmissive,
        emissiveIntensity: animEmissiveIntensity,
        speed: animSpeed,
      } = cfg;

      const layerCount = sMats.length;
      const validCount = layerCount - 2; // skip index 0 and N-1
      if (validCount <= 0) return;

      timeRef.current += delta * animSpeed;

      const cycleIndex = Math.floor(timeRef.current) % validCount;
      const stackActiveIndex = layerCount - 2 - cycleIndex; // back → front: N-2 → 1
      const chipsActiveIndex = 1 + cycleIndex; // bottom → top: 1 → N-2
      const pulse = Math.sin((timeRef.current % 1) * Math.PI);

      _override.set(animColor);
      _emissive.set(animEmissive);

      sMats.forEach((mat, i) => {
        _base.set(baseColors[i]);
        if (i === stackActiveIndex) {
          mat.color.copy(_base).lerp(_override, pulse);
          mat.emissive.copy(_emissive);
          mat.emissiveIntensity = animEmissiveIntensity * pulse;
        } else {
          mat.color.copy(_base);
          mat.emissive.set(0, 0, 0);
          mat.emissiveIntensity = 0;
        }
      });

      cMats.forEach((mat, i) => {
        _base.set(baseColors[i]);
        if (i === chipsActiveIndex) {
          mat.color.copy(_base).lerp(_override, pulse);
          mat.emissive.copy(_emissive);
          mat.emissiveIntensity = animEmissiveIntensity * pulse;
        } else {
          mat.color.copy(_base);
          mat.emissive.set(0, 0, 0);
          mat.emissiveIntensity = 0;
        }
      });
    }
  });
}
