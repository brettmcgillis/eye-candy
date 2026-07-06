import { useControls } from 'leva';

import { useMemo } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import { useMediaRecorder } from '../../../../../../modules/mediaRecorder';
import getCloudControls from '../components/getCloudControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';

const SCENE_LABEL = 'Cross Talk';
export const WINDOW_SYNC_CHANNEL = 'crossTalk';

// This scene has no Camera folder / CameraRig (docs/scene-conventions.md §10)
// — see components/DesktopStage.jsx for why: the camera is a fixed,
// pixel-accurate viewport rather than something a user frames.
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

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    backgroundColor: { label: 'Sky Color', value: p.backgroundColor },
    syncEasing: {
      label: 'Window Sync Easing',
      max: 0.5,
      min: 0.01,
      step: 0.01,
      value: p.syncEasing,
    },
    Cloud: getCloudControls(p),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  useMediaRecorder({ fileName: SCENE_LABEL });

  return useMemo(() => ({ ...controls }), [controls]);
}
