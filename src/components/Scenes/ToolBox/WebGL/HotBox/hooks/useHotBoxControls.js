import { button, folder, useControls } from 'leva';
import * as THREE from 'three';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import FIRE_PRESETS from '../../../../../../presets/fire/firePresets';
import { localEnv } from '../../../../../../utils/appUtils';
import buildSplineGroupControls from '../../shared/hooks/useSplineGroupControls';
import {
  DEFAULT_SPLINE_CONFIG,
  parsePreset,
  serializeSplines,
} from '../../shared/splineDefaults';

const SCENE_LABEL = 'Hot Box';
const DEFAULT_PRESET_KEY = Object.keys(FIRE_PRESETS)[0];
const MAX_ATTRACTORS = 8;

export default function useHotBoxControls(splines, setSplines, attractorsRef) {
  const selectedPresetRef = useRef(DEFAULT_PRESET_KEY);
  const splinesRef = useRef(splines);
  splinesRef.current = splines;

  const [splineConfigs, setSplineConfigs] = useState(() => {
    const { splineConfigs: initial } = parsePreset(
      FIRE_PRESETS[DEFAULT_PRESET_KEY]
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
      // Fireball
      fbPosX,
      fbPosY,
      fbPosZ,
      fbRadius,
      fbDetail,
      fbSpeed,
      fbWeight,
      fbNoiseFreq,
      fbNoiseAmp,
      fbAnimated,
      // Flame
      flPosX,
      flPosY,
      flPosZ,
      flGroupScale,
      flInverted,
      flBaseSpeed,
      flMinSpeed,
      flSlowFreq,
      flSlowAmp,
      flFastFreq,
      flFastAmp,
      flMicroFreq,
      flMicroAmp,
      flSwayX,
      flSwayZ,
      flPulseFreq,
      flPulseAmp,
      flScaleX,
      flScaleY,
      // FireballVolume
      fvPosX,
      fvPosY,
      fvPosZ,
      fvRadius,
      fvRotSpeed,
      fvNoiseScale,
      fvCoreColor,
      fvCoreIntensity,
      fvEdgeColor,
      fvEdgeIntensity,
      fvDensity,
      fvSteps,
    },
  ] = useControls(
    SCENE_LABEL,
    () => ({
      Presets: folder(
        {
          preset: {
            label: 'Preset',
            value: DEFAULT_PRESET_KEY,
            options: Object.keys(FIRE_PRESETS),
          },
          reset: button(() => {
            const p = FIRE_PRESETS[selectedPresetRef.current];
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
          bgColor: { label: 'Background', value: '#9b9b9b' },
        },
        { collapsed: true }
      ),

      // ── Standalone smoke elements ─────────────────────────────────────────
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

      // ── Standalone fire elements ──────────────────────────────────────────
      Fireball: folder(
        {
          'FB Position': folder(
            {
              fbPosX: { label: 'X', value: 3, min: -20, max: 20, step: 0.1 },
              fbPosY: { label: 'Y', value: 1, min: -5, max: 15, step: 0.1 },
              fbPosZ: { label: 'Z', value: 0, min: -10, max: 10, step: 0.1 },
            },
            { collapsed: true }
          ),
          fbRadius: {
            label: 'Radius',
            value: 0.4,
            min: 0.05,
            max: 5,
            step: 0.05,
          },
          fbDetail: { label: 'Detail', value: 5, min: 1, max: 7, step: 1 },
          fbSpeed: { label: 'Speed', value: 1.0, min: 0, max: 5, step: 0.05 },
          fbWeight: {
            label: 'Weight',
            value: 0.3,
            min: 0,
            max: 3,
            step: 0.05,
          },
          fbNoiseFreq: {
            label: 'Noise Freq',
            value: 2.0,
            min: 0.1,
            max: 10,
            step: 0.1,
          },
          fbNoiseAmp: {
            label: 'Noise Amp',
            value: 0.15,
            min: 0,
            max: 1,
            step: 0.01,
          },
          fbAnimated: { label: 'Animated', value: true },
        },
        { collapsed: true }
      ),

      Flame: folder(
        {
          'FL Position': folder(
            {
              flPosX: { label: 'X', value: 5, min: -20, max: 20, step: 0.1 },
              flPosY: { label: 'Y', value: 0, min: -5, max: 15, step: 0.1 },
              flPosZ: { label: 'Z', value: 0, min: -10, max: 10, step: 0.1 },
            },
            { collapsed: true }
          ),
          flGroupScale: {
            label: 'Scale',
            value: 1.2,
            min: 0.01,
            max: 5,
            step: 0.01,
          },
          flInverted: { label: 'Inverted', value: false },
          Motion: folder(
            {
              flBaseSpeed: {
                label: 'Base Speed',
                value: 1.15,
                min: 0,
                max: 5,
                step: 0.05,
              },
              flMinSpeed: {
                label: 'Min Speed',
                value: 0.28,
                min: 0,
                max: 2,
                step: 0.01,
              },
              flSlowFreq: {
                label: 'Slow Freq',
                value: 0.7,
                min: 0,
                max: 5,
                step: 0.1,
              },
              flSlowAmp: {
                label: 'Slow Amp',
                value: 0.55,
                min: 0,
                max: 2,
                step: 0.05,
              },
              flFastFreq: {
                label: 'Fast Freq',
                value: 2.6,
                min: 0,
                max: 10,
                step: 0.1,
              },
              flFastAmp: {
                label: 'Fast Amp',
                value: 0.25,
                min: 0,
                max: 2,
                step: 0.05,
              },
              flMicroFreq: {
                label: 'Micro Freq',
                value: 5.7,
                min: 0,
                max: 20,
                step: 0.1,
              },
              flMicroAmp: {
                label: 'Micro Amp',
                value: 0.08,
                min: 0,
                max: 1,
                step: 0.01,
              },
              flSwayX: {
                label: 'Sway X',
                value: 0.015,
                min: 0,
                max: 0.2,
                step: 0.001,
              },
              flSwayZ: {
                label: 'Sway Z',
                value: 0.014,
                min: 0,
                max: 0.2,
                step: 0.001,
              },
              flPulseFreq: {
                label: 'Pulse Freq',
                value: 3.4,
                min: 0,
                max: 10,
                step: 0.1,
              },
              flPulseAmp: {
                label: 'Pulse Amp',
                value: 0.04,
                min: 0,
                max: 0.5,
                step: 0.01,
              },
              flScaleX: {
                label: 'Scale X',
                value: 1,
                min: 0.1,
                max: 5,
                step: 0.1,
              },
              flScaleY: {
                label: 'Scale Y',
                value: 1,
                min: 0.1,
                max: 5,
                step: 0.1,
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),

      'Fireball Volume': folder(
        {
          'FV Position': folder(
            {
              fvPosX: { label: 'X', value: 5, min: -20, max: 20, step: 0.1 },
              fvPosY: { label: 'Y', value: 1, min: -5, max: 15, step: 0.1 },
              fvPosZ: { label: 'Z', value: 0, min: -10, max: 10, step: 0.1 },
            },
            { collapsed: true }
          ),
          fvRadius: {
            label: 'Radius',
            value: 0.8,
            min: 0.05,
            max: 5,
            step: 0.05,
          },
          fvRotSpeed: {
            label: 'Rotation Speed',
            value: 0.1,
            min: 0,
            max: 2,
            step: 0.01,
          },
          fvNoiseScale: {
            label: 'Noise Scale',
            value: 0.5,
            min: 0.1,
            max: 2,
            step: 0.05,
          },
          'FV Core': folder(
            {
              fvCoreColor: { label: 'Color', value: '#ccffff' },
              fvCoreIntensity: {
                label: 'Intensity',
                value: 7.0,
                min: 0,
                max: 20,
                step: 0.5,
              },
            },
            { collapsed: true }
          ),
          'FV Edge': folder(
            {
              fvEdgeColor: { label: 'Color', value: '#7a877f' },
              fvEdgeIntensity: {
                label: 'Intensity',
                value: 1.5,
                min: 0,
                max: 10,
                step: 0.1,
              },
            },
            { collapsed: true }
          ),
          fvDensity: {
            label: 'Density',
            value: 1.0,
            min: 0,
            max: 5,
            step: 0.1,
          },
          fvSteps: { label: 'Steps', value: 64, min: 8, max: 128, step: 8 },
        },
        { collapsed: true }
      ),

      // ── Attractors ────────────────────────────────────────────────────────
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

      // ── Global actions ────────────────────────────────────────────────────
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
            allowedTypes: 'both',
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
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const p = FIRE_PRESETS[preset];
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
      fireball: {
        position: [fbPosX, fbPosY, fbPosZ],
        radius: fbRadius,
        detail: fbDetail,
        speed: fbSpeed,
        weight: fbWeight,
        noiseFreq: fbNoiseFreq,
        noiseAmp: fbNoiseAmp,
        animated: fbAnimated,
      },
      flame: {
        position: [flPosX, flPosY, flPosZ],
        groupScale: flGroupScale,
        inverted: flInverted,
        motion: {
          baseSpeed: flBaseSpeed,
          minSpeed: flMinSpeed,
          slowFreq: flSlowFreq,
          slowAmp: flSlowAmp,
          fastFreq: flFastFreq,
          fastAmp: flFastAmp,
          microFreq: flMicroFreq,
          microAmp: flMicroAmp,
          swayX: flSwayX,
          swayZ: flSwayZ,
          pulseFreq: flPulseFreq,
          pulseAmp: flPulseAmp,
          scaleX: flScaleX,
          scaleY: flScaleY,
        },
      },
      fireballVolume: {
        position: [fvPosX, fvPosY, fvPosZ],
        radius: fvRadius,
        rotSpeed: fvRotSpeed,
        noiseScale: fvNoiseScale,
        coreColor: fvCoreColor,
        coreIntensity: fvCoreIntensity,
        edgeColor: fvEdgeColor,
        edgeIntensity: fvEdgeIntensity,
        density: fvDensity,
        steps: fvSteps,
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
      fbPosX,
      fbPosY,
      fbPosZ,
      fbRadius,
      fbDetail,
      fbSpeed,
      fbWeight,
      fbNoiseFreq,
      fbNoiseAmp,
      fbAnimated,
      flPosX,
      flPosY,
      flPosZ,
      flGroupScale,
      flInverted,
      flBaseSpeed,
      flMinSpeed,
      flSlowFreq,
      flSlowAmp,
      flFastFreq,
      flFastAmp,
      flMicroFreq,
      flMicroAmp,
      flSwayX,
      flSwayZ,
      flPulseFreq,
      flPulseAmp,
      flScaleX,
      flScaleY,
      fvPosX,
      fvPosY,
      fvPosZ,
      fvRadius,
      fvRotSpeed,
      fvNoiseScale,
      fvCoreColor,
      fvCoreIntensity,
      fvEdgeColor,
      fvEdgeIntensity,
      fvDensity,
      fvSteps,
    ]
  );
}
