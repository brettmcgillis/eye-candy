import { folder, useControls } from 'leva';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import getCandleFolder from '../components/useCandleControls';
import { SCENE_PRESETS } from '../presets/scenePresets';

const DEFAULT_PRESET = 'Enlightened';

function getPresetControls({ presetSnapshot }) {
  return presetSnapshot;
}

export default function useSceneControls() {
  const {
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
    selectedPreset,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_PRESET,
    getPresetControls,
    presets: SCENE_PRESETS,
  });

  const [controls, setControls] = useControls(
    'Burning At Both Ends',
    () => ({
      Presets: presetsFolder,
      Scene: folder(
        {
          autoRotate: {
            label: 'Auto Rotate',
            value: SCENE_PRESETS[initialPreset].autoRotate ?? true,
          },
          backgroundColor: {
            label: 'BG',
            value: SCENE_PRESETS[initialPreset].backgroundColor ?? '#050507',
          },
          groundPlaneColor: {
            label: 'Ground Color',
            value: SCENE_PRESETS[initialPreset].groundPlaneColor ?? '#111111',
          },
          ambientLightIntensity: {
            label: 'Ambient Intensity',
            value: SCENE_PRESETS[initialPreset].ambientLightIntensity ?? 0.08,
            min: 0,
            max: 2,
            step: 0.01,
          },
          cameraFramePadding: {
            label: 'Frame Padding',
            value: SCENE_PRESETS[initialPreset].cameraFramePadding ?? 0.92,
            min: 0.75,
            max: 1.25,
            step: 0.01,
          },
          cameraDistanceOffset: {
            label: 'Camera Offset',
            value: SCENE_PRESETS[initialPreset].cameraDistanceOffset ?? 1.25,
            min: 0,
            max: 6,
            step: 0.05,
          },
          'Post Processing': folder(
            {
              bloomEnabled: {
                label: 'Bloom',
                value: SCENE_PRESETS[initialPreset].bloomEnabled ?? true,
              },
              bloomIntensity: {
                label: 'Intensity',
                value: SCENE_PRESETS[initialPreset].bloomIntensity ?? 1.6,
                min: 0,
                max: 6,
                step: 0.01,
              },
              bloomLuminanceThreshold: {
                label: 'Lum Threshold',
                value:
                  SCENE_PRESETS[initialPreset].bloomLuminanceThreshold ?? 0.5,
                min: 0,
                max: 1,
                step: 0.01,
              },
              bloomLuminanceSmoothing: {
                label: 'Lum Smoothing',
                value:
                  SCENE_PRESETS[initialPreset].bloomLuminanceSmoothing ?? 0.35,
                min: 0,
                max: 1,
                step: 0.01,
              },
              bloomRadius: {
                label: 'Radius',
                value: SCENE_PRESETS[initialPreset].bloomRadius ?? 0.6,
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

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  const mediaRecorderFileName = selectedPreset
    ? `Burning At Both Ends - ${selectedPreset}`
    : 'Burning At Both Ends';
  useMediaRecorder({ fileName: mediaRecorderFileName });

  return controls;
}
