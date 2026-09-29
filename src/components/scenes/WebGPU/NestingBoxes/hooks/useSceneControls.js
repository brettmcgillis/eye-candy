import { useCallback, useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import {
  getLightingControlsKey,
  useSceneLightingControls,
} from '@modules/lightingRig';
import { useMediaRecorder } from '@modules/mediaRecorder';
import {
  NESTING_BOXES_CAMERA as CAMERA,
  NESTING_BOXES_LIGHTING as LIGHTING,
  NESTING_BOXES_POST as POST,
} from '@modules/nestingBoxesRender';
import { getPostControlsKey, useScenePostControls } from '@modules/postRig';

import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import sceneFolders, { SCENE_LABEL, rollStructure } from '../utils/controls';

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
  const growReplayRef = useRef(0);
  const onRandomize = useCallback(() => {
    setControlsRef.current?.(rollStructure(controlsSnapshotRef.current));
  }, [controlsSnapshotRef]);
  const onReplay = useCallback(() => {
    growReplayRef.current += 1;
  }, []);

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Lighting: folder(lightingControls, { collapsed: true }),
    ...sceneFolders(controlsSnapshotRef.current, { onRandomize, onReplay }),
    Post: folder(postControls, { collapsed: true }),
  }));

  attachSetControls(setControls);
  setControlsRef.current = setControls;
  controlsSnapshotRef.current = { ...controls };

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
      growReplayRef,
      setControlsRef,
      lighting,
      post,
    }),
    [camera, controls, lighting, post]
  );
}
