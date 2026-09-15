import { useMemo, useRef } from 'react';

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
import { getPostControlsKey, useScenePostControls } from '@modules/postRig';

import getColorControls from '../components/getColorControls';
import getFogControls from '../components/getFogControls';
import getMotionControls from '../components/getMotionControls';
import getStructureControls from '../components/getStructureControls';
import getSurfaceControls from '../components/getSurfaceControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import { randomStructure } from '../utils/boxTree';
import CAMERA from '../utils/camera';
import LIGHTING from '../utils/lighting';
import POST from '../utils/post';

const SCENE_LABEL = 'Nesting Boxes';
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
  const sceneControls = useMemo(() => {
    const defaultValues = controlsSnapshotRef.current;
    return {
      ...getStructureControls({
        defaultValues,
        onRandomize: () => setControlsRef.current?.(randomStructure()),
      }),
      Motion: folder(
        getMotionControls({
          defaultValues,
          folderPath: `${SCENE_LABEL}.Motion`,
          onReplay: () => {
            growReplayRef.current += 1;
          },
        }),
        { collapsed: true }
      ),
      ...getColorControls({
        defaultValues,
        folderPath: `${SCENE_LABEL}.Color`,
      }),
      ...getSurfaceControls(defaultValues),
      ...getFogControls(defaultValues),
    };
  }, [controlsSnapshotRef]);

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Lighting: folder(lightingControls, { collapsed: true }),
    ...sceneControls,
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
