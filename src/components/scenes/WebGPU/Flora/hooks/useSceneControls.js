import { useCallback, useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import {
  facets,
  keysInFacet,
  randomSeed,
  rollFloraConfig,
} from '@modules/flora';
import { FLORA_CAMERA, FLORA_LIGHTING } from '@modules/floraRender';
import {
  getLightingControlsKey,
  useSceneLightingControls,
} from '@modules/lightingRig';
import { useMediaRecorder } from '@modules/mediaRecorder';
import { PALETTE_NAMES } from '@utils/gradientPalette';

import getFormControls from '../components/getFormControls';
import getLookControls from '../components/getLookControls';
import getMotionControls from '../components/getMotionControls';
import getSceneControls from '../components/getSceneControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';

const SCENE_LABEL = 'Flora';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const LIGHTING_FOLDER_PATH = `${SCENE_LABEL}.Lighting`;

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

  const preset = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];

  const cameraApiRef = useRef(null);
  const { buildCamera, cameraControls } = useSceneCameraControls({
    apiRef: cameraApiRef,
    camera: FLORA_CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
  });

  const { buildLighting, lightingControls } = useSceneLightingControls({
    controlsSnapshotRef,
    lighting: FLORA_LIGHTING,
    lightingFolderPath: LIGHTING_FOLDER_PATH,
  });

  const lifecycleApiRef = useRef(null);
  const reseedRef = useRef(null);
  const rollRef = useRef(null);
  const onReseed = useCallback(() => reseedRef.current?.(), []);
  const onRegrow = useCallback(() => lifecycleApiRef.current?.regrow(), []);
  const onRestart = useCallback(() => lifecycleApiRef.current?.restart(), []);
  const onRoll = useCallback((facet) => rollRef.current?.(facet), []);

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Lighting: folder(lightingControls, { collapsed: true }),
    Form: getFormControls(preset, { onReseed }),
    Look: getLookControls(preset),
    Motion: getMotionControls(preset, { onRegrow, onRestart }),
    Scene: getSceneControls(preset, { onRoll }),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  reseedRef.current = () => setControls({ seed: randomSeed() });

  // Rolling one facet leaves the others exactly as they are: the roll runs
  // with every other facet held, and only this facet's keys are written back.
  rollRef.current = (facet) => {
    const snapshot = controlsSnapshotRef.current ?? {};
    const rolled = rollFloraConfig(snapshot.seed ?? randomSeed(), {
      base: snapshot,
      keep: facets().filter((other) => other !== facet),
      paletteNames: PALETTE_NAMES,
      seeds: { [facet]: randomSeed() },
    });

    setControls(
      Object.fromEntries(keysInFacet(facet).map((key) => [key, rolled[key]]))
    );
  };

  // Regenerate is every facet at once plus a new seed — a different plant
  // rather than a different cut of this one.
  const regenerate = useCallback(() => {
    const seed = randomSeed();
    const rolled = rollFloraConfig(seed, { paletteNames: PALETTE_NAMES });

    setControls({
      seed,
      ...Object.fromEntries(
        facets()
          .flatMap((facet) => keysInFacet(facet))
          .map((key) => [key, rolled[key]])
      ),
    });
  }, [setControls]);

  // Pause stops the clock where it stands and keeps the speed to restore.
  const pausedSpeedRef = useRef(null);
  const togglePause = useCallback(() => {
    if (pausedSpeedRef.current === null) {
      pausedSpeedRef.current = controlsSnapshotRef.current?.timeScale ?? 1;
      setControls({ timeScale: 0 });
      return;
    }
    setControls({ timeScale: pausedSpeedRef.current || 1 });
    pausedSpeedRef.current = null;
  }, [controlsSnapshotRef, setControls]);

  useMediaRecorder({ fileName: SCENE_LABEL });

  const cameraControlsKey = useMemo(
    () => getCameraControlsKey(controls),
    [controls]
  );
  const camera = useMemo(
    () => buildCamera(controls),
    [buildCamera, cameraControlsKey]
  );

  const lightingControlsKey = useMemo(
    () => getLightingControlsKey(controls),
    [controls]
  );
  const lighting = useMemo(
    () => buildLighting(controls),
    [buildLighting, lightingControlsKey]
  );

  return useMemo(
    () => ({
      ...controls,
      camera,
      cameraApiRef,
      lifecycleApiRef,
      lighting,
      onRegrow,
      onReseed,
      paused: controls.timeScale === 0,
      regenerate,
      togglePause,
    }),
    [camera, controls, lighting, onRegrow, onReseed, regenerate, togglePause]
  );
}
