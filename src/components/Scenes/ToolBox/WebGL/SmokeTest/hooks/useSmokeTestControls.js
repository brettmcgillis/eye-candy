import { button, folder, useControls } from 'leva';
import * as THREE from 'three';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import SMOKE_PRESETS from '../../../../../../presets/smoke/smokePresets';
import { localEnv } from '../../../../../../utils/appUtils';
import buildSplineGroupControls from '../../shared/hooks/useSplineGroupControls';
import {
  DEFAULT_SPLINE_CONFIG,
  parsePreset,
  serializeSplines,
} from '../../shared/splineDefaults';

const SCENE_LABEL = 'Smoke Test';
const DEFAULT_PRESET_KEY = Object.keys(SMOKE_PRESETS)[0];
const MAX_ATTRACTORS = 8;

export default function useSmokeTestControls(
  splines,
  setSplines,
  attractorsRef
) {
  const selectedPresetRef = useRef(DEFAULT_PRESET_KEY);
  const splinesRef = useRef(splines);
  splinesRef.current = splines;

  const [splineConfigs, setSplineConfigs] = useState(() => {
    const { splineConfigs: initial } = parsePreset(
      SMOKE_PRESETS[DEFAULT_PRESET_KEY]
    );
    return initial;
  });

  const [attractorVersion, setAttractorVersion] = useState(0);
  const forceAttractorUpdate = useCallback(
    () => setAttractorVersion((c) => c + 1),
    []
  );

  const [
    {
      preset,
      pointMode,
      bgColor,
      attractorStrength,
      attractorRadius,
      showAttractors,
      attractorMode,
      // SmokeBall
      sbPosX,
      sbPosY,
      sbPosZ,
      sbRadius,
      sbDetail,
      sbSpeed,
      sbWeight,
      sbNoiseFreq,
      sbNoiseAmp,
      sbAnimated,
      sbSmokeLight,
      sbSmokeDark,
      // SmokeBallSpline
      ssBaseRadius,
      ssTubular,
      ssRadial,
      ssCap,
      ssSpeed,
      ssWeight,
      ssNoiseFreq,
      ssNoiseAmp,
      ssAnimated,
      ssSmokeLight,
      ssSmokeDark,
      showSmokeBallPoints,
      showSmokeBallLine,
      smokeBallPointMode,
      // Smoke2D
      s2dVisible,
      s2dPosX,
      s2dPosY,
      s2dPosZ,
      s2dInverted,
      s2dWidth,
      s2dHeight,
      s2dColor,
      s2dOpacity,
      s2dTimeFreq,
      s2dUvFreqX,
      s2dUvFreqY,
      s2dRiseSpeed,
      s2dSpreadStrength,
    },
  ] = useControls(
    SCENE_LABEL,
    () => ({
      Presets: folder(
        {
          preset: {
            label: 'Preset',
            value: DEFAULT_PRESET_KEY,
            options: Object.keys(SMOKE_PRESETS),
          },
          reset: button(() => {
            const p = SMOKE_PRESETS[selectedPresetRef.current];
            if (p) {
              const { splines: nextSplines, splineConfigs: nextConfigs } =
                parsePreset(p);
              setSplines(nextSplines);
              setSplineConfigs(nextConfigs);
            }
          }),
          ...(localEnv()
            ? {
                copy: button(
                  () => {
                    const code = serializeSplines(
                      splinesRef.current,
                      splineConfigs
                    );
                    navigator.clipboard.writeText(`splines: [\n${code}\n]`);
                  },
                  { label: 'Copy Preset' }
                ),
              }
            : {}),
        },
        { collapsed: true }
      ),

      Scene: folder(
        {
          pointMode: {
            label: 'Point Mode',
            value: 'translate',
            options: ['translate', 'rotate', 'scale'],
          },
          bgColor: { label: 'Background', value: '#ffffff' },
        },
        { collapsed: true }
      ),

      SmokeBall: folder(
        {
          'SB Position': folder(
            {
              sbPosX: { label: 'X', value: -5, min: -20, max: 20, step: 0.1 },
              sbPosY: { label: 'Y', value: 1, min: -5, max: 15, step: 0.1 },
              sbPosZ: { label: 'Z', value: 0, min: -10, max: 10, step: 0.1 },
            },
            { collapsed: true }
          ),
          sbRadius: {
            label: 'Radius',
            value: 0.6,
            min: 0.05,
            max: 5,
            step: 0.05,
          },
          sbDetail: { label: 'Detail', value: 5, min: 1, max: 7, step: 1 },
          sbSpeed: { label: 'Speed', value: 1.0, min: 0, max: 5, step: 0.05 },
          sbWeight: {
            label: 'Weight',
            value: 0.3,
            min: 0,
            max: 3,
            step: 0.05,
          },
          sbNoiseFreq: {
            label: 'Noise Freq',
            value: 2.0,
            min: 0.1,
            max: 10,
            step: 0.1,
          },
          sbNoiseAmp: {
            label: 'Noise Amp',
            value: 0.15,
            min: 0,
            max: 1,
            step: 0.01,
          },
          sbAnimated: { label: 'Animated', value: true },
          'SB Colors': folder(
            {
              sbSmokeLight: { label: 'Light', value: '#bcbcbc' },
              sbSmokeDark: { label: 'Dark', value: '#262626' },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),

      'Smoke Ball Spline': folder(
        {
          ssBaseRadius: {
            label: 'Base Radius',
            value: 0.6,
            min: 0.05,
            max: 5,
            step: 0.05,
          },
          ssTubular: {
            label: 'Tubular Segments',
            value: 64,
            min: 8,
            max: 128,
            step: 1,
          },
          ssRadial: {
            label: 'Radial Segments',
            value: 32,
            min: 8,
            max: 64,
            step: 1,
          },
          ssCap: { label: 'Cap Segments', value: 8, min: 2, max: 16, step: 1 },
          ssSpeed: { label: 'Speed', value: 1.0, min: 0, max: 5, step: 0.05 },
          ssWeight: {
            label: 'Weight',
            value: 0.3,
            min: 0,
            max: 3,
            step: 0.05,
          },
          ssNoiseFreq: {
            label: 'Noise Freq',
            value: 2.0,
            min: 0.1,
            max: 10,
            step: 0.1,
          },
          ssNoiseAmp: {
            label: 'Noise Amp',
            value: 0.15,
            min: 0,
            max: 1,
            step: 0.01,
          },
          'SS Colors': folder(
            {
              ssSmokeLight: { label: 'Light', value: '#bcbcbc' },
              ssSmokeDark: { label: 'Dark', value: '#262626' },
            },
            { collapsed: true }
          ),
          ssAnimated: { label: 'Animated', value: true },
          'Spline Editor': folder(
            {
              showSmokeBallPoints: { label: 'Show Points', value: true },
              showSmokeBallLine: { label: 'Show Curve', value: true },
              smokeBallPointMode: {
                label: 'Transform',
                value: 'translate',
                options: ['translate', 'scale'],
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),

      'Smoke 2D': folder(
        {
          s2dVisible: { label: 'Visible', value: true },
          's2D Position': folder(
            {
              s2dPosX: { label: 'X', value: -3, min: -20, max: 20, step: 0.1 },
              s2dPosY: { label: 'Y', value: 0, min: -5, max: 15, step: 0.1 },
              s2dPosZ: { label: 'Z', value: 0, min: -10, max: 10, step: 0.1 },
            },
            { collapsed: true }
          ),
          s2dInverted: { label: 'Inverted', value: false },
          s2dWidth: {
            label: 'Width',
            value: 1.5,
            min: 0.05,
            max: 5,
            step: 0.05,
          },
          s2dHeight: {
            label: 'Height',
            value: 6.0,
            min: 0.1,
            max: 15,
            step: 0.1,
          },
          s2dColor: { label: 'Color', value: '#b8b8b8' },
          s2dOpacity: {
            label: 'Opacity',
            value: 1.0,
            min: 0,
            max: 1,
            step: 0.01,
          },
          s2dTimeFreq: {
            label: 'Time Freq',
            value: 0.45,
            min: 0,
            max: 3,
            step: 0.01,
          },
          s2dUvFreqX: {
            label: 'UV Freq X',
            value: 1.0,
            min: 0.1,
            max: 5,
            step: 0.05,
          },
          s2dUvFreqY: {
            label: 'UV Freq Y',
            value: 1.5,
            min: 0.1,
            max: 5,
            step: 0.05,
          },
          s2dRiseSpeed: {
            label: 'Rise Speed',
            value: 0.35,
            min: 0,
            max: 2,
            step: 0.01,
          },
          s2dSpreadStrength: {
            label: 'Spread',
            value: 0.18,
            min: 0,
            max: 1,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),

      Attractors: folder(
        {
          showAttractors: { label: 'Show Helpers', value: true },
          attractorMode: {
            label: 'Mode',
            value: 'translate',
            options: ['translate', 'rotate', 'scale', 'none'],
          },
          attractorStrength: {
            label: 'Strength',
            value: 3,
            min: 0,
            max: 50,
            step: 0.5,
          },
          attractorRadius: {
            label: 'Radius',
            value: 3,
            min: 0.1,
            max: 20,
            step: 0.1,
          },
          addAttractor: button(() => {
            if (attractorsRef.current.length >= MAX_ATTRACTORS) return;
            attractorsRef.current.push({
              position: [
                (Math.random() - 0.5) * 6,
                1 + Math.random() * 5,
                (Math.random() - 0.5) * 4,
              ],
              direction: [0, 1, 0],
              rotation: [0, 0, 0],
            });
            setAttractorVersion((c) => c + 1);
          }),
          removeAttractor: button(() => {
            if (attractorsRef.current.length <= 0) return;
            attractorsRef.current.pop();
            setAttractorVersion((c) => c + 1);
          }),
          removeAll: button(() => {
            // eslint-disable-next-line no-param-reassign
            attractorsRef.current.length = 0;
            setAttractorVersion((c) => c + 1);
          }),
        },
        { collapsed: true }
      ),

      Actions: folder(
        {
          addSpline: button(
            () => {
              const randPt = () => ({
                position: new THREE.Vector3(
                  (Math.random() - 0.5) * 4,
                  Math.random() * 4,
                  (Math.random() - 0.5) * 4
                ),
                rotation: new THREE.Euler(),
                scale: new THREE.Vector3(1, 1, 1),
              });
              setSplines((prev) => [...prev, [randPt(), randPt(), randPt()]]);
              setSplineConfigs((prev) => [
                ...prev,
                { ...DEFAULT_SPLINE_CONFIG, name: `Spline ${prev.length + 1}` },
              ]);
            },
            { label: 'Add Spline' }
          ),
        },
        { collapsed: true }
      ),

      // ── Per-spline folders ────────────────────────────────────────────────
      ...splines.reduce((acc, _, index) => {
        const cfg = splineConfigs[index] ?? DEFAULT_SPLINE_CONFIG;
        acc[`Spline ${index + 1}`] = folder(
          buildSplineGroupControls(index, cfg, {
            sceneLabel: SCENE_LABEL,
            setSplineConfigs,
            setSplines,
            allowedTypes: 'smoke',
          }),
          { collapsed: true }
        );
        return acc;
      }, {}),
    }),
    [splines.length]
  );

  // Track selected preset name
  useEffect(() => {
    selectedPresetRef.current = preset;
  }, [preset]);

  // Apply preset when selection changes
  useEffect(() => {
    const p = SMOKE_PRESETS[preset];
    if (p) {
      const { splines: nextSplines, splineConfigs: nextConfigs } =
        parsePreset(p);
      setSplines(nextSplines);
      setSplineConfigs(nextConfigs);
    }
  }, [preset]);

  // Keep configs in sync with spline count
  useEffect(() => {
    setSplineConfigs((prev) => {
      if (prev.length === splines.length) return prev;
      return splines.map((_, i) => prev[i] ?? { ...DEFAULT_SPLINE_CONFIG });
    });
  }, [splines.length]);

  return useMemo(
    () => ({
      pointMode,
      bgColor,
      attractorStrength,
      attractorRadius,
      showAttractors,
      attractorMode,
      attractorVersion,
      forceAttractorUpdate,
      splineConfigs,
      smokeBall: {
        position: [sbPosX, sbPosY, sbPosZ],
        radius: sbRadius,
        detail: sbDetail,
        speed: sbSpeed,
        weight: sbWeight,
        noiseFreq: sbNoiseFreq,
        noiseAmp: sbNoiseAmp,
        animated: sbAnimated,
        smokeLightColor: sbSmokeLight,
        smokeDarkColor: sbSmokeDark,
      },
      smokeBallSpline: {
        baseRadius: ssBaseRadius,
        tubularSegments: ssTubular,
        radialSegments: ssRadial,
        capSegments: ssCap,
        speed: ssSpeed,
        weight: ssWeight,
        noiseFreq: ssNoiseFreq,
        noiseAmp: ssNoiseAmp,
        smokeLightColor: ssSmokeLight,
        smokeDarkColor: ssSmokeDark,
        animated: ssAnimated,
      },
      showSmokeBallPoints,
      showSmokeBallLine,
      smokeBallPointMode,
      smoke2D: {
        visible: s2dVisible,
        position: [s2dPosX, s2dPosY, s2dPosZ],
        inverted: s2dInverted,
        smoke: {
          width: s2dWidth,
          height: s2dHeight,
          color: s2dColor,
          opacity: s2dOpacity,
          timeFrequency: s2dTimeFreq,
          uvFrequencyX: s2dUvFreqX,
          uvFrequencyY: s2dUvFreqY,
          riseSpeed: s2dRiseSpeed,
          spreadStrength: s2dSpreadStrength,
        },
      },
    }),
    [
      pointMode,
      bgColor,
      attractorStrength,
      attractorRadius,
      showAttractors,
      attractorMode,
      attractorVersion,
      forceAttractorUpdate,
      splineConfigs,
      sbPosX,
      sbPosY,
      sbPosZ,
      sbRadius,
      sbDetail,
      sbSpeed,
      sbWeight,
      sbNoiseFreq,
      sbNoiseAmp,
      sbAnimated,
      sbSmokeLight,
      sbSmokeDark,
      ssBaseRadius,
      ssTubular,
      ssRadial,
      ssCap,
      ssSpeed,
      ssWeight,
      ssNoiseFreq,
      ssNoiseAmp,
      ssSmokeLight,
      ssSmokeDark,
      ssAnimated,
      showSmokeBallPoints,
      showSmokeBallLine,
      smokeBallPointMode,
      s2dVisible,
      s2dPosX,
      s2dPosY,
      s2dPosZ,
      s2dInverted,
      s2dWidth,
      s2dHeight,
      s2dColor,
      s2dOpacity,
      s2dTimeFreq,
      s2dUvFreqX,
      s2dUvFreqY,
      s2dRiseSpeed,
      s2dSpreadStrength,
    ]
  );
}
