import { useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import { FEET, voidRadiusAt } from '@modules/houseOfLeaves';
import {
  getLightingControlsKey,
  useSceneLightingControls,
} from '@modules/lightingRig';
import { useMediaRecorder } from '@modules/mediaRecorder';

import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';
import createLayout from '../utils/layout';
import LIGHTING from '../utils/lighting';
import {
  getBeamControls,
  getCorridorControls,
  getDressingControls,
  getFlareControls,
  getFogControls,
  getJourneyControls,
  getMouthControls,
  getShaftControls,
  getStreamingControls,
  getSurfaceControls,
  getWalkControls,
  getWrongnessControls,
} from '../utils/walkControls';

const SCENE_LABEL = 'House of Leaves';
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

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, { collapsed: true }),
    Lighting: folder(lightingControls, { collapsed: true }),
    Walk: getWalkControls(),
    Journey: getJourneyControls(),
    Corridor: getCorridorControls(),
    Dressing: getDressingControls(),
    Shaft: getShaftControls(),
    Mouths: getMouthControls(),
    Wrongness: getWrongnessControls(),
    Flares: getFlareControls(),
    Flashlight: getBeamControls(),
    Volumetrics: getFogControls(),
    Surfaces: getSurfaceControls(),
    Streaming: getStreamingControls(),
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

  // The profile's parameter bag, derived from the flat controls rather than
  // stored alongside them. Its identity is stable across edits that do not
  // touch the shaft, which is what keeps the walker from being respawned and
  // the streamed geometry from being rebuilt on an unrelated tweak.
  const shaft = useMemo(
    () => ({
      voidRadius: (controls.voidDiameterFt * FEET) / 2,
      grownRadius: (controls.grownDiameterFt * FEET) / 2,
      growthRun: controls.growthRun,
      risePerTurn: controls.risePerTurn,
      clockwise: controls.clockwise,
      landingSpacing: controls.landingSpacing,
      landingArc: controls.landingArc,
      radiusDriftAmount: controls.radiusDriftAmount,
      radiusDriftWavelength: controls.radiusDriftWavelength,
      axisDriftAmount: controls.axisDriftAmount,
      axisDriftWavelength: controls.axisDriftWavelength,
      overlapAmount: controls.overlapAmount,
      overlapWavelength: controls.overlapWavelength,
      landingDriftAmount: controls.landingDriftAmount,
      landingDriftPeriod: controls.landingDriftPeriod,
    }),
    [
      controls.axisDriftAmount,
      controls.axisDriftWavelength,
      controls.clockwise,
      controls.grownDiameterFt,
      controls.growthRun,
      controls.landingArc,
      controls.landingDriftAmount,
      controls.landingDriftPeriod,
      controls.landingSpacing,
      controls.overlapAmount,
      controls.overlapWavelength,
      controls.radiusDriftAmount,
      controls.radiusDriftWavelength,
      controls.risePerTurn,
      controls.voidDiameterFt,
    ]
  );

  // Derived, not controlled: the stairwell's mouth is wherever the shaft
  // actually starts, so the room's hole cannot be set to disagree with it.
  const layout = useMemo(
    () =>
      createLayout({
        hallLength: controls.hallLength,
        roomSize: controls.roomSize,
      }),
    [controls.hallLength, controls.roomSize]
  );
  const holeRadius = useMemo(
    () => voidRadiusAt(0, shaft) + controls.stairWidth,
    [controls.stairWidth, shaft]
  );

  return useMemo(
    () => ({
      ...controls,
      cameraApiRef,
      camera,
      lighting,
      shaft,
      holeRadius,
      origin: layout.origin,
      layout,
    }),
    [camera, controls, holeRadius, layout, lighting, shaft]
  );
}
