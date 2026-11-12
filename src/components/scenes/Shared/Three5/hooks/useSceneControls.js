import { useCallback, useMemo, useRef } from 'react';

import { button, buttonGroup, folder, useControls } from 'leva';

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

import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';
import { COLLAPSED, showGroup } from '../utils/controlLayout';
import LIGHTING from '../utils/lighting';
import { SETTINGS } from '../utils/settings';

export default function useSceneControls(actions, isWebGPU = false) {
  const actionsRef = useRef(actions);
  const presetRevision = useRef(0);
  const preparePreset = useCallback(() => {
    presetRevision.current += 1;
  }, []);
  actionsRef.current = actions;
  const { attachSetControls, controlsSnapshotRef, presetsFolder } =
    usePresetsFolder({
      defaultPreset: DEFAULT_PRESET,
      getPresetControls,
      presets: PRESETS,
      preparePreset,
    });
  const { buildCamera, cameraControls } = useSceneCameraControls({
    camera: CAMERA,
    cameraFolderPath: 'Three5.JS.Camera',
    controlsSnapshotRef,
  });
  const { buildLighting, lightingControls } = useSceneLightingControls({
    lighting: LIGHTING,
    lightingFolderPath: 'Three5.JS.Lighting',
    controlsSnapshotRef,
  });
  const saveFrame = {
    'Save animated texture PNG': button(() =>
      actionsRef.current.export('animated')
    ),
  };
  const buttons = {
    'Animation timeline': {
      'Restart animation': button(() => actionsRef.current.restartAnimation()),
    },
    'Wash reveal': saveFrame,
    'Morphing washes': saveFrame,
    'Painting sequence': saveFrame,
    'Draw in space': {
      'Clear space drawing': button(() => actionsRef.current.clearSpace()),
    },
    'Paint on mesh': {
      'Clear all strokes': button(() => actionsRef.current.clear()),
    },
    'Camera drawing': {
      'Repaint drawing': button(() => actionsRef.current.repaint()),
      'Save drawing PNG': button(() => actionsRef.current.export('projection')),
    },
    'Texture engine and export': {
      'Repaint textures': button(() => actionsRef.current.repaint()),
      'Save texture PNG': button(() =>
        actionsRef.current.export('main', controlsSnapshotRef.current)
      ),
      'Save settings JSON': button(() =>
        actionsRef.current.export('settings', controlsSnapshotRef.current)
      ),
    },
  };
  const [controls, setControls] = useControls('Three5.JS', () => ({
    Presets: folder(
      {
        preset: presetsFolder.schema.preset,
        'Preset actions': buttonGroup({
          label: '',
          opts: {
            Reset: presetsFolder.schema.reset.onClick,
            ...(presetsFolder.schema.copy
              ? { Copy: presetsFolder.schema.copy.onClick }
              : {}),
          },
        }),
      },
      { collapsed: false }
    ),
    ...Object.fromEntries(
      Object.entries(SETTINGS)
        .filter(([name]) => name !== 'Study')
        .map(([name, specs]) => [
          name,
          folder(
            { ...specs, ...buttons[name] },
            {
              collapsed: COLLAPSED.has(name),
              render: (get) => showGroup(name, get, isWebGPU),
            }
          ),
        ])
    ),
    Study: folder(SETTINGS.Study, { collapsed: true }),
    Camera: folder(cameraControls, { collapsed: true }),
    Lighting: folder(lightingControls, { collapsed: true }),
  }));
  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };
  useMediaRecorder({ fileName: 'Three5.JS' });
  const cameraKey = getCameraControlsKey(controls);
  const lightingKey = getLightingControlsKey(controls);
  const camera = useMemo(() => buildCamera(controls), [buildCamera, cameraKey]);
  const lighting = useMemo(
    () => buildLighting(controls),
    [buildLighting, lightingKey]
  );
  return { controls, camera, lighting, presetRevision: presetRevision.current };
}
