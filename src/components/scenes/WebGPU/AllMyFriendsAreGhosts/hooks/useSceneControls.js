import { useMemo } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';

import PRESETS from '../presets/presets';

const DEFAULT_PRESET = 'Default';

function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}

export default function useSceneControls() {
  const {
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_PRESET,
    getPresetControls,
    presets: PRESETS,
  });

  const p = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

  const [controls, setControls] = useControls(
    'Ghosts',
    () => ({
      Presets: presetsFolder,

      Scene: folder(
        {
          bgColor: { value: p.bgColor, label: 'Background' },
          ambientIntensity: {
            value: p.ambientIntensity,
            min: 0,
            max: 1,
            step: 0.01,
            label: 'Ambient',
          },
          directionalIntensity: {
            value: p.directionalIntensity,
            min: 0,
            max: 2,
            step: 0.01,
            label: 'Dir Light',
          },
          directionalColor: { value: p.directionalColor, label: 'Dir Color' },
        },
        { collapsed: true }
      ),

      Ghosts: folder(
        {
          ghostCount: {
            value: p.ghostCount,
            options: [1, 2, 3, 4],
            label: 'Count',
          },
          Colors: folder(
            {
              ghost1Color: { value: p.ghost1Color, label: 'Ghost 1' },
              ghost2Color: { value: p.ghost2Color, label: 'Ghost 2' },
              ghost3Color: { value: p.ghost3Color, label: 'Ghost 3' },
              ghost4Color: { value: p.ghost4Color, label: 'Ghost 4' },
            },
            { collapsed: true }
          ),
          Cloth: folder(
            {
              wind: { value: p.wind, min: 0, max: 2, step: 0.01 },
              windDirX: {
                value: p.windDirX,
                min: -1,
                max: 1,
                step: 0.01,
                label: 'Wind Dir X',
              },
              windDirZ: {
                value: p.windDirZ,
                min: -1,
                max: 1,
                step: 0.01,
                label: 'Wind Dir Z',
              },
              stiffness: {
                value: p.stiffness,
                min: 0,
                max: 1,
                step: 0.01,
              },
              dampening: {
                value: p.dampening,
                min: 0.9,
                max: 1,
                step: 0.001,
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),

      Path: folder(
        {
          pathType: {
            value: p.pathType,
            options: ['figure8', 'retro'],
            label: 'Type',
          },
          pathAmplitude: {
            value: p.pathAmplitude,
            min: 0.5,
            max: 5,
            step: 0.1,
            label: 'Amplitude',
          },
          pathSpeed: {
            value: p.pathSpeed,
            min: 0,
            max: 2,
            step: 0.01,
            label: 'Speed',
          },
          bobHeight: {
            value: p.bobHeight,
            min: 0,
            max: 0.15,
            step: 0.005,
            label: 'Bob Height',
          },
          bobFrequency: {
            value: p.bobFrequency,
            min: 0.5,
            max: 5,
            step: 0.1,
            label: 'Bob Freq',
          },
          baseY: {
            value: p.baseY,
            min: -2,
            max: 3,
            step: 0.1,
            label: 'Base Y',
          },
        },
        { collapsed: true }
      ),

      Eyes: folder(
        {
          'Eye Colors': folder(
            {
              eye1Color: { value: p.eye1Color, label: 'Eye 1' },
              eye2Color: { value: p.eye2Color, label: 'Eye 2' },
              eye3Color: { value: p.eye3Color, label: 'Eye 3' },
              eye4Color: { value: p.eye4Color, label: 'Eye 4' },
            },
            { collapsed: true }
          ),
          eyeIntensity: {
            value: p.eyeIntensity,
            min: 0,
            max: 10,
            step: 0.1,
            label: 'Intensity',
          },
          eyeSize: {
            value: p.eyeSize,
            min: 0.005,
            max: 0.1,
            step: 0.005,
            label: 'Size',
          },
        },
        { collapsed: true }
      ),

      Sparkles: folder(
        {
          sparkleCount: {
            value: p.sparkleCount,
            min: 0,
            max: 500,
            step: 10,
            label: 'Count',
          },
          sparkleSpeed: {
            value: p.sparkleSpeed,
            min: 0,
            max: 5,
            step: 0.1,
            label: 'Speed',
          },
          sparkleColor: { value: p.sparkleColor, label: 'Color' },
          sparkleSize: {
            value: p.sparkleSize,
            min: 0.5,
            max: 20,
            step: 0.5,
            label: 'Size',
          },
          sparkleScale: {
            value: p.sparkleScale,
            min: 1,
            max: 20,
            step: 0.5,
            label: 'Scale',
          },
          sparkleOpacity: {
            value: p.sparkleOpacity,
            min: 0,
            max: 1,
            step: 0.01,
            label: 'Opacity',
          },
        },
        { collapsed: true }
      ),

      Floor: folder(
        {
          floorColor: { value: p.floorColor, label: 'Color' },
          floorOpacity: {
            value: p.floorOpacity,
            min: 0,
            max: 1,
            step: 0.01,
            label: 'Opacity',
          },
        },
        { collapsed: true }
      ),

      Bloom: folder(
        {
          bloomEnabled: { value: p.bloomEnabled, label: 'Enabled' },
          bloomThreshold: {
            value: p.bloomThreshold,
            min: 0,
            max: 2,
            step: 0.05,
            label: 'Threshold',
          },
          bloomStrength: {
            value: p.bloomStrength,
            min: 0,
            max: 3,
            step: 0.05,
            label: 'Strength',
          },
          bloomRadius: {
            value: p.bloomRadius,
            min: 0,
            max: 2,
            step: 0.05,
            label: 'Radius',
          },
        },
        { collapsed: true }
      ),
    }),
    { collapsed: true }
  );

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  const ghostColors = useMemo(
    () => [
      controls.ghost1Color,
      controls.ghost2Color,
      controls.ghost3Color,
      controls.ghost4Color,
    ],
    [
      controls.ghost1Color,
      controls.ghost2Color,
      controls.ghost3Color,
      controls.ghost4Color,
    ]
  );

  const eyeColors = useMemo(
    () => [
      controls.eye1Color,
      controls.eye2Color,
      controls.eye3Color,
      controls.eye4Color,
    ],
    [
      controls.eye1Color,
      controls.eye2Color,
      controls.eye3Color,
      controls.eye4Color,
    ]
  );

  return { controls, ghostColors, eyeColors };
}
