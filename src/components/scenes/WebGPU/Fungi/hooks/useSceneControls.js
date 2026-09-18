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
  rollFungiConfig,
} from '@modules/fungi';
import { FUNGI_CAMERA, FUNGI_LIGHTING, FUNGI_POST } from '@modules/fungiRender';
import {
  getLightingControlsKey,
  useSceneLightingControls,
} from '@modules/lightingRig';
import { useMediaRecorder } from '@modules/mediaRecorder';
import { getPostControlsKey, useScenePostControls } from '@modules/postRig';

import getFormControls from '../components/getFormControls';
import getLookControls from '../components/getLookControls';
import getMotionControls from '../components/getMotionControls';
import getSceneControls from '../components/getSceneControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';

const SCENE_LABEL = 'Fungi';
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
    camera: FUNGI_CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
  });

  const { buildLighting, lightingControls } = useSceneLightingControls({
    controlsSnapshotRef,
    lighting: FUNGI_LIGHTING,
    lightingFolderPath: LIGHTING_FOLDER_PATH,
  });

  const { buildPost, postControls } = useScenePostControls({
    controlsSnapshotRef,
    post: FUNGI_POST,
  });

  const lifecycleApiRef = useRef(null);
  const reseedRef = useRef(null);
  const rollRef = useRef(null);
  const onReseed = useCallback(() => reseedRef.current?.(), []);
  const onRot = useCallback(() => lifecycleApiRef.current?.rot(), []);
  const onRestart = useCallback(() => lifecycleApiRef.current?.restart(), []);
  const onRoll = useCallback((facet) => rollRef.current?.(facet), []);

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Lighting: folder(lightingControls, { collapsed: true }),
    Post: folder(postControls, { collapsed: true }),
    Form: getFormControls(preset, { onReseed }),
    Look: getLookControls(preset),
    Lifecycle: getMotionControls(preset, { onRestart, onRot }),
    Scene: getSceneControls(preset, { onRoll }),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  reseedRef.current = () => setControls({ seed: randomSeed() });

  // Rolling one facet leaves the others exactly as they are: the roll runs
  // with every other facet held, and only this facet's keys are written back.
  rollRef.current = (facet) => {
    const snapshot = controlsSnapshotRef.current ?? {};
    const rolled = rollFungiConfig(snapshot.seed ?? randomSeed(), {
      base: snapshot,
      keep: facets().filter((other) => other !== facet),
      seeds: { [facet]: randomSeed() },
    });

    setControls(
      Object.fromEntries(keysInFacet(facet).map((key) => [key, rolled[key]]))
    );
  };

  // Regenerate is every facet at once plus a new seed — a different fungus
  // rather than a different cut of this one.
  const regenerate = useCallback(() => {
    const seed = randomSeed();
    const rolled = rollFungiConfig(seed);

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

  const postControlsKey = useMemo(
    () => getPostControlsKey(controls),
    [controls]
  );
  const post = useMemo(() => buildPost(controls), [buildPost, postControlsKey]);

  return useMemo(
    () => ({
      ...controls,
      camera,
      cameraApiRef,
      lifecycleApiRef,
      lighting,
      onReseed,
      onRot,
      paused: controls.timeScale === 0,
      post,
      regenerate,
      togglePause,
    }),
    [camera, controls, lighting, onReseed, onRot, post, regenerate, togglePause]
  );
}
