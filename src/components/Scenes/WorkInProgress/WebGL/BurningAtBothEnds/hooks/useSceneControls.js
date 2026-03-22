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
            value: 0.5,
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
