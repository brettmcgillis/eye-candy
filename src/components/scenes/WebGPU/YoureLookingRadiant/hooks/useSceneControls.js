import { useMemo } from 'react';

import { useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import { useMediaRecorder } from '@modules/mediaRecorder';

import getSceneControls from '../components/getSceneControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';

const SCENE_LABEL = "You're Looking Radiant";

// Merged so every key has a fallback whatever preset is active, then the
// default preset applied last so it actually wins. usePresetsFolder only calls
// setControls on a dropdown change or a reset, never on mount — so whatever
// seeds this schema *is* what the scene opens with, and a plain merge opens on
// whichever preset happens to be declared last.
const PRESET_DEFAULTS = {
  ...Object.assign({}, ...Object.values(PRESETS)),
  ...PRESETS[DEFAULT_PRESET],
};

export default function useSceneControls() {
  const { attachSetControls, controlsSnapshotRef, presetsFolder } =
    usePresetsFolder({
      defaultPreset: DEFAULT_PRESET,
      getPresetControls,
      presets: PRESETS,
    });

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    ...getSceneControls(PRESET_DEFAULTS),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  useMediaRecorder({ fileName: SCENE_LABEL });

  return useMemo(() => ({ ...controls }), [controls]);
}
