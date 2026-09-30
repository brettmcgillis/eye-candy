import { useMemo, useRef } from 'react';

import { button, folder, useControls } from 'leva';

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
import { SCENE_KEYS } from '@modules/subdivision';

import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';
import {
  OMITTED_KEYS,
  OPTIONS,
  SCENE_LABEL,
  folderControls,
} from '../utils/controls';
import LIGHTING from '../utils/lighting';
import { RELIEF_KEYS } from '../utils/reliefOptions';
import rollControls from '../utils/rollControls';

const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const LIGHTING_FOLDER_PATH = `${SCENE_LABEL}.Lighting`;
const FOLDERS = {
  field: 'Field',
  motion: 'Motion',
  output: 'Piece',
  palette: 'Palette',
  relief: 'Relief',
  scene: 'Loop',
  structure: 'Structure',
  video: 'Loop',
};
const KEYS = [
  ...SCENE_KEYS.filter((key) => !OMITTED_KEYS.includes(key)),
  ...RELIEF_KEYS,
];
const PANEL_KEYS = ['width', 'height'];
const PATHS = Object.fromEntries(
  [...KEYS, ...PANEL_KEYS].map((key) => [key, FOLDERS[OPTIONS[key].section]])
);
const keysIn = (section) =>
  KEYS.filter((key) => OPTIONS[key].section === section);

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
  const { buildLighting, lightingControls } = useSceneLightingControls({
    controlsSnapshotRef,
    lighting: LIGHTING,
    lightingFolderPath: LIGHTING_FOLDER_PATH,
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
      Lighting: folder(lightingControls, { collapsed: true }),
      Piece: section('output', {
        ...folderControls('Piece', PANEL_KEYS, saved, PATHS),
        ...rollButtons,
      }),
      Structure: section('structure'),
      Field: section('field', {
        sourceUpload: {
          image: undefined,
          label: 'Upload image',
          render: (get) => get(`${SCENE_LABEL}.Field.field`) === 'image',
        },
      }),
      Palette: section('palette'),
      Relief: section('relief'),
      Motion: section('motion'),
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
  const lightingControlsKey = useMemo(
    () => getLightingControlsKey(controls),
    [controls]
  );
  const lighting = useMemo(
    () => buildLighting(controls),
    [buildLighting, lightingControlsKey]
  );

  return useMemo(
    () => ({ ...controls, camera, lighting, setControlsRef }),
    [camera, controls, lighting]
  );
}
