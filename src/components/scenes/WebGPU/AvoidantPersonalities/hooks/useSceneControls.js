import { useMemo } from 'react';

import { useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import { useMediaRecorder } from '@modules/mediaRecorder';

import getSceneControls from '../components/getSceneControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';

const SCENE_LABEL = 'Avoidant Personalities';

const PRESET_FALLBACK = Object.assign({}, ...Object.values(PRESETS));

export default function useSceneControls() {
  const { attachSetControls, controlsSnapshotRef, presetsFolder } =
    usePresetsFolder({
      defaultPreset: DEFAULT_PRESET,
      getPresetControls,
      presets: PRESETS,
    });

  // Whatever seeds this schema is what the scene opens with, so it has to be
  // the ACTIVE preset — controlsSnapshotRef already holds it, deep link
  // included (docs/scene-conventions.md §10).
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
