import { useCallback, useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  BLOCK_PARTY_CAMERA,
  BLOCK_PARTY_LIGHTING,
  BLOCK_PARTY_POST,
} from '@modules/blockPartyRender';
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

import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import sceneFolders, { SCENE_LABEL, rollPalette } from '../utils/controls';

const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const LIGHTING_FOLDER_PATH = `${SCENE_LABEL}.Lighting`;
const MAX_SEED = 9999;

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
    camera: BLOCK_PARTY_CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
  });

  const { buildLighting, lightingControls } = useSceneLightingControls({
    controlsSnapshotRef,
    lighting: BLOCK_PARTY_LIGHTING,
    lightingFolderPath: LIGHTING_FOLDER_PATH,
  });

  const { buildPost, postControls } = useScenePostControls({
    controlsSnapshotRef,
    post: BLOCK_PARTY_POST,
  });

  // The reference reseeds on click; here the button advances the same seed
  // control, so a preset still pins a reproducible city.
  const setControlsRef = useRef(null);
  const onReseed = useCallback(() => {
    const { seed } = controlsSnapshotRef.current;
    setControlsRef.current?.({ seed: (seed % MAX_SEED) + 1 });
  }, [controlsSnapshotRef]);
  const onRollPalette = useCallback(() => {
    const rolled = rollPalette(controlsSnapshotRef.current);
    setControlsRef.current?.({
      cellStrength: rolled.cellStrength,
      colorBy: rolled.colorBy,
      colorTarget: rolled.colorTarget,
      palette: rolled.palette,
      paletteExact: rolled.paletteExact,
      paletteRepeat: rolled.paletteRepeat,
      paletteReverse: rolled.paletteReverse,
      paletteShift: rolled.paletteShift,
      paletteSurfaces: rolled.paletteSurfaces,
    });
  }, [controlsSnapshotRef]);

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Lighting: folder(lightingControls, { collapsed: true }),
    ...sceneFolders(controlsSnapshotRef.current, { onReseed, onRollPalette }),
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
    () => ({ ...controls, camera, cameraApiRef, lighting, post }),
    [camera, controls, lighting, post]
  );
}
