import { useCallback, useMemo, useState } from 'react';

import { useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import { useMediaRecorder } from '@modules/mediaRecorder';

import getAutomataControls from '../components/Automata/getAutomataControls';
import getLightplayControls from '../components/Lightplay/getLightplayControls';
import getPachinkoControls from '../components/Pachinko/getPachinkoControls';
import getPendulumControls from '../components/Pendulums/getPendulumControls';
import getRingControls from '../components/Rings/getRingControls';
import getRippleControls from '../components/Ripples/getRippleControls';
import getMusicControls from '../components/getMusicControls';
import {
  ALL_DEFAULTS,
  DEFAULT_PRESET,
  PRESETS,
  getPresetControls,
} from '../presets/presets';
import { getTechnique } from '../presets/views';

const SCENE_LABEL = 'Ear Candy';
const PRESET_PATH = `${SCENE_LABEL}.Presets.preset`;
const RING_COUNT_PATH = `${SCENE_LABEL}.Rings.ringCount`;

const isTechnique = (name) => (get) => getTechnique(get(PRESET_PATH)) === name;

// No Camera folder (docs/scene-conventions.md §10): the stage is a fixed flat
// orthographic frame, so there is nothing for a rig to frame.
export default function useSceneControls() {
  const {
    attachSetControls,
    controlsSnapshotRef,
    presetsFolder,
    selectedPreset,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_PRESET,
    getPresetControls,
    presets: PRESETS,
  });

  const [scatterTick, setScatterTick] = useState(0);
  const [clearTick, setClearTick] = useState(0);
  const onScatter = useCallback(() => setScatterTick((t) => t + 1), []);
  const onClear = useCallback(() => setClearTick((t) => t + 1), []);

  const p = { ...ALL_DEFAULTS, ...controlsSnapshotRef.current };

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Music: getMusicControls(p),
    Pachinko: getPachinkoControls(
      p,
      { onClear, onScatter },
      isTechnique('pachinko')
    ),
    Lightplay: getLightplayControls(p, isTechnique('lightplay')),
    Ripples: getRippleControls(p, isTechnique('ripples')),
    Rings: getRingControls(p, RING_COUNT_PATH, isTechnique('rings')),
    Pendulums: getPendulumControls(p, isTechnique('pendulums')),
    Automata: getAutomataControls(
      p,
      { onClear, onRandomize: onScatter },
      isTechnique('automata')
    ),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  useMediaRecorder({ fileName: SCENE_LABEL });

  return useMemo(
    () => ({ ...controls, clearTick, preset: selectedPreset, scatterTick }),
    [controls, clearTick, scatterTick, selectedPreset]
  );
}
