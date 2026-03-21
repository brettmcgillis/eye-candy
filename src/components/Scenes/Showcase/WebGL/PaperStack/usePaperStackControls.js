import { button, folder, useControls } from 'leva';
import * as THREE from 'three';

import { useEffect, useMemo, useRef, useState } from 'react';

import { localEnv } from '../../../../../utils/appUtils';
import { COLOR_PRESETS, WINDOW_PRESETS } from './presets';

function areColorsEqual(a, b) {
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

export default function usePaperStackControls() {
  const controlsSnapshotRef = useRef(WINDOW_PRESETS.Default);
  const selectedPresetRef = useRef('Default');
  const selectedColorPresetRef = useRef('Default');
  const customColorsRef = useRef(COLOR_PRESETS.Default);
  const pushedColorsRef = useRef(COLOR_PRESETS.Default);
  const [customColors, setCustomColors] = useState(COLOR_PRESETS.Default);

  const [
    {
      windowPreset,
      colorPreset,
      layerWidth,
      layerDepth,
      layerDepthBuffer,
      layerHeight,
      windowSize01,
      minSizeRatio,
      maxSizeRatio,
      windowXY,
      windowZ,
      taperAmount,
      taperCurve,
      squareSpacing,
      patternRotationDeg,
      windowRotationDeg,
      spiralTwistDeg,
      spiralCurve,
      stackX,
      stackY,
      stackZ,
      stackRotXDeg,
      stackRotYDeg,
      stackRotZDeg,
      chipsX,
      chipsY,
      chipsZ,
      chipsPitchDeg,
      chipsRotXDeg,
      chipsRotYDeg,
      chipsRotZDeg,
      accumFrames,
      accumColor,
      accumColorBlend,
      accumOpacity,
      accumScale,
      accumAlphaTest,
      accumX,
      accumY,
      accumZ,
      bgColor,
      lightAmount,
      lightRadius,
      lightAmbient,
      lightBias,
      lightDebug,
      lightX,
      lightY,
      lightZ,
    },
    setControls,
  ] = useControls(
    'Paper Stack',
    () => ({
      Presets: folder(
        {
          windowPreset: {
            label: 'Window Preset',
            value: 'Default',
            options: Object.keys(WINDOW_PRESETS),
          },
          colorPreset: {
            label: 'Color Preset',
            value: 'Default',
            options: Object.keys(COLOR_PRESETS),
          },
          reset: button(() => {
            const preset = WINDOW_PRESETS[selectedPresetRef.current];
            if (preset) {
              setControls(preset);
            }
            const presetColors =
              COLOR_PRESETS[selectedColorPresetRef.current] ||
              COLOR_PRESETS.Default;
            setCustomColors((prev) =>
              areColorsEqual(prev, presetColors) ? prev : [...presetColors]
            );
          }),
          ...(localEnv()
            ? {
                copy: button(() => {
                  const asObjectLiteral = JSON.stringify(
                    controlsSnapshotRef.current,
                    null,
                    2
                  ).replace(/"([A-Za-z_$][A-Za-z0-9_$]*)":/g, '$1:');

                  navigator.clipboard.writeText(asObjectLiteral);
                }),
              }
            : {}),
        },
        { collapsed: true }
      ),
      'Color Settings': folder(
        {
          add: button(() => {
            setCustomColors((prev) => [
              ...prev,
              prev[prev.length - 1] || '#ffffff',
            ]);
          }),
          remove: button(() => {
            setCustomColors((prev) =>
              prev.length > 1 ? prev.slice(0, -1) : prev
            );
          }),
          reverse: button(() => {
            setCustomColors((prev) => [...prev].reverse());
          }),
          copyColors: button(() => {
            const asArrayLiteral = `[\n${customColorsRef.current
              .map((color) => `  '${color}'`)
              .join(',\n')}\n]`;
            navigator.clipboard.writeText(asArrayLiteral);
          }),
          ...customColors.reduce((acc, color, index) => {
            acc[`customColor${index}`] = {
              label: `Layer ${index + 1}`,
              value: color,
              onChange: (nextColor) => {
                setCustomColors((prev) => {
                  if (prev[index] === nextColor) return prev;
                  const next = [...prev];
                  next[index] = nextColor;
                  return next;
                });
              },
            };
            return acc;
          }, {}),
        },
        { collapsed: true }
      ),
      Stack: folder(
        {
          stackX: { label: 'X', value: 0, min: -20, max: 20, step: 0.1 },
          stackY: { label: 'Y', value: 0, min: -20, max: 20, step: 0.1 },
          stackZ: { label: 'Z', value: 0, min: -20, max: 20, step: 0.1 },
          stackRotXDeg: {
            label: 'Rot X (°)',
            value: 0,
            min: -180,
            max: 180,
            step: 1,
          },
          stackRotYDeg: {
            label: 'Rot Y (°)',
            value: 0,
            min: -180,
            max: 180,
            step: 1,
          },
          stackRotZDeg: {
            label: 'Rot Z (°)',
            value: 0,
            min: -180,
            max: 180,
            step: 1,
          },
          layerHeight: { value: 4, min: 1, max: 10 },
          layerWidth: { value: 10, min: 1, max: 20 },
          layerDepth: { value: 0.01, min: 0.005, max: 0.1 },
          layerDepthBuffer: { value: 0.01, min: 0, max: 0.1 },
        },
        { collapsed: true }
      ),
      Window: folder(
        {
          windowSize01: { label: 'Size', value: 0.75, min: 0, max: 1 },
          minSizeRatio: {
            label: 'Min Size %',
            value: 0.12,
            min: 0.02,
            max: 0.4,
          },
          maxSizeRatio: {
            label: 'Max Size %',
            value: 0.38,
            min: 0.1,
            max: 0.48,
          },
          windowXY: { value: { x: 0, y: 0 } },
          windowZ: { value: 0.005, min: -0.1, max: 0.1 },
          squareSpacing: { value: 0.69, min: 0.4, max: 1.4 },
          patternRotationDeg: {
            label: 'Pattern Rot (°)',
            value: 0,
            min: 0,
            max: 180,
            step: 1,
          },
          windowRotationDeg: {
            label: 'Square Rot (°)',
            value: 0,
            min: 0,
            max: 90,
            step: 1,
          },
        },
        { collapsed: true }
      ),
      Stepping: folder(
        {
          taperAmount: { value: 0.22, min: 0, max: 0.9 },
          taperCurve: { value: 2.2, min: 0.4, max: 4, step: 0.1 },
        },
        { collapsed: true }
      ),
      Spiral: folder(
        {
          spiralTwistDeg: {
            label: 'Total Spiral (°)',
            value: 0,
            min: -360,
            max: 360,
            step: 1,
          },
          spiralCurve: {
            label: 'Spiral Curve',
            value: 1.6,
            min: 0.2,
            max: 4,
            step: 0.1,
          },
        },
        { collapsed: true }
      ),
      Chips: folder(
        {
          chipsX: { label: 'X', value: 0, min: -20, max: 20, step: 0.1 },
          chipsY: { label: 'Y', value: 0, min: -20, max: 20, step: 0.1 },
          chipsZ: { label: 'Z', value: 2.8, min: -20, max: 20, step: 0.1 },
          chipsPitchDeg: {
            label: 'Pitch (°)',
            value: -90,
            min: -180,
            max: 180,
            step: 1,
          },
          chipsRotXDeg: {
            label: 'Rot X (°)',
            value: 0,
            min: -180,
            max: 180,
            step: 1,
          },
          chipsRotYDeg: {
            label: 'Rot Y (°)',
            value: 45,
            min: -180,
            max: 180,
            step: 1,
          },
          chipsRotZDeg: {
            label: 'Rot Z (°)',
            value: 0,
            min: -180,
            max: 180,
            step: 1,
          },
        },
        { collapsed: true }
      ),
      Shadows: folder(
        {
          accumFrames: {
            label: 'Frames',
            value: 200,
            min: 1,
            max: 400,
            step: 1,
          },
          accumColor: { label: 'Color', value: '#000000' },
          accumColorBlend: {
            label: 'Color Blend',
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.01,
          },
          accumOpacity: {
            label: 'Opacity',
            value: 1,
            min: 0,
            max: 1,
            step: 0.01,
          },
          accumScale: { label: 'Scale', value: 40, min: 1, max: 40, step: 0.1 },
          accumAlphaTest: {
            label: 'Alpha Test',
            value: 0.55,
            min: 0,
            max: 1,
            step: 0.01,
          },
          accumX: { label: 'X', value: 0, min: -20, max: 20, step: 0.1 },
          accumY: { label: 'Y', value: 0, min: -20, max: 20, step: 0.1 },
          accumZ: { label: 'Z', value: 0, min: -20, max: 20, step: 0.1 },
          bgColor: { label: 'Background', value: '#f0f0f0' },
          lightAmount: {
            label: 'Light Amount',
            value: 8,
            min: 1,
            max: 24,
            step: 1,
          },
          lightRadius: {
            label: 'Light Radius',
            value: 5,
            min: 0.1,
            max: 20,
            step: 0.1,
          },
          lightAmbient: {
            label: 'Light Ambient',
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.01,
          },
          lightBias: {
            label: 'Light Bias',
            value: 0.001,
            min: 0,
            max: 0.02,
            step: 0.0001,
          },
          lightDebug: { label: 'Debug Light Pos', value: false },
          lightX: { label: 'Light X', value: 5, min: -20, max: 20, step: 0.1 },
          lightY: { label: 'Light Y', value: 3, min: -20, max: 20, step: 0.1 },
          lightZ: { label: 'Light Z', value: 2, min: -20, max: 20, step: 0.1 },
        },
        { collapsed: true }
      ),
    }),
    [customColors.length]
  );

  useEffect(() => {
    selectedPresetRef.current = windowPreset;
    const presetValues = WINDOW_PRESETS[windowPreset];
    if (presetValues) {
      setControls(presetValues);
    }
  }, [windowPreset, setControls]);

  useEffect(() => {
    controlsSnapshotRef.current = {
      stackX,
      stackY,
      stackZ,
      stackRotXDeg,
      stackRotYDeg,
      stackRotZDeg,
      layerHeight,
      layerWidth,
      layerDepth,
      layerDepthBuffer,
      windowSize01,
      minSizeRatio,
      maxSizeRatio,
      windowXY,
      windowZ,
      squareSpacing,
      patternRotationDeg,
      windowRotationDeg,
      taperAmount,
      taperCurve,
      spiralTwistDeg,
      spiralCurve,
      chipsX,
      chipsY,
      chipsZ,
      chipsPitchDeg,
      chipsRotXDeg,
      chipsRotYDeg,
      chipsRotZDeg,
      accumFrames,
      accumColor,
      accumColorBlend,
      accumOpacity,
      accumScale,
      accumAlphaTest,
      accumX,
      accumY,
      accumZ,
      bgColor,
      lightAmount,
      lightRadius,
      lightAmbient,
      lightBias,
      lightDebug,
      lightX,
      lightY,
      lightZ,
    };
  }, [
    stackX,
    stackY,
    stackZ,
    stackRotXDeg,
    stackRotYDeg,
    stackRotZDeg,
    layerHeight,
    layerWidth,
    layerDepth,
    layerDepthBuffer,
    windowSize01,
    minSizeRatio,
    maxSizeRatio,
    windowXY,
    windowZ,
    squareSpacing,
    patternRotationDeg,
    windowRotationDeg,
    taperAmount,
    taperCurve,
    spiralTwistDeg,
    spiralCurve,
    chipsX,
    chipsY,
    chipsZ,
    chipsPitchDeg,
    chipsRotXDeg,
    chipsRotYDeg,
    chipsRotZDeg,
    accumFrames,
    accumColor,
    accumColorBlend,
    accumOpacity,
    accumScale,
    accumAlphaTest,
    accumX,
    accumY,
    accumZ,
    bgColor,
    lightAmount,
    lightRadius,
    lightAmbient,
    lightBias,
    lightDebug,
    lightX,
    lightY,
    lightZ,
  ]);

  useEffect(() => {
    const presetColors = COLOR_PRESETS[colorPreset] || COLOR_PRESETS.Default;
    selectedColorPresetRef.current = colorPreset;
    setCustomColors((prev) =>
      areColorsEqual(prev, presetColors) ? prev : [...presetColors]
    );
  }, [colorPreset]);

  useEffect(() => {
    if (areColorsEqual(pushedColorsRef.current, customColors)) return;
    pushedColorsRef.current = [...customColors];

    const nextColorControlValues = customColors.reduce((acc, color, index) => {
      acc[`customColor${index}`] = color;
      return acc;
    }, {});
    setControls(nextColorControlValues);
  }, [customColors, setControls]);

  const patternRotation = THREE.MathUtils.degToRad(patternRotationDeg);
  const windowRotation = THREE.MathUtils.degToRad(windowRotationDeg);
  const spiralTotal = THREE.MathUtils.degToRad(spiralTwistDeg);

  const colors = customColors;

  useEffect(() => {
    customColorsRef.current = colors;
  }, [colors]);

  const layerStep = layerDepth + layerDepthBuffer;
  const layerCount = colors.length;

  const safeWindowSize = useMemo(() => {
    const base = Math.min(layerWidth, layerHeight);
    const min = base * minSizeRatio;
    const max = base * maxSizeRatio;
    return THREE.MathUtils.lerp(min, max, windowSize01);
  }, [layerWidth, layerHeight, minSizeRatio, maxSizeRatio, windowSize01]);

  const layers = useMemo(
    () =>
      colors.map((_, i) => {
        const t = i / (layerCount - 1);
        const curved = t ** taperCurve;
        const scale = THREE.MathUtils.lerp(1, 1 - taperAmount, curved);

        const spiralT = t ** spiralCurve;
        const spiral = spiralTotal * spiralT;

        return {
          i,
          z: -i * layerStep,
          scale,
          spiral,
        };
      }),
    [
      colors,
      layerStep,
      layerCount,
      taperAmount,
      taperCurve,
      spiralTotal,
      spiralCurve,
    ]
  );

  const baseOffsets = useMemo(() => {
    const d = safeWindowSize * squareSpacing;
    return [
      [d, d],
      [-d, d],
      [d, -d],
      [-d, -d],
    ];
  }, [safeWindowSize, squareSpacing]);

  return {
    layerWidth,
    layerDepth,
    layerHeight,
    stackX,
    stackY,
    stackZ,
    stackRotation: [
      THREE.MathUtils.degToRad(stackRotXDeg),
      THREE.MathUtils.degToRad(stackRotYDeg),
      THREE.MathUtils.degToRad(stackRotZDeg),
    ],
    windowXY,
    windowZ,
    patternRotation,
    windowRotation,
    safeWindowSize,
    layers,
    colors,
    baseOffsets,
    chipsX,
    chipsY,
    chipsZ,
    chipsPitch: THREE.MathUtils.degToRad(chipsPitchDeg),
    chipsRotation: [
      THREE.MathUtils.degToRad(chipsRotXDeg),
      THREE.MathUtils.degToRad(chipsRotYDeg),
      THREE.MathUtils.degToRad(chipsRotZDeg),
    ],
    shadows: {
      accumFrames,
      accumColor,
      accumColorBlend,
      accumOpacity,
      accumScale,
      accumAlphaTest,
      accumPosition: [accumX, accumY, accumZ],
      backgroundColor: bgColor,
      lightAmount,
      lightRadius,
      lightAmbient,
      lightBias,
      lightDebug,
      lightPosition: [lightX, lightY, lightZ],
    },
  };
}
