import { button, folder, useControls } from 'leva';

import { useRef } from 'react';

import { localEnv } from '../../../../../../utils/appUtils';
import getCandleFolder from '../components/useCandleControls';
import { SCENE_PRESETS } from '../presets/scenePresets';

const presetNames = Object.keys(SCENE_PRESETS);
const hasPresets = presetNames.length > 1;

export default function useSceneControls() {
  const controlsSnapshotRef = useRef(SCENE_PRESETS.Enlightened);
  const selectedPresetRef = useRef('Enlightened');
  const setControlsRef = useRef(null);

  const applyPreset = (name) => {
    const preset = SCENE_PRESETS[name];
    if (!preset || !setControlsRef.current) return;
    selectedPresetRef.current = name;
    setControlsRef.current(preset);
    controlsSnapshotRef.current = { ...preset };
  };

  const [controls, setControls] = useControls(
    'Burning At Both Ends',
    () => ({
      ...(hasPresets
        ? {
            Presets: folder(
              {
                preset: {
                  label: 'Preset',
                  value: 'Enlightened',
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
              { collapsed: true }
            ),
          }
        : {}),
      Scene: folder(
        {
          autoRotate: { label: 'Auto Rotate', value: true },
          backgroundColor: { label: 'BG', value: '#050507' },
          groundPlaneColor: { label: 'Ground Color', value: '#111111' },
          ambientLightIntensity: {
            label: 'Ambient Intensity',
            value: 0.08,
            min: 0,
            max: 2,
            step: 0.01,
          },
          'Post Processing': folder(
            {
              bloomEnabled: { label: 'Bloom', value: true },
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
        },
        { collapsed: true }
      ),
      Candle: getCandleFolder(),
    }),
    { collapsed: true }
  );

  setControlsRef.current = setControls;
  controlsSnapshotRef.current = { ...controls };

  return controls;
}
