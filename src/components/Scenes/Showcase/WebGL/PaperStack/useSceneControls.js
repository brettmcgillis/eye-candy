import { button, folder, useControls } from 'leva';
import * as THREE from 'three';

import { useEffect, useMemo, useRef, useState } from 'react';

import usePresetsFolder from '../../../../../hooks/usePresetsFolder';
import { COLOR_PRESETS, WINDOW_PRESETS } from './presets';

function areColorsEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function getPresetControls({ presetName, presetSnapshot }) {
  return { ...presetSnapshot, preset: presetName };
}

export default function useSceneControls() {
  const {
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
  } = usePresetsFolder({
    defaultPreset: 'Default',
    getPresetControls,
    presets: WINDOW_PRESETS,
  });

  const initialSnapshot = WINDOW_PRESETS[initialPreset] || WINDOW_PRESETS.Default;

  const initialColorPreset = initialSnapshot.colorPreset || 'Default';
  const initialColors = COLOR_PRESETS[initialColorPreset] || COLOR_PRESETS.Default;

  const selectedColorPresetRef = useRef(initialColorPreset);
  const customColorsRef = useRef(initialColors);
  const pushedColorsRef = useRef(initialColors);
  const [customColors, setCustomColors] = useState(initialColors);

  const [controls, setControls] = useControls(
    'Paper Stack',
    () => ({
      Presets: presetsFolder,
      'Color Settings': folder(
        {
          colorPreset: {
            label: 'Color Preset',
            value: initialColorPreset,
            options: Object.keys(COLOR_PRESETS),
          },
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
          stackX: { label: 'X', value: initialSnapshot.stackX, min: -20, max: 20, step: 0.1 },
          stackY: { label: 'Y', value: initialSnapshot.stackY, min: -20, max: 20, step: 0.1 },
          stackZ: { label: 'Z', value: initialSnapshot.stackZ, min: -20, max: 20, step: 0.1 },
          stackRotXDeg: { label: 'Rot X (°)', value: initialSnapshot.stackRotXDeg, min: -180, max: 180, step: 1 },
          stackRotYDeg: { label: 'Rot Y (°)', value: initialSnapshot.stackRotYDeg, min: -180, max: 180, step: 1 },
          stackRotZDeg: { label: 'Rot Z (°)', value: initialSnapshot.stackRotZDeg, min: -180, max: 180, step: 1 },
          layerHeight: { value: initialSnapshot.layerHeight, min: 1, max: 10 },
          layerWidth: { value: initialSnapshot.layerWidth, min: 1, max: 20 },
          layerDepth: { value: initialSnapshot.layerDepth, min: 0.005, max: 0.1 },
          layerDepthBuffer: { value: initialSnapshot.layerDepthBuffer, min: 0, max: 0.1 },
        },
        { collapsed: true }
      ),
      Window: folder(
        {
          windowSize01: { label: 'Size', value: initialSnapshot.windowSize01, min: 0, max: 1 },
          minSizeRatio: { label: 'Min Size %', value: initialSnapshot.minSizeRatio, min: 0.02, max: 0.4 },
          maxSizeRatio: { label: 'Max Size %', value: initialSnapshot.maxSizeRatio, min: 0.1, max: 0.48 },
          windowXY: { value: initialSnapshot.windowXY },
          windowZ: { value: initialSnapshot.windowZ, min: -0.1, max: 0.1 },
          squareSpacing: { value: initialSnapshot.squareSpacing, min: 0.4, max: 1.4 },
          patternRotationDeg: { label: 'Pattern Rot (°)', value: initialSnapshot.patternRotationDeg, min: 0, max: 180, step: 1 },
          windowRotationDeg: { label: 'Square Rot (°)', value: initialSnapshot.windowRotationDeg, min: 0, max: 90, step: 1 },
        },
        { collapsed: true }
      ),
      Stepping: folder(
        {
          taperAmount: { value: initialSnapshot.taperAmount, min: 0, max: 0.9 },
          taperCurve: { value: initialSnapshot.taperCurve, min: 0.4, max: 4, step: 0.1 },
        },
        { collapsed: true }
      ),
      Spiral: folder(
        {
          spiralTwistDeg: { label: 'Total Spiral (°)', value: initialSnapshot.spiralTwistDeg, min: -360, max: 360, step: 1 },
          spiralCurve: { label: 'Spiral Curve', value: initialSnapshot.spiralCurve, min: 0.2, max: 4, step: 0.1 },
        },
        { collapsed: true }
      ),
      Chips: folder(
        {
          chipsX: { label: 'X', value: initialSnapshot.chipsX, min: -20, max: 20, step: 0.1 },
          chipsY: { label: 'Y', value: initialSnapshot.chipsY, min: -20, max: 20, step: 0.1 },
          chipsZ: { label: 'Z', value: initialSnapshot.chipsZ, min: -20, max: 20, step: 0.1 },
          chipsPitchDeg: { label: 'Pitch (°)', value: initialSnapshot.chipsPitchDeg, min: -180, max: 180, step: 1 },
          chipsRotXDeg: { label: 'Rot X (°)', value: initialSnapshot.chipsRotXDeg, min: -180, max: 180, step: 1 },
          chipsRotYDeg: { label: 'Rot Y (°)', value: initialSnapshot.chipsRotYDeg, min: -180, max: 180, step: 1 },
          chipsRotZDeg: { label: 'Rot Z (°)', value: initialSnapshot.chipsRotZDeg, min: -180, max: 180, step: 1 },
        },
        { collapsed: true }
      ),
      Scene: folder(
        {
          bgColor: { label: 'Background', value: initialSnapshot.bgColor },
          ambientIntensity: { label: 'Ambient Light', value: initialSnapshot.ambientIntensity ?? 1, min: 0, max: 10, step: 0.1 },
        },
        { collapsed: true }
      ),
      Animation: folder(
        {
          animMode: {
            label: 'Mode',
            value: initialSnapshot.animMode || 'None',
            options: ['None', 'Scanner'],
          },
          animColor: { label: 'Layer Color', value: initialSnapshot.animColor || '#ffffff' },
          animEmissive: { label: 'Emissive', value: initialSnapshot.animEmissive || '#ffffff' },
          animEmissiveIntensity: { label: 'Emissive Intensity', value: initialSnapshot.animEmissiveIntensity ?? 2, min: 0, max: 10, step: 0.1 },
          animSpeed: { label: 'Speed (layers/s)', value: initialSnapshot.animSpeed ?? 3, min: 0.1, max: 20, step: 0.1 },
        },
        { collapsed: true }
      ),
      Shadows: folder(
        {
          accumFrames: { label: 'Frames', value: initialSnapshot.accumFrames, min: 1, max: 400, step: 1 },
          accumColor: { label: 'Color', value: initialSnapshot.accumColor },
          accumColorBlend: { label: 'Color Blend', value: initialSnapshot.accumColorBlend, min: 0, max: 1, step: 0.01 },
          accumOpacity: { label: 'Opacity', value: initialSnapshot.accumOpacity, min: 0, max: 1, step: 0.01 },
          accumScale: { label: 'Scale', value: initialSnapshot.accumScale, min: 1, max: 40, step: 0.1 },
          accumAlphaTest: { label: 'Alpha Test', value: initialSnapshot.accumAlphaTest, min: 0, max: 1, step: 0.01 },
          accumX: { label: 'X', value: initialSnapshot.accumX, min: -20, max: 20, step: 0.1 },
          accumY: { label: 'Y', value: initialSnapshot.accumY, min: -20, max: 20, step: 0.1 },
          accumZ: { label: 'Z', value: initialSnapshot.accumZ, min: -20, max: 20, step: 0.1 },
          lightAmount: { label: 'Light Amount', value: initialSnapshot.lightAmount, min: 1, max: 24, step: 1 },
          lightRadius: { label: 'Light Radius', value: initialSnapshot.lightRadius, min: 0.1, max: 20, step: 0.1 },
          lightAmbient: { label: 'Light Ambient', value: initialSnapshot.lightAmbient, min: 0, max: 1, step: 0.01 },
          lightBias: { label: 'Light Bias', value: initialSnapshot.lightBias, min: 0, max: 0.02, step: 0.0001 },
          lightDebug: { label: 'Debug Light Pos', value: initialSnapshot.lightDebug },
          lightX: { label: 'Light X', value: initialSnapshot.lightX, min: -20, max: 20, step: 0.1 },
          lightY: { label: 'Light Y', value: initialSnapshot.lightY, min: -20, max: 20, step: 0.1 },
          lightZ: { label: 'Light Z', value: initialSnapshot.lightZ, min: -20, max: 20, step: 0.1 },
        },
        { collapsed: true }
      ),
    }),
    [customColors.length]
  );

  const {
    colorPreset,
    stackX, stackY, stackZ,
    stackRotXDeg, stackRotYDeg, stackRotZDeg,
    layerHeight, layerWidth, layerDepth, layerDepthBuffer,
    windowSize01, minSizeRatio, maxSizeRatio, windowXY, windowZ,
    squareSpacing, patternRotationDeg, windowRotationDeg,
    taperAmount, taperCurve,
    spiralTwistDeg, spiralCurve,
    chipsX, chipsY, chipsZ,
    chipsPitchDeg, chipsRotXDeg, chipsRotYDeg, chipsRotZDeg,
    accumFrames, accumColor, accumColorBlend, accumOpacity,
    accumScale, accumAlphaTest, accumX, accumY, accumZ,
    bgColor, ambientIntensity,
    lightAmount, lightRadius, lightAmbient, lightBias, lightDebug,
    lightX, lightY, lightZ,
    animMode, animColor, animEmissive, animEmissiveIntensity, animSpeed,
  } = controls;

  useEffect(() => {
    attachSetControls(setControls);
  }, [attachSetControls, setControls]);

  useEffect(() => {
    controlsSnapshotRef.current = controls;
  }, [controls, controlsSnapshotRef]);

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

  useEffect(() => {
    customColorsRef.current = customColors;
  }, [customColors]);

  const patternRotation = THREE.MathUtils.degToRad(patternRotationDeg);
  const windowRotation = THREE.MathUtils.degToRad(windowRotationDeg);
  const spiralTotal = THREE.MathUtils.degToRad(spiralTwistDeg);

  const colors = customColors;

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
        return { i, z: -i * layerStep, scale, spiral };
      }),
    [colors, layerStep, layerCount, taperAmount, taperCurve, spiralTotal, spiralCurve]
  );

  const baseOffsets = useMemo(() => {
    const d = safeWindowSize * squareSpacing;
    return [[d, d], [-d, d], [d, -d], [-d, -d]];
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
    scene: {
      backgroundColor: bgColor,
      ambientIntensity,
    },
    animation: {
      mode: animMode,
      color: animColor,
      emissive: animEmissive,
      emissiveIntensity: animEmissiveIntensity,
      speed: animSpeed,
    },
    shadows: {
      accumFrames,
      accumColor,
      accumColorBlend,
      accumOpacity,
      accumScale,
      accumAlphaTest,
      accumPosition: [accumX, accumY, accumZ],
      lightAmount,
      lightRadius,
      lightAmbient,
      lightBias,
      lightDebug,
      lightPosition: [lightX, lightY, lightZ],
    },
  };
}
