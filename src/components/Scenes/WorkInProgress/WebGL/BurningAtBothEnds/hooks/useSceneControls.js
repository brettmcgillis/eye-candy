import { button, folder, useControls } from 'leva';

import { useRef } from 'react';

import { localEnv } from '../../../../../../utils/appUtils';
import useCandleControls from '../components/useCandleControls';
import { SCENE_PRESETS } from '../presets/scenePresets';

const presetNames = Object.keys(SCENE_PRESETS);
const hasPresets = presetNames.length > 1;

export default function useSceneControls() {
  const controlsSnapshotRef = useRef(SCENE_PRESETS.Default);
  const selectedPresetRef = useRef('Default');

  const [sceneControls] = useControls(
    'Burning At Both Ends',
    () => ({
      Scene: folder(
        {
          ambientLightIntensity: {
            label: 'Ambient Intensity',
            value: 0.08,
            min: 0,
            max: 2,
            step: 0.01,
          },
          backgroundColor: {
            label: 'Background',
            value: '#050507',
          },
        },
        { collapsed: false }
      ),
      flameMotion: folder(
        {
          flameBaseSpeed: {
            label: 'Base Speed',
            value: 1.15,
            min: 0,
            max: 3,
            step: 0.01,
          },
          flameMinSpeed: {
            label: 'Min Speed',
            value: 0.28,
            min: 0,
            max: 2,
            step: 0.01,
          },
          flameSlowFreq: {
            label: 'Slow Freq',
            value: 0.7,
            min: 0,
            max: 4,
            step: 0.01,
          },
          flameSlowAmp: {
            label: 'Slow Amp',
            value: 0.55,
            min: 0,
            max: 2,
            step: 0.01,
          },
          flameFastFreq: {
            label: 'Fast Freq',
            value: 2.6,
            min: 0,
            max: 10,
            step: 0.01,
          },
          flameFastAmp: {
            label: 'Fast Amp',
            value: 0.25,
            min: 0,
            max: 2,
            step: 0.01,
          },
          flameMicroFreq: {
            label: 'Micro Freq',
            value: 5.7,
            min: 0,
            max: 16,
            step: 0.01,
          },
          flameMicroAmp: {
            label: 'Micro Amp',
            value: 0.08,
            min: 0,
            max: 1,
            step: 0.01,
          },
          flameSwayX: {
            label: 'Sway X',
            value: 0.015,
            min: 0,
            max: 0.08,
            step: 0.001,
          },
          flameSwayZ: {
            label: 'Sway Z',
            value: 0.014,
            min: 0,
            max: 0.08,
            step: 0.001,
          },
          flamePulseFreq: {
            label: 'Pulse Freq',
            value: 3.4,
            min: 0,
            max: 12,
            step: 0.01,
          },
          flamePulseAmp: {
            label: 'Pulse Amp',
            value: 0.04,
            min: 0,
            max: 0.25,
            step: 0.001,
          },
        },
        { collapsed: true }
      ),
      waxMetaballs: folder(
        {
          waxUseMetaballs: {
            label: 'Enable Wax Metaballs',
            value: true,
          },
          waxMetaResolution: {
            label: 'Resolution',
            value: 30,
            min: 16,
            max: 60,
            step: 1,
          },
          waxMetaMaxPolyCount: {
            label: 'Max Poly',
            value: 24000,
            min: 8000,
            max: 80000,
            step: 1000,
          },
          waxMetaBlobCount: {
            label: 'Blob Count',
            value: 22,
            min: 10,
            max: 48,
            step: 1,
          },
          waxMetaStrength: {
            label: 'Strength',
            value: 1,
            min: 0.3,
            max: 2,
            step: 0.01,
          },
          waxMetaSubtract: {
            label: 'Subtract',
            value: 10,
            min: 4,
            max: 18,
            step: 0.1,
          },
          waxMetaSpread: {
            label: 'Spread',
            value: 1.3,
            min: 0.7,
            max: 2,
            step: 0.01,
          },
          waxMetaMinOuter: {
            label: 'Min Outer',
            value: 1,
            min: 0.9,
            max: 1.2,
            step: 0.01,
          },
          waxMetaMaxOuter: {
            label: 'Max Outer',
            value: 1.28,
            min: 1,
            max: 1.7,
            step: 0.01,
          },
          waxMetaHeight: {
            label: 'Height',
            value: 0.72,
            min: 0.15,
            max: 1.2,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
      postFx: folder(
        {
          bloomEnabled: {
            label: 'Bloom',
            value: true,
          },
          bloomIntensity: {
            label: 'Intensity',
            value: 1.6,
            min: 0,
            max: 6,
            step: 0.01,
          },
          bloomLuminanceThreshold: {
            label: 'Lum Threshold',
            value: 0.5,
            min: 0,
            max: 1,
            step: 0.01,
          },
          bloomLuminanceSmoothing: {
            label: 'Lum Smoothing',
            value: 0.35,
            min: 0,
            max: 1,
            step: 0.01,
          },
          bloomRadius: {
            label: 'Radius',
            value: 0.6,
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

  const [candleControls, setCandleControls] = useCandleControls('Candle');

  const applyPreset = (name) => {
    const preset = SCENE_PRESETS[name];
    if (!preset) return;
    selectedPresetRef.current = name;
    setCandleControls(preset);
    controlsSnapshotRef.current = { ...preset };
  };

  useControls(
    'Burning At Both Ends',
    () => {
      const schema = {};

      if (hasPresets) {
        schema.Presets = folder(
          {
            preset: {
              label: 'Preset',
              value: 'Default',
              options: presetNames,
              onChange: (v) => applyPreset(v),
            },
            reset: button(() => applyPreset(selectedPresetRef.current)),
            ...(localEnv()
              ? {
                  copy: button(() => {
                    const snap = JSON.stringify(
                      controlsSnapshotRef.current,
                      null,
                      2
                    );
                    const literal = snap.replace(/"([^"]+)":/g, '$1:');
                    navigator.clipboard.writeText(literal);
                  }),
                }
              : {}),
          },
          { collapsed: false }
        );
      }

      return schema;
    },
    { collapsed: true }
  );

  // keep snapshot in sync
  controlsSnapshotRef.current = { ...candleControls };

  return { ...sceneControls, ...candleControls };
}
