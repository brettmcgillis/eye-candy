import { useMemo } from 'react';

import { useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import { useMediaRecorder } from '@modules/mediaRecorder';

import getBoardControls from '../components/getBoardControls';
import getCollabControls from '../components/getCollabControls';
import getCompeteControls from '../components/getCompeteControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';

const SCENE_LABEL = 'Party Line';
const PRESET_PATH = `${SCENE_LABEL}.Presets.preset`;
const PRESET_DEFAULTS = Object.assign({}, ...Object.values(PRESETS));

// No CameraRig: the board is a fixed pixel-space stage, not a framed subject.
export default function useSceneControls() {
  const {
    applyPresetByName,
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
    selectedPreset,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_PRESET,
    getPresetControls,
    presets: PRESETS,
  });

  const p = { ...PRESET_DEFAULTS, ...PRESETS[initialPreset] };

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Board: getBoardControls(p),
    'Scribble Together': getCollabControls(
      p,
      (get) => get(PRESET_PATH) === 'ScribbleTogether'
    ),
    'Scribble Battle': getCompeteControls(
      p,
      (get) => get(PRESET_PATH) === 'ScribbleBattle'
    ),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls, preset: selectedPreset };

  useMediaRecorder({ fileName: SCENE_LABEL });

  return useMemo(
    () => ({
      ...controls,
      applyPresetByName,
      controlsSnapshotRef,
      preset: selectedPreset,
    }),
    [applyPresetByName, controls, controlsSnapshotRef, selectedPreset]
  );
}
