import { button, folder, useControls } from 'leva';

import { useEffect, useRef } from 'react';

import { localEnv } from '../../../../../../utils/appUtils';
import { SCENE_PRESETS } from '../presets/presets';

const DEFAULTS = {
  // Scene
  backgroundColor: '#f5f5f0',
  cameraMode: 'Fixed',
  ambientIntensity: 0.8,
  mainLightIntensity: 1.2,
  fillLightIntensity: 0.4,

  // Tugboat
  boatMode: 'Fixed',
  boatX: 0,
  boatY: -0.35,
  boatZ: 0,
  boatScale: 0.12,
  boatRotX: 1.1,
  boatRotY: 0.4,
  boatRotZ: 0,
  floatDraft: -0.05,

  // Smoke
  smokeVisible: true,
  smokeOffsetX: 0.02,
  smokeOffsetY: 0.35,
  smokeOffsetZ: -0.04,
  particleColor: '#a8a8a0',
  smokeOpacity: 0.35,
  particleSize: 25,
  particleCount: 3000,
  flowSpeed: 0.15,
  springK: 1.0,
  damping: 0.93,
  turbulence: 0.5,
  fadeRate: 1.5,
  growth: 2.0,
  fadeExponent: 1.0,

  // Water
  waterTopColor: '#2a7f8f',
  waterBottomColor: '#1a5060',
  waterOpacity: 0.85,
  waterTransmission: 0.4,
  waterRoughness: 0.6,
  waterIor: 1.12,
  waterThickness: 0.35,
  waveHeight: 0.08,
  waveChoppiness: 0.5,
  waveSpeed: 0.6,

  // Seafloor
  seafloorVisible: true,
  seafloorColor: '#8a7e6b',
  bumpHeight: 0.08,
  bumpFrequency: 1.0,
  bumpDetail: 1.0,
};

const PRESET_NAMES = Object.keys(SCENE_PRESETS);
const DEFAULT_PRESET = PRESET_NAMES[0];

