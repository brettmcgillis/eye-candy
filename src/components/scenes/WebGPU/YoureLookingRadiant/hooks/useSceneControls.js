import { useMemo } from 'react';

import { useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import { useMediaRecorder } from '@modules/mediaRecorder';

import getSceneControls from '../components/getSceneControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';

const SCENE_LABEL = "You're Looking Radiant";

// Every key gets a fallback whatever preset is active. The active preset is
// layered over it below.
const PRESET_FALLBACK = Object.assign({}, ...Object.values(PRESETS));

export default function useSceneControls() {
  const { attachSetControls, controlsSnapshotRef, presetsFolder } =
    usePresetsFolder({
      defaultPreset: DEFAULT_PRESET,
      getPresetControls,
      presets: PRESETS,
    });

  // usePresetsFolder only calls setControls on mount when the query param needs
  // repairing, so whatever seeds this schema IS what the scene opens with. It
  // has to be the ACTIVE preset — controlsSnapshotRef already holds it, deep
  // link included — or a linked preset shows the default's values until the
  // Reset button is pressed. Same reason the camera and lighting builders seed
  // from this ref (docs/scene-conventions.md §10).
  const schemaSeed = { ...PRESET_FALLBACK, ...controlsSnapshotRef.current };

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    ...getSceneControls(schemaSeed),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  useMediaRecorder({ fileName: SCENE_LABEL });

  return useMemo(() => ({ ...controls }), [controls]);
}
