import { useCallback, useEffect, useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import {
  CONTROL_PANEL_CAMERA as CAMERA,
  CONTROL_PANEL_LIGHTING as LIGHTING,
  CONTROL_PANEL_POST as POST,
} from '@modules/controlPanelRender';
import {
  getLightingControlsKey,
  useSceneLightingControls,
} from '@modules/lightingRig';
import { useMediaRecorder } from '@modules/mediaRecorder';
import { getPostControlsKey, useScenePostControls } from '@modules/postRig';

import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import sceneFolders, { SCENE_LABEL, rollFacet } from '../utils/controls';

const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const LIGHTING_FOLDER_PATH = `${SCENE_LABEL}.Lighting`;

export default function useSceneControls() {
  const { attachSetControls, controlsSnapshotRef, presetsFolder } =
    usePresetsFolder({
      defaultPreset: DEFAULT_PRESET,
      getPresetControls,
      presets: PRESETS,
    });

  const cameraApiRef = useRef(null);
  const { buildCamera, cameraControls } = useSceneCameraControls({
    apiRef: cameraApiRef,
    camera: CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
  });

  const { buildLighting, lightingControls } = useSceneLightingControls({
    controlsSnapshotRef,
    lighting: LIGHTING,
    lightingFolderPath: LIGHTING_FOLDER_PATH,
  });

  const { buildPost, postControls } = useScenePostControls({
    controlsSnapshotRef,
    post: POST,
  });

  const setControlsRef = useRef(null);
  const buildReplayRef = useRef(0);
  const patchSnapshotRef = useRef(null);
  const onSavePatch = useCallback(() => {
    const saved = patchSnapshotRef.current?.();
    if (saved) setControlsRef.current?.({ patchState: saved.patchState });
  }, []);
  const onResetPatch = useCallback(
    () =>
      setControlsRef.current?.({
        patchState: '',
        patchSeed: Math.floor(Math.random() * 100000),
      }),
    []
  );
  const onRoll = useCallback(
    (facet) => {
      setControlsRef.current?.(rollFacet(controlsSnapshotRef.current, facet));
    },
    [controlsSnapshotRef]
  );
  const onReplay = useCallback(() => {
    buildReplayRef.current += 1;
  }, []);
  const releaseRef = useRef(0);
  const onRelease = useCallback(() => {
    releaseRef.current += 1;
  }, []);

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Lighting: folder(lightingControls, { collapsed: true }),
    ...sceneFolders(controlsSnapshotRef.current, {
      onDesign: () => controlsSnapshotRef.current.panelDesign,
      onRelease,
      onSavePatch,
      onResetPatch,
      onReplay,
      onRoll,
    }),
    Post: folder(postControls, { collapsed: true }),
  }));

  attachSetControls(setControls);
  setControlsRef.current = setControls;
  controlsSnapshotRef.current = { ...controls };

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('panelDesign');
    if (code?.startsWith('cp1.'))
      setControls({ panelDesign: code, fitView: false, sequence: 'none' });
  }, []);

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
      buildReplayRef,
      patchSnapshotRef,
      camera,
      cameraApiRef,
      lighting,
      post,
      releaseRef,
    }),
    [camera, controls, lighting, post]
  );
}
