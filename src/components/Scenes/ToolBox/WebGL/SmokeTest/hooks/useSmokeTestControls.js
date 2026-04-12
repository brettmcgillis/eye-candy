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
      ssAnimated,
      ssSmokeLight,
      ssSmokeDark,
      showSmokeBallPoints,
      showSmokeBallLine,
      smokeBallPointMode,
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
              sbPosX: {
                label: 'X',
                value: -500,
                min: -1500,
                max: 1500,
                step: 1,
              },
              sbPosY: { label: 'Y', value: 100, min: -500, max: 1000, step: 1 },
              sbPosZ: { label: 'Z', value: 0, min: -500, max: 500, step: 1 },
            },
            { collapsed: true }
          ),
          sbRadius: { label: 'Radius', value: 60, min: 5, max: 400, step: 1 },
          sbDetail: { label: 'Detail', value: 5, min: 1, max: 7, step: 1 },
          sbSpeed: { label: 'Speed', value: 1.0, min: 0, max: 5, step: 0.05 },
          sbWeight: {
            label: 'Weight',
            value: 10.0,
            min: 0,
            max: 30,
            step: 0.5,
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
            value: 60,
            min: 5,
            max: 400,
            step: 1,
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
            value: 10.0,
            min: 0,
            max: 30,
            step: 0.5,
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
            value: 300,
            min: 0,
            max: 5000,
            step: 50,
          },
          attractorRadius: {
            label: 'Radius',
            value: 300,
            min: 10,
            max: 1000,
            step: 10,
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
        smokeLightColor: ssSmokeLight,
        smokeDarkColor: ssSmokeDark,
        animated: ssAnimated,
      },
      showSmokeBallPoints,
      showSmokeBallLine,
      smokeBallPointMode,
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
      sbAnimated,
      sbSmokeLight,
      sbSmokeDark,
      ssBaseRadius,
      ssTubular,
      ssRadial,
      ssCap,
      ssSpeed,
      ssWeight,
      ssSmokeLight,
      ssSmokeDark,
      ssAnimated,
      showSmokeBallPoints,
      showSmokeBallLine,
      smokeBallPointMode,
    ]
  );
}
