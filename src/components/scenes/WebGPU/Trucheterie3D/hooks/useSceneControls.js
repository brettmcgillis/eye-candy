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
  TRUCHETERIE3D_CAMERA as CAMERA,
  TRUCHETERIE3D_LIGHTING as LIGHTING,
} from '@modules/trucheterie3dRender';
import { useSceneDesign } from '@modules/trucheterieDesigner';

import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import sceneFolders, { SCENE_LABEL, rollFacets } from '../utils/controls';

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

  const setControlsRef = useRef(null);
  const replayRef = useRef(0);
  const onRoll = useCallback(
    (facets) => {
      setControlsRef.current?.(rollFacets(controlsSnapshotRef.current, facets));
    },
    [controlsSnapshotRef]
  );
  const designRef = useRef(null);
  const onDesign = useCallback((action) => designRef.current?.[action]?.(), []);
  const onReplay = useCallback(() => {
    replayRef.current += 1;
  }, []);

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Lighting: folder(lightingControls, { collapsed: true }),
    ...sceneFolders(controlsSnapshotRef.current, {
      onDesign,
      onReplay,
      onRoll,
    }),
  }));

  attachSetControls(setControls);
  setControlsRef.current = setControls;
  controlsSnapshotRef.current = { ...controls };

  const { actions, editor: designApi } = useSceneDesign({
    controls,
    setControls,
  });
  designRef.current = actions;

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
      designApi,
      lighting,
      replayRef,
      setControlsRef,
    }),
    [camera, controls, designApi, lighting]
  );
}
