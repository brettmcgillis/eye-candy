import { useEffect, useMemo, useState } from 'react';

import { folder, useControls } from 'leva';
import * as THREE from 'three';

import algorithms from '@utils/particleAlgorithms';

export default function useParticleLabControls() {
  const algorithmKeys = useMemo(() => Object.keys(algorithms), []);

  const baseControls = useControls(
    'Particle Lab',
    {
      Fractal: folder(
        {
          algorithm: {
            value: 'Abyssal Jellyfish',
            options: algorithmKeys,
          },
          pointsCount: {
            label: 'Point Count',
            value: 150000,
            min: 10000,
            max: 300000,
            step: 5000,
          },
          animatePoints: { value: false },
        },
        { collapsed: true }
      ),
      Styling: folder(
        {
          color1: { label: 'Core Color', value: '#ff0055' },
          color2: { label: 'Mid Color', value: '#4422ff' },
          color3: { label: 'Edge Color', value: '#00ffff' },
          backgroundColor: { label: 'Background', value: '#020205' },
          pointSize: {
            label: 'Point Size',
            value: 0.046,
            min: 0.01,
            max: 0.2,
            step: 0.001,
          },
          opacity: { value: 1.0, min: 0.05, max: 1.0, step: 0.01 },
          transparent: { value: true },
          blendingMode: {
            label: 'Blending',
            value: 'Additive',
            options: ['Additive', 'Normal', 'Subtractive', 'Multiply'],
          },
          alphaTest: {
            label: 'Alpha Test',
            value: 0.01,
            min: 0,
            max: 1,
            step: 0.001,
          },
          depthWrite: { value: false },
          depthTest: { value: true },
          premultipliedAlpha: { value: false },
        },
        { collapsed: true }
      ),
      Transform: folder(
        {
          rotationX: {
            label: 'Rotation X',
            value: 0,
            min: 0,
            max: 360,
            step: 1,
          },
          rotationY: {
            label: 'Rotation Y',
            value: 0,
            min: 0,
            max: 360,
            step: 1,
          },
          rotationZ: {
            label: 'Rotation Z',
            value: 0,
            min: 0,
            max: 360,
            step: 1,
          },
          autoRotate: { label: 'Auto Rotate', value: false },
          autoRotateSpeed: {
            label: 'Rotate Speed',
            value: 1.0,
            min: -10,
            max: 10,
            step: 0.1,
          },
        },
        { collapsed: true }
      ),
    },
    { collapsed: true }
  );

  const selectedAlgorithm = algorithms[baseControls.algorithm];
  const [paramState, setParamState] = useState(() => ({
    ...selectedAlgorithm.defaults,
  }));

  const [, setAlgorithmControls] = useControls(
    'Particle Lab Parameters',
    () => {
      const schema = {};
      const labels = selectedAlgorithm.labels || {};
      Object.keys(selectedAlgorithm.ranges).forEach((key) => {
        const [min, max, step = 0.01] = selectedAlgorithm.ranges[key];
        schema[key] = {
          value: selectedAlgorithm.defaults[key],
          min,
          max,
          step,
          ...(labels[key] ? { label: labels[key] } : {}),
          onChange: (nextValue) => {
            const value = Number(nextValue);
            if (!Number.isFinite(value)) return;
            setParamState((prev) => {
              if (prev[key] === value) return prev;
              return { ...prev, [key]: value };
            });
          },
        };
      });
      return schema;
    },
    [baseControls.algorithm]
  );

  useEffect(() => {
    const nextDefaults = { ...selectedAlgorithm.defaults };
    setParamState(nextDefaults);
    setAlgorithmControls(nextDefaults);
  }, [
    baseControls.algorithm,
    selectedAlgorithm.defaults,
    setAlgorithmControls,
  ]);

  const resolvedParams = { ...selectedAlgorithm.defaults };
  Object.keys(selectedAlgorithm.defaults).forEach((key) => {
    const value = Number(paramState[key]);
    resolvedParams[key] = Number.isFinite(value) ? value : resolvedParams[key];
  });

  const paramsKey = `${baseControls.algorithm}:${Object.keys(resolvedParams)
    .map((key) => `${key}:${resolvedParams[key]}`)
    .join('|')}`;

  return {
    ...baseControls,
    params: resolvedParams,
    paramsKey,
    rotationRadians: {
      x: THREE.MathUtils.degToRad(baseControls.rotationX),
      y: THREE.MathUtils.degToRad(baseControls.rotationY),
      z: THREE.MathUtils.degToRad(baseControls.rotationZ),
    },
  };
}
