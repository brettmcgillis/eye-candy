import { useControls } from 'leva';

import { useCallback, useEffect, useRef } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import { DEFAULT_PRESET, PRESETS } from '../presets/presets';
import getAmbientControls from './controls/getAmbientControls';
import getAudioControls from './controls/getAudioControls';
import getColorControls from './controls/getColorControls';
import getDebugControls from './controls/getDebugControls';
import getInteractivityControls from './controls/getInteractivityControls';
import getPresenceControls from './controls/getPresenceControls';
import getSimulationControls from './controls/getSimulationControls';
import getStageControls from './controls/getStageControls';
import getTrackingControls from './controls/getTrackingControls';

function getPresetControls({ presetName, presetSnapshot }) {
  return { ...presetSnapshot, preset: presetName };
}

export default function useSceneControls() {
  const setControlsRef = useRef(null);
  // Live runtime diagnostics, written by the conductor each frame and polled by
  // the Debug → Readouts monitors (no React state in the frame loop).
  const statsRef = useRef({
    people: 0,
    attractors: 0,
    presence: -1,
    bodyEnergy: 0,
    agitate: 0,
  });
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

  const snapshot = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

  const toggleInteractionMode = useCallback(() => {
    const currentMode = controlsSnapshotRef.current.interactionMode;
    setControlsRef.current?.({
      interactionMode: currentMode === 'attract' ? 'repel' : 'attract',
    });
  }, [controlsSnapshotRef]);

  const [controls, setControls] = useControls(
    'Apparitions',
    () => ({
      Presets: presetsFolder,
      Tracking: getTrackingControls(snapshot),
      Simulation: getSimulationControls(snapshot),
      Color: getColorControls(snapshot),
      Interactivity: getInteractivityControls(snapshot, {
        toggleInteractionMode,
      }),
      Ambient: getAmbientControls(snapshot),
      Presence: getPresenceControls(snapshot),
      Audio: getAudioControls(snapshot),
      Stage: getStageControls(snapshot),
      Debug: getDebugControls(snapshot, { statsRef }),
    }),
    { collapsed: true }
  );

  useEffect(() => {
    setControlsRef.current = setControls;
    attachSetControls(setControls);
  }, [attachSetControls, setControls]);

  useEffect(() => {
    controlsSnapshotRef.current = controls;
  }, [controls, controlsSnapshotRef]);

  return { controls, setControls, statsRef };
}
