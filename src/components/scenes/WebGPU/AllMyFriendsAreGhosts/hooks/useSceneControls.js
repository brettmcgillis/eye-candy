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

import getGhostControls from '../components/getGhostControls';
import {
  getEarthControls,
  getStarControls,
} from '../components/getSpaceControls';
import getBlackHoleControls from '../components/locations/getBlackHoleControls';
import getCampfireControls from '../components/locations/getCampfireControls';
import {
  getLunarControls,
  getTinyMoonControls,
} from '../components/locations/getMoonControls';
import getOceanControls from '../components/locations/getOceanControls';
import getWingControls from '../components/locations/getWingControls';
import BASE from '../presets/base';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';
import LIGHTING from '../utils/lighting';
import { LOCATION_OPTIONS } from '../utils/locations';

const SCENE_LABEL = 'All My Friends Are Ghosts';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const LIGHTING_FOLDER_PATH = `${SCENE_LABEL}.Lighting`;
const BLACK_HOLE_FOLDER_PATH = `${SCENE_LABEL}.Black Hole`;
const CAMPFIRE_FOLDER_PATH = `${SCENE_LABEL}.Campfire`;
const COLLAPSED = { collapsed: true };

export default function useSceneControls() {
  const { attachSetControls, controlsSnapshotRef, presetsFolder } =
    usePresetsFolder({
      defaultPreset: DEFAULT_PRESET,
      getPresetControls,
      presets: PRESETS,
    });

  const p = { ...BASE, ...controlsSnapshotRef.current };

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

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, COLLAPSED),
    Lighting: folder(lightingControls, COLLAPSED),
    Place: folder(
      {
        location: {
          label: 'Location',
          value: p.location,
          options: LOCATION_OPTIONS,
        },
        backdropColor: { label: 'Backdrop', value: p.backdropColor },
        fogEnabled: { label: 'Fog', value: p.fogEnabled },
        fogNear: {
          label: 'Fog Near',
          value: p.fogNear,
          min: 0,
          max: 500,
          step: 0.5,
        },
        fogFar: {
          label: 'Fog Far',
          value: p.fogFar,
          min: 1,
          max: 4000,
          step: 1,
        },
      },
      COLLAPSED
    ),
    Ghost: getGhostControls(p),
    Stars: getStarControls(p),
    Earth: getEarthControls(p),
    'Black Hole': getBlackHoleControls(p, BLACK_HOLE_FOLDER_PATH),
    Ocean: getOceanControls(p),
    Wing: getWingControls(p),
    'Tiny Moon': getTinyMoonControls(p),
    'Lunar Surface': getLunarControls(p),
    Campfire: getCampfireControls(p, CAMPFIRE_FOLDER_PATH),
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

  const lightingControlsKey = useMemo(
    () => getLightingControlsKey(controls),
    [controls]
  );
  const lighting = useMemo(
    () => buildLighting(controls),
    [buildLighting, lightingControlsKey]
  );

  return useMemo(
    () => ({ ...controls, cameraApiRef, camera, lighting }),
    [camera, controls, lighting]
  );
}
