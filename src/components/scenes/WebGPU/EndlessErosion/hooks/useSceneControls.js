import { useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import { useMediaRecorder } from '@modules/mediaRecorder';

import { CAMERA_PATH, SCENE_LABEL } from '../components/controlPaths';
import getErosionControls from '../components/getErosionControls';
import getMotionControls from '../components/getMotionControls';
import getPaintControls from '../components/getPaintControls';
import getPaletteControls from '../components/getPaletteControls';
import getRenderControls from '../components/getRenderControls';
import getTerrainControls from '../components/getTerrainControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';

export default function useSceneControls() {
  const { attachSetControls, controlsSnapshotRef, presetsFolder } =
    usePresetsFolder({
      defaultPreset: DEFAULT_PRESET,
      getPresetControls,
      presets: PRESETS,
    });

  const cameraApiRef = useRef(null);
  const paintApiRef = useRef(null);

  const { buildCamera, cameraControls } = useSceneCameraControls({
    apiRef: cameraApiRef,
    camera: CAMERA,
    cameraFolderPath: CAMERA_PATH,
    controlsSnapshotRef,
  });

  const snapshot = controlsSnapshotRef.current ?? {};

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Render: folder(getRenderControls(snapshot), { collapsed: true }),
    Erosion: folder(getErosionControls(snapshot), { collapsed: true }),
    Terrain: folder(getTerrainControls(snapshot), { collapsed: true }),
    Motion: folder(getMotionControls(snapshot), { collapsed: true }),
    Paint: folder(getPaintControls(paintApiRef, snapshot), { collapsed: true }),
    Palette: folder(getPaletteControls(snapshot), { collapsed: true }),
  }));

  attachSetControls(setControls);
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
    () => ({ ...controls, camera, cameraApiRef, paintApiRef }),
    [camera, controls]
  );
}