export default function useStillPullingForYouControls() {
  const controlsSnapshotRef = useRef({ ...DEFAULTS });
  const selectedPresetRef = useRef(DEFAULT_PRESET);

  // Ref-based helper so button closures can call it safely.
  // Filters preset values to only keys Leva has registered —
  // unknown keys cause setControls to crash.
  const safeApplyRef = useRef(null);

  const [controls, setControls] = useControls(
    'Still Pulling For You',
    () => ({
      Presets: folder(
        {
          preset: {
            label: 'Preset',
            value: DEFAULT_PRESET,
            options: PRESET_NAMES,
          },
          reset: button(() => {
            const values = SCENE_PRESETS[selectedPresetRef.current] || DEFAULTS;
            safeApplyRef.current(values);
          }),
          ...(localEnv()
            ? {
                copy: button(() => {
                  const json = JSON.stringify(
                    controlsSnapshotRef.current,
                    null,
                    2
                  );
                  const literal = json.replace(
                    /"([A-Za-z_$][A-Za-z0-9_$]*)":/g,
                    '$1:'
                  );
                  navigator.clipboard.writeText(literal);
                }),
              }
            : {}),
        },
        { collapsed: true }
      ),

      Scene: folder(
        {
          backgroundColor: {
            label: 'Background',
            value: DEFAULTS.backgroundColor,
          },
          cameraMode: {
            label: 'Camera',
            value: DEFAULTS.cameraMode,
            options: ['Fixed', 'Orbit'],
          },
          Lighting: folder(
            {
              ambientIntensity: {
                label: 'Ambient',
                value: DEFAULTS.ambientIntensity,
                min: 0,
                max: 2,
                step: 0.05,
              },
              mainLightIntensity: {
                label: 'Main Light',
                value: DEFAULTS.mainLightIntensity,
                min: 0,
                max: 3,
                step: 0.05,
              },
              fillLightIntensity: {
                label: 'Fill Light',
                value: DEFAULTS.fillLightIntensity,
                min: 0,
                max: 2,
                step: 0.05,
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),

      Tugboat: folder(
        {
          boatMode: {
            label: 'Mode',
            value: DEFAULTS.boatMode,
            options: ['Fixed', 'Floating'],
          },
          boatX: {
            label: 'X',
            value: DEFAULTS.boatX,
            min: -5,
            max: 5,
            step: 0.05,
          },
          boatY: {
            label: 'Y',
            value: DEFAULTS.boatY,
            min: -3,
            max: 3,
            step: 0.05,
          },
          boatZ: {
            label: 'Z',
            value: DEFAULTS.boatZ,
            min: -5,
            max: 5,
            step: 0.05,
          },
          boatScale: {
            label: 'Scale',
            value: DEFAULTS.boatScale,
            min: 0.01,
            max: 0.5,
            step: 0.005,
          },
          boatRotX: {
            label: 'Rot X',
            value: DEFAULTS.boatRotX,
            min: -Math.PI,
            max: Math.PI,
            step: 0.05,
          },
          boatRotY: {
            label: 'Rot Y',
            value: DEFAULTS.boatRotY,
            min: -Math.PI,
            max: Math.PI,
            step: 0.05,
          },
          boatRotZ: {
            label: 'Rot Z',
            value: DEFAULTS.boatRotZ,
            min: -Math.PI,
            max: Math.PI,
            step: 0.05,
          },
          floatDraft: {
            label: 'Float Draft',
            value: DEFAULTS.floatDraft,
            min: -0.5,
            max: 0.5,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),

      Smoke: folder(
        {
          smokeVisible: {
            label: 'Visible',
            value: DEFAULTS.smokeVisible,
          },
          particleColor: {
            label: 'Color',
            value: DEFAULTS.particleColor,
          },
          smokeOpacity: {
            label: 'Opacity',
            value: DEFAULTS.smokeOpacity,
            min: 0,
            max: 1,
            step: 0.01,
          },
          particleSize: {
            label: 'Size',
            value: DEFAULTS.particleSize,
            min: 1,
            max: 100,
            step: 1,
          },
          particleCount: {
            label: 'Count',
            value: DEFAULTS.particleCount,
            min: 100,
            max: 10000,
            step: 100,
          },
          flowSpeed: {
            label: 'Flow Speed',
            value: DEFAULTS.flowSpeed,
            min: 0,
            max: 1,
            step: 0.01,
          },
          springK: {
            label: 'Spring K',
            value: DEFAULTS.springK,
            min: 0,
            max: 5,
            step: 0.1,
          },
          turbulence: {
            label: 'Turbulence',
            value: DEFAULTS.turbulence,
            min: 0,
            max: 3,
            step: 0.1,
          },
        },
        { collapsed: true }
      ),

      Water: folder(
        {
          waterTopColor: { label: 'Top Color', value: DEFAULTS.waterTopColor },
          waterBottomColor: {
            label: 'Bottom Color',
            value: DEFAULTS.waterBottomColor,
          },
          waterOpacity: {
            label: 'Opacity',
            value: DEFAULTS.waterOpacity,
            min: 0,
            max: 1,
            step: 0.01,
          },
          waterRoughness: {
            label: 'Roughness',
            value: DEFAULTS.waterRoughness,
            min: 0,
            max: 1,
            step: 0.01,
          },
          waveHeight: {
            label: 'Wave Height',
            value: DEFAULTS.waveHeight,
            min: 0,
            max: 0.5,
            step: 0.005,
          },
          waveChoppiness: {
            label: 'Choppiness',
            value: DEFAULTS.waveChoppiness,
            min: 0,
            max: 2,
            step: 0.01,
          },
          waveSpeed: {
            label: 'Wave Speed',
            value: DEFAULTS.waveSpeed,
            min: 0,
            max: 2,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),

      Seafloor: folder(
        {
          seafloorVisible: {
            label: 'Visible',
            value: DEFAULTS.seafloorVisible,
          },
          seafloorColor: {
            label: 'Color',
            value: DEFAULTS.seafloorColor,
          },
          bumpHeight: {
            label: 'Bump Height',
            value: DEFAULTS.bumpHeight,
            min: 0,
            max: 0.3,
            step: 0.005,
          },
          bumpFrequency: {
            label: 'Bump Frequency',
            value: DEFAULTS.bumpFrequency,
            min: 0.1,
            max: 4,
            step: 0.05,
          },
          bumpDetail: {
            label: 'Bump Detail',
            value: DEFAULTS.bumpDetail,
            min: 0,
            max: 1,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
    }),
    { collapsed: true }
  );

  controlsSnapshotRef.current = { ...controls };

  // Populate the ref now that setControls is available
  safeApplyRef.current = (values) => {
    const known = Object.keys(controlsSnapshotRef.current);
    const filtered = Object.fromEntries(
      Object.entries(values).filter(([k]) => known.includes(k))
    );
    setControls(filtered);
  };

  const prevPresetRef = useRef(controls.preset);
  useEffect(() => {
    if (controls.preset === prevPresetRef.current) return;
    prevPresetRef.current = controls.preset;
    selectedPresetRef.current = controls.preset;
    const values = SCENE_PRESETS[controls.preset];
    if (values) safeApplyRef.current(values);
  }, [controls, setControls]);

  return controls;
}
