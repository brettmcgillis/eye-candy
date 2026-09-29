import { useCallback, useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import {
  POOL_KEYS,
  facets,
  keysInFacet,
  randomSeed,
  rollKumikoConfig,
} from '@modules/kumiko';
import {
  KUMIKO_CAMERA,
  KUMIKO_LIGHTING,
  PALETTE_NAMES,
  paletteStops,
} from '@modules/kumikoRender';
import {
  getLightingControlsKey,
  useSceneLightingControls,
} from '@modules/lightingRig';
import { useMediaRecorder } from '@modules/mediaRecorder';

import getBuildControls from '../components/getBuildControls';
import getColorControls from '../components/getColorControls';
import getImageControls from '../components/getImageControls';
import getMixControls from '../components/getMixControls';
import getPanelControls from '../components/getPanelControls';
import getPoolControls from '../components/getPoolControls';
import getSceneControls from '../components/getSceneControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';

const SCENE_LABEL = 'Kumiko';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const LIGHTING_FOLDER_PATH = `${SCENE_LABEL}.Lighting`;
const RICH_PALETTES = PALETTE_NAMES.filter(
  (name) => paletteStops(name).length >= 3
);

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
    camera: KUMIKO_CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
  });

  const { buildLighting, lightingControls } = useSceneLightingControls({
    controlsSnapshotRef,
    lighting: KUMIKO_LIGHTING,
    lightingFolderPath: LIGHTING_FOLDER_PATH,
  });

  const actionsRef = useRef({});
  const act = useCallback(
    (name) =>
      (...args) =>
        actionsRef.current[name]?.(...args),
    []
  );

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Lighting: folder(lightingControls, { collapsed: true }),
    Panel: getPanelControls(preset, { onReseed: act('reseed') }),
    Patterns: getPoolControls(preset, { onPool: act('pool') }),
    Mixing: getMixControls(preset),
    Image: getImageControls(preset),
    Colour: getColorControls(preset),
    Build: getBuildControls(preset),
    Dice: getSceneControls({
      onRegenerate: act('regenerate'),
      onRoll: act('roll'),
    }),
  }));

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  // Rolling one facet leaves the others exactly as they are.
  actionsRef.current = {
    pool: (on) =>
      setControls(Object.fromEntries(POOL_KEYS.map((key) => [key, on]))),
    regenerate: () => {
      const seed = randomSeed();
      const rolled = rollKumikoConfig(seed, { palettes: RICH_PALETTES });
      setControls({
        seed,
        ...Object.fromEntries(
          facets()
            .flatMap((facet) => keysInFacet(facet))
            .map((key) => [key, rolled[key]])
        ),
      });
    },
    reseed: () => setControls({ seed: randomSeed() }),
    roll: (facet) => {
      const snapshot = controlsSnapshotRef.current ?? {};
      const rolled = rollKumikoConfig(snapshot.seed ?? randomSeed(), {
        base: snapshot,
        keep: facets().filter((other) => other !== facet),
        palettes: RICH_PALETTES,
        seeds: { [facet]: randomSeed() },
      });
      setControls(
        Object.fromEntries(keysInFacet(facet).map((key) => [key, rolled[key]]))
      );
    },
  };

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
    () => ({ ...controls, camera, cameraApiRef, lighting }),
    [camera, controls, lighting]
  );
}
