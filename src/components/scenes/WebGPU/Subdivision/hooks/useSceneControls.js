import { useMemo, useRef } from 'react';

import { button, folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import { useMediaRecorder } from '@modules/mediaRecorder';
import { RENDER_OPTIONS, SCENE_KEYS } from '@modules/subdivision';

import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';
import { SCENE_LABEL, folderControls } from '../utils/controls';
import rollControls from '../utils/rollControls';

const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const FOLDERS = {
  field: 'Field',
  output: 'Piece',
  palette: 'Palette',
  scene: 'Loop',
  video: 'Loop',
  structure: 'Structure',
};
const PATHS = Object.fromEntries(
  SCENE_KEYS.map((key) => [key, FOLDERS[RENDER_OPTIONS[key].section]])
);
const keysIn = (section) =>
  SCENE_KEYS.filter((key) => RENDER_OPTIONS[key].section === section);

const ROLL_BUTTONS = {
  'New piece': 'all',
  Reseed: 'seeds',
  'Roll structure': 'structure',
  'Roll field': 'field',
  'Roll palette': 'palette',
};

export default function useSceneControls() {
  const { attachSetControls, controlsSnapshotRef, presetsFolder } =
    usePresetsFolder({
      defaultPreset: DEFAULT_PRESET,
      getPresetControls,
      presets: PRESETS,
    });

  const setControlsRef = useRef(null);
  const cameraApiRef = useRef(null);
  const { buildCamera, cameraControls } = useSceneCameraControls({
    apiRef: cameraApiRef,
    camera: CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
  });

  const [controls, setControls] = useControls(SCENE_LABEL, () => {
    const saved = controlsSnapshotRef.current;
    const section = (id, extra = {}) =>
      folder(
        { ...folderControls(FOLDERS[id], keysIn(id), saved, PATHS), ...extra },
        { collapsed: true }
      );
    const rollButtons = Object.fromEntries(
      Object.entries(ROLL_BUTTONS).map(([label, what]) => [
        label,
        button(() =>
          setControlsRef.current?.(
            rollControls(controlsSnapshotRef.current, what)
          )
        ),
      ])
    );

    return {
      Presets: presetsFolder,
      Camera: folder(cameraControls, { collapsed: true }),
      Piece: section('output', rollButtons),
      Structure: section('structure'),
      Field: section('field', {
        sourceUpload: {
          image: undefined,
          label: 'Upload image',
          render: (get) => get(`${SCENE_LABEL}.Field.field`) === 'image',
        },
      }),
      Palette: section('palette'),
      Loop: folder(
        {
          ...folderControls('Loop', keysIn('video'), saved, PATHS),
          ...folderControls('Loop', keysIn('scene'), saved, PATHS),
        },
        { collapsed: true }
      ),
    };
  });

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

  return useMemo(
    () => ({ ...controls, camera, setControlsRef }),
    [camera, controls]
  );
}
