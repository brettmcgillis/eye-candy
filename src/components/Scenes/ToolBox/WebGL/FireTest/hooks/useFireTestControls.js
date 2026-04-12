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

const SCENE_LABEL = 'Fire Test';
const DEFAULT_PRESET_KEY = Object.keys(FIRE_PRESETS)[0];
const MAX_ATTRACTORS = 8;

export default function useFireTestControls(
  splines,
  setSplines,
  attractorsRef
) {
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
      bgColor,
      lineColor,
      attractorStrength,
      attractorRadius,
      showAttractors,
      attractorMode,
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
      // FireballSpline (legacy standalone)
      fsBaseRadius,
      fsTubular,
      fsRadial,
      fsCap,
      fsSpeed,
      fsWeight,
      fsNoiseFreq,
      fsNoiseAmp,
      fsAnimated,
      fsSmokeLight,
      fsSmokeDark,
      showSplinePoints,
      showSplineLine,
      pointMode,
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
      // VolumetricFire
      vfPosX,
      vfPosY,
      vfPosZ,
      vfWidth,
      vfHeight,
      vfDepth,
      vfSliceSpacing,
      vfBendX,
      vfBendZ,
      vfAnimated,
      vfAnimSpeed,
      vfShowSpline,
      vfShowVolume,
      vfMagnitude,
      vfLacunarity,
      vfGain,
      vfTintColor,
      vfSaturation,
      vfBrightness,
      // CS184VolumetricFire
      cfPosX,
      cfPosY,
      cfPosZ,
      cfWidth,
      cfHeight,
      cfDepth,
      cfBendX,
      cfBendZ,
      cfAnimated,
      cfAnimSpeed,
      cfMagnitude,
      cfLacunarity,
      cfGain,
      cfSpeed,
      cfDensity,
      cfBrightness,
      cfSaturation,
      cfTintColor,
      cfCoreColor,
      cfBorderColor,
      cfSmokeColor,
      cfEmberDensity,
      cfEmberSize,
      cfEmberColor,
      cfSteps,
      cfStepSize,
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
          bgColor: { label: 'Background', value: '#000000' },
          lineColor: { label: 'Grid Lines', value: '#252548' },
        },
        { collapsed: false }
      ),

      // ── Fireball (Perlin noise vertex-displacement sphere) ───────────────
      Fireball: folder(
        {
          'FB Position': folder(
            {
              fbPosX: { label: 'X', value: -5, min: -20, max: 20, step: 0.1 },
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

      // ── FireballSpline (legacy standalone spline tube) ───────────────────
      'Fire Spline': folder(
        {
          fsBaseRadius: {
            label: 'Base Radius',
            value: 0.6,
            min: 0.05,
            max: 5,
            step: 0.05,
          },
          fsTubular: {
            label: 'Tubular Segments',
            value: 64,
            min: 8,
            max: 128,
            step: 1,
          },
          fsRadial: {
            label: 'Radial Segments',
            value: 32,
            min: 8,
            max: 64,
            step: 1,
          },
          fsCap: { label: 'Cap Segments', value: 8, min: 2, max: 16, step: 1 },
          fsSpeed: { label: 'Speed', value: 1.0, min: 0, max: 5, step: 0.05 },
          fsWeight: {
            label: 'Weight',
            value: 0.3,
            min: 0,
            max: 3,
            step: 0.05,
          },
          fsNoiseFreq: {
            label: 'Noise Freq',
            value: 2.0,
            min: 0.1,
            max: 10,
            step: 0.1,
          },
          fsNoiseAmp: {
            label: 'Noise Amp',
            value: 0.15,
            min: 0,
            max: 1,
            step: 0.01,
          },
          'Smoke Colors': folder(
            {
              fsSmokeLight: { label: 'Light', value: '#4a4a58' },
              fsSmokeDark: { label: 'Dark', value: '#1a1a22' },
            },
            { collapsed: false }
          ),
          fsAnimated: { label: 'Animated', value: true },
          'Spline Editor': folder(
            {
              showSplinePoints: { label: 'Show Points', value: true },
              showSplineLine: { label: 'Show Curve', value: true },
              pointMode: {
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

      // ── Flame (wispy billboard shader flame) ─────────────────────────────
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

      // ── VolumetricFire (slice-rendered hexahedron) ───────────────────────
      'Volumetric Fire': folder(
        {
          'VF Position': folder(
            {
              vfPosX: { label: 'X', value: 3, min: -20, max: 20, step: 0.1 },
              vfPosY: { label: 'Y', value: 0, min: -5, max: 15, step: 0.1 },
              vfPosZ: { label: 'Z', value: 0, min: -10, max: 10, step: 0.1 },
            },
            { collapsed: true }
          ),
          vfWidth: { label: 'Width', value: 0.8, min: 0.1, max: 5, step: 0.05 },
          vfHeight: {
            label: 'Height',
            value: 2.0,
            min: 0.2,
            max: 10,
            step: 0.1,
          },
          vfDepth: { label: 'Depth', value: 0.8, min: 0.1, max: 5, step: 0.05 },
          vfSliceSpacing: {
            label: 'Slice Spacing',
            value: 0.04,
            min: 0.01,
            max: 0.2,
            step: 0.005,
          },
          vfBendX: { label: 'Bend X', value: 0, min: -2, max: 2, step: 0.01 },
          vfBendZ: { label: 'Bend Z', value: 0, min: -2, max: 2, step: 0.01 },
          vfAnimated: { label: 'Animated', value: true },
          vfAnimSpeed: {
            label: 'Anim Speed',
            value: 0.5,
            min: 0,
            max: 3,
            step: 0.05,
          },
          vfShowSpline: { label: 'Show Spline', value: false },
          vfShowVolume: { label: 'Show Volume', value: false },
          'VF Turbulence': folder(
            {
              vfMagnitude: {
                label: 'Magnitude',
                value: 1.3,
                min: 0.1,
                max: 5,
                step: 0.1,
              },
              vfLacunarity: {
                label: 'Lacunarity',
                value: 2.0,
                min: 1,
                max: 5,
                step: 0.1,
              },
              vfGain: {
                label: 'Gain',
                value: 0.5,
                min: 0.01,
                max: 1,
                step: 0.01,
              },
            },
            { collapsed: true }
          ),
          'VF Colors': folder(
            {
              vfTintColor: { label: 'Tint', value: '#ffffff' },
              vfSaturation: {
                label: 'Saturation',
                value: 1.0,
                min: 0,
                max: 3,
                step: 0.1,
              },
              vfBrightness: {
                label: 'Brightness',
                value: 1.5,
                min: 0,
                max: 5,
                step: 0.1,
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),

      // ── CS184VolumetricFire (ray-marched, embers, 3-zone gradient) ──────
      'CS184 Fire': folder(
        {
          'CF Position': folder(
            {
              cfPosX: { label: 'X', value: -3, min: -20, max: 20, step: 0.1 },
              cfPosY: { label: 'Y', value: 0, min: -5, max: 15, step: 0.1 },
              cfPosZ: { label: 'Z', value: 0, min: -10, max: 10, step: 0.1 },
            },
            { collapsed: true }
          ),
          cfWidth: { label: 'Width', value: 0.5, min: 0.1, max: 5, step: 0.05 },
          cfHeight: {
            label: 'Height',
            value: 1.5,
            min: 0.2,
            max: 10,
            step: 0.1,
          },
          cfDepth: { label: 'Depth', value: 0.5, min: 0.1, max: 5, step: 0.05 },
          cfBendX: {
            label: 'Bend X',
            value: 0,
            min: -2,
            max: 2,
            step: 0.01,
          },
          cfBendZ: {
            label: 'Bend Z',
            value: 0,
            min: -2,
            max: 2,
            step: 0.01,
          },
          cfAnimated: { label: 'Animated', value: true },
          cfAnimSpeed: {
            label: 'Anim Speed',
            value: 0.5,
            min: 0,
            max: 3,
            step: 0.05,
          },
          'CF Turbulence': folder(
            {
              cfMagnitude: {
                label: 'Magnitude',
                value: 1.3,
                min: 0.1,
                max: 5,
                step: 0.1,
              },
              cfLacunarity: {
                label: 'Lacunarity',
                value: 2.0,
                min: 1,
                max: 5,
                step: 0.1,
              },
              cfGain: {
                label: 'Gain',
                value: 0.5,
                min: 0.01,
                max: 1,
                step: 0.01,
              },
              cfSpeed: {
                label: 'Speed',
                value: 0.8,
                min: 0,
                max: 3,
                step: 0.05,
              },
              cfDensity: {
                label: 'Density',
                value: 1.2,
                min: 0,
                max: 5,
                step: 0.1,
              },
            },
            { collapsed: true }
          ),
          'CF Appearance': folder(
            {
              cfBrightness: {
                label: 'Brightness',
                value: 1.8,
                min: 0,
                max: 5,
                step: 0.1,
              },
              cfSaturation: {
                label: 'Saturation',
                value: 1.0,
                min: 0,
                max: 3,
                step: 0.1,
              },
              cfTintColor: { label: 'Tint', value: '#ffffff' },
              cfCoreColor: { label: 'Core', value: '#ffffcc' },
              cfBorderColor: { label: 'Border', value: '#ff6600' },
              cfSmokeColor: { label: 'Smoke', value: '#330000' },
            },
            { collapsed: true }
          ),
          'CF Embers': folder(
            {
              cfEmberDensity: {
                label: 'Density',
                value: 0.15,
                min: 0,
                max: 1,
                step: 0.01,
              },
              cfEmberSize: {
                label: 'Size',
                value: 0.25,
                min: 0.05,
                max: 1,
                step: 0.01,
              },
              cfEmberColor: { label: 'Color', value: '#ff4400' },
            },
            { collapsed: true }
          ),
          'CF Quality': folder(
            {
              cfSteps: {
                label: 'Steps',
                value: 64,
                min: 8,
                max: 128,
                step: 8,
              },
              cfStepSize: {
                label: 'Step Size',
                value: 1.0,
                min: 0.1,
                max: 3,
                step: 0.1,
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),

      // ── FireballVolume (ray-marched spherical explosion) ─────────────────
      'Fireball Volume': folder(
        {
          'FV Position': folder(
            {
              fvPosX: { label: 'X', value: 7, min: -20, max: 20, step: 0.1 },
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
            allowedTypes: 'fire',
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
      bgColor,
      lineColor,
      showSplinePoints,
      showSplineLine,
      pointMode,
      attractorStrength,
      attractorRadius,
      showAttractors,
      attractorMode,
      attractorVersion,
      forceAttractorUpdate,
      splineConfigs,
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
      fireSpline: {
        baseRadius: fsBaseRadius,
        tubularSegments: fsTubular,
        radialSegments: fsRadial,
        capSegments: fsCap,
        speed: fsSpeed,
        weight: fsWeight,
        noiseFreq: fsNoiseFreq,
        noiseAmp: fsNoiseAmp,
        smokeLightColor: fsSmokeLight,
        smokeDarkColor: fsSmokeDark,
        animated: fsAnimated,
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
      volumetricFire: {
        position: [vfPosX, vfPosY, vfPosZ],
        width: vfWidth,
        height: vfHeight,
        depth: vfDepth,
        sliceSpacing: vfSliceSpacing,
        bendX: vfBendX,
        bendZ: vfBendZ,
        animated: vfAnimated,
        animSpeed: vfAnimSpeed,
        showSpline: vfShowSpline,
        showVolume: vfShowVolume,
        magnitude: vfMagnitude,
        lacunarity: vfLacunarity,
        gain: vfGain,
        tintColor: vfTintColor,
        saturation: vfSaturation,
        brightness: vfBrightness,
      },
      cs184Fire: {
        position: [cfPosX, cfPosY, cfPosZ],
        width: cfWidth,
        height: cfHeight,
        depth: cfDepth,
        bendX: cfBendX,
        bendZ: cfBendZ,
        animated: cfAnimated,
        animSpeed: cfAnimSpeed,
        magnitude: cfMagnitude,
        lacunarity: cfLacunarity,
        gain: cfGain,
        speed: cfSpeed,
        density: cfDensity,
        brightness: cfBrightness,
        saturation: cfSaturation,
        tintColor: cfTintColor,
        coreColor: cfCoreColor,
        borderColor: cfBorderColor,
        smokeColor: cfSmokeColor,
        emberDensity: cfEmberDensity,
        emberSize: cfEmberSize,
        emberColor: cfEmberColor,
        steps: cfSteps,
        stepSize: cfStepSize,
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
      bgColor,
      lineColor,
      showSplinePoints,
      showSplineLine,
      pointMode,
      attractorStrength,
      attractorRadius,
      showAttractors,
      attractorMode,
      attractorVersion,
      forceAttractorUpdate,
      splineConfigs,
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
      fsBaseRadius,
      fsTubular,
      fsRadial,
      fsCap,
      fsSpeed,
      fsWeight,
      fsNoiseFreq,
      fsNoiseAmp,
      fsSmokeLight,
      fsSmokeDark,
      fsAnimated,
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
      vfPosX,
      vfPosY,
      vfPosZ,
      vfWidth,
      vfHeight,
      vfDepth,
      vfSliceSpacing,
      vfBendX,
      vfBendZ,
      vfAnimated,
      vfAnimSpeed,
      vfShowSpline,
      vfShowVolume,
      vfMagnitude,
      vfLacunarity,
      vfGain,
      vfTintColor,
      vfSaturation,
      vfBrightness,
      cfPosX,
      cfPosY,
      cfPosZ,
      cfWidth,
      cfHeight,
      cfDepth,
      cfBendX,
      cfBendZ,
      cfAnimated,
      cfAnimSpeed,
      cfMagnitude,
      cfLacunarity,
      cfGain,
      cfSpeed,
      cfDensity,
      cfBrightness,
      cfSaturation,
      cfTintColor,
      cfCoreColor,
      cfBorderColor,
      cfSmokeColor,
      cfEmberDensity,
      cfEmberSize,
      cfEmberColor,
      cfSteps,
      cfStepSize,
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
