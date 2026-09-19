import { useMemo, useRef } from 'react';

import { folder, useControls } from 'leva';

import usePresetsFolder from '@hooks/usePresetsFolder';
import {
  getCameraControlsKey,
  useSceneCameraControls,
} from '@modules/cameraRig';
import { FEET, riseTo, uAtRise } from '@modules/houseOfLeaves';
import {
  getLightingControlsKey,
  useSceneLightingControls,
} from '@modules/lightingRig';
import { useMediaRecorder } from '@modules/mediaRecorder';

import {
  getCorridorControls,
  getDressingControls,
} from '../components/getCorridorControls';
import {
  getJourneyControls,
  getLivingRoomControls,
} from '../components/getJourneyControls';
import {
  getBeamControls,
  getFlareControls,
} from '../components/getLightControls';
import { getFogControls, getPostControls } from '../components/getPostControls';
import {
  getMouthControls,
  getShaftControls,
  getWrongnessControls,
} from '../components/getShaftControls';
import {
  getStreamingControls,
  getSurfaceControls,
} from '../components/getSurfaceControls';
import {
  getDirectorControls,
  getWalkControls,
} from '../components/getWalkControls';
import { DEFAULT_PRESET, PRESETS, getPresetControls } from '../presets/presets';
import CAMERA from '../utils/camera';
import LIGHTING from '../utils/lighting';
import { ROW_METRES } from '../utils/shaftGrid';

const SCENE_LABEL = 'House of Leaves';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const LIGHTING_FOLDER_PATH = `${SCENE_LABEL}.Lighting`;

const snapTo = (value, step) => Math.max(step, Math.round(value / step) * step);

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
    Director: getDirectorControls(),
    Journey: getJourneyControls(),
    'Living Room': getLivingRoomControls(),
    Corridor: getCorridorControls(),
    Dressing: getDressingControls(),
    Shaft: getShaftControls(),
    Wrongness: getWrongnessControls(),
    Mouths: getMouthControls(),
    Flares: getFlareControls(),
    Flashlight: getBeamControls(),
    Volumetrics: getFogControls(),
    Post: getPostControls(),
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
  // touch the shaft, which is what keeps the streamed geometry from being
  // rebuilt on an unrelated tweak. The descent is snapped so the floor lands
  // on a row of the wall grid, and the landings are fixed before snapping so
  // the snap cannot move one.
  const shaft = useMemo(() => {
    const provisional = {
      voidRadius: (controls.voidDiameterFt * FEET) / 2,
      grownRadius: (controls.grownDiameterFt * FEET) / 2,
      growthRun: controls.shaftGrowthRun,
      stairSlope: controls.stairSlope,
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
      stairWidth: controls.stairWidth,
      wallGap: controls.wallGap,
      // The corridor arrives from -X; the top landing waits on that side.
      startAngle: Math.PI,
      descentLength: controls.descentLength,
      floorMargin: controls.floorSkirt + 8,
    };
    const rise = riseTo(controls.descentLength, provisional);
    const rowFloor = Math.max(4, Math.round(rise / ROW_METRES));
    const descentLength = uAtRise(
      rowFloor * ROW_METRES,
      provisional,
      controls.descentLength * 1.5 + 50
    );
    return { ...provisional, descentLength };
  }, [
    controls.axisDriftAmount,
    controls.axisDriftWavelength,
    controls.clockwise,
    controls.descentLength,
    controls.floorSkirt,
    controls.grownDiameterFt,
    controls.landingArc,
    controls.landingDriftAmount,
    controls.landingDriftPeriod,
    controls.landingSpacing,
    controls.overlapAmount,
    controls.overlapWavelength,
    controls.radiusDriftAmount,
    controls.radiusDriftWavelength,
    controls.stairSlope,
    controls.shaftGrowthRun,
    controls.stairWidth,
    controls.voidDiameterFt,
    controls.wallGap,
  ]);

  const shaftRows = useMemo(() => {
    const rowFloor = Math.round(
      riseTo(shaft.descentLength, shaft) / ROW_METRES
    );
    const skirtRows = Math.max(2, Math.round(controls.floorSkirt / ROW_METRES));
    return { rowFloor, rowTop: rowFloor - skirtRows };
  }, [controls.floorSkirt, shaft]);

  // Hallways are whole numbers of segments, so the last unit ends exactly at
  // the wall it leads to.
  const hallLength = snapTo(controls.hallLength, controls.segmentLength);
  const returnLength = snapTo(controls.returnLength, controls.segmentLength);

  // Anything that moves a zone's placement rebuilds the world and restarts
  // the walk.
  const layoutKey = [
    controls.startZone,
    hallLength,
    returnLength,
    controls.roomSize,
    controls.livingDepth,
    controls.livingWidth,
    controls.livingDoorZ,
    controls.wallThickness,
    controls.floorExits,
    controls.floorExitVariance,
    controls.spokeLength,
    controls.startWidth,
    controls.startHeight,
    controls.corridorWidth,
    controls.corridorHeight,
    controls.hallGrowthRun,
    controls.segmentLength,
    controls.walkerRadius,
    shaft,
  ]
    .map((value) => (typeof value === 'object' ? JSON.stringify(value) : value))
    .join('|');

  return useMemo(
    () => ({
      ...controls,
      hallLength,
      returnLength,
      cameraApiRef,
      camera,
      lighting,
      shaft,
      shaftRows,
      layoutKey,
    }),
    [
      camera,
      controls,
      hallLength,
      layoutKey,
      lighting,
      returnLength,
      shaft,
      shaftRows,
    ]
  );
}
