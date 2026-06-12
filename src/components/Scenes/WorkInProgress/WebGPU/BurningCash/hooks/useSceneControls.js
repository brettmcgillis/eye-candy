import { folder, useControls } from 'leva';

import { useMemo } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import useSceneCameraControls from '../../../../../../hooks/useSceneCameraControls';
import PRESETS, {
  DEFAULT_PRESET as DEFAULT_PRESET_KEY,
} from '../presets/presets';
import CAMERA from '../utils/camera';

const SCENE_LABEL = 'Burning Cash';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;

const C = { collapsed: true };

function getPresetControls({ presetSnapshot }) {
  return { ...presetSnapshot };
}

export default function useSceneControls() {
  const {
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
  } = usePresetsFolder({
    defaultPreset: DEFAULT_PRESET_KEY,
    getPresetControls,
    presets: PRESETS,
  });

  const p = PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET_KEY];

  const { buildCamera, cameraControls } = useSceneCameraControls({
    camera: CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
  });

  const [controls, setControls] = useControls(SCENE_LABEL, () => ({
    Presets: presetsFolder,
    Camera: folder(cameraControls, C),
    Bills: folder(
      {
        billCount: {
          value: p.billCount,
          min: 5,
          max: 150,
          step: 1,
          label: 'Count',
        },
        billSize: {
          value: p.billSize,
          min: 0.2,
          max: 1.5,
          step: 0.05,
          label: 'Size',
        },
        curvature: {
          value: p.curvature,
          min: 0,
          max: 0.6,
          step: 0.01,
          label: 'Curvature',
        },
        hundredFraction: {
          value: p.hundredFraction,
          min: 0,
          max: 1,
          step: 0.05,
          label: '$100 Fraction',
        },
      },
      C
    ),
    Wind: folder(
      {
        windSpeed: {
          value: p.windSpeed,
          min: 0,
          max: 4,
          step: 0.05,
          label: 'Speed',
        },
        tumble: {
          value: p.tumble,
          min: 0,
          max: 4,
          step: 0.05,
          label: 'Tumble',
        },
        lift: { value: p.lift, min: 0, max: 4, step: 0.05, label: 'Lift' },
        windDirX: {
          value: p.windDirX,
          min: -1,
          max: 1,
          step: 0.05,
          label: 'Dir X',
        },
        windDirZ: {
          value: p.windDirZ,
          min: -1,
          max: 1,
          step: 0.05,
          label: 'Dir Z',
        },
        stickiness: {
          value: p.stickiness,
          min: 0,
          max: 1,
          step: 0.01,
          label: 'Stickiness',
        },
      },
      C
    ),
    Burn: folder(
      {
        autoIgnite: { value: p.autoIgnite, label: 'Auto Ignite' },
        burnSpeed: {
          value: p.burnSpeed,
          min: 0.05,
          max: 2,
          step: 0.05,
          label: 'Burn Speed',
        },
        igniteMinAge: {
          value: p.igniteMinAge,
          min: 0,
          max: 20,
          step: 0.5,
          label: 'Ignite Min Age',
        },
        igniteMaxAge: {
          value: p.igniteMaxAge,
          min: 1,
          max: 40,
          step: 0.5,
          label: 'Ignite Max Age',
        },
        noiseScale: {
          value: p.noiseScale,
          min: 0.5,
          max: 10,
          step: 0.1,
          label: 'Burn Pattern',
        },
        edgeWidth: {
          value: p.edgeWidth,
          min: 0.01,
          max: 0.3,
          step: 0.005,
          label: 'Glow Width',
        },
        charWidth: {
          value: p.charWidth,
          min: 0.02,
          max: 0.6,
          step: 0.01,
          label: 'Char Width',
        },
        glowColorA: { value: p.glowColorA, label: 'Glow A' },
        glowColorB: { value: p.glowColorB, label: 'Glow B' },
        glowIntensity: {
          value: p.glowIntensity,
          min: 0,
          max: 16,
          step: 0.25,
          label: 'Glow Intensity',
        },
        ignitePercent: {
          value: p.ignitePercent,
          min: 1,
          max: 100,
          step: 1,
          label: 'Ignite Button %',
        },
      },
      C
    ),
    Pallet: folder(
      {
        palletEnabled: { value: p.palletEnabled, label: 'Enabled' },
        palletCols: {
          value: p.palletCols,
          min: 1,
          max: 10,
          step: 1,
          label: 'Columns',
        },
        palletRows: {
          value: p.palletRows,
          min: 1,
          max: 10,
          step: 1,
          label: 'Rows',
        },
        palletLayers: {
          value: p.palletLayers,
          min: 1,
          max: 12,
          step: 1,
          label: 'Layers',
        },
        palletGap: {
          value: p.palletGap,
          min: 0,
          max: 0.4,
          step: 0.01,
          label: 'Gap',
        },
        palletJitter: {
          value: p.palletJitter,
          min: 0,
          max: 1,
          step: 0.05,
          label: 'Jitter',
        },
        palletMissing: {
          value: p.palletMissing,
          min: 0,
          max: 1,
          step: 0.05,
          label: 'Missing (top)',
        },
        palletX: {
          value: p.palletX,
          min: -5,
          max: 5,
          step: 0.1,
          label: 'Position X',
        },
        palletZ: {
          value: p.palletZ,
          min: -5,
          max: 5,
          step: 0.1,
          label: 'Position Z',
        },
      },
      C
    ),
    Embers: folder(
      {
        emberRate: {
          value: p.emberRate,
          min: 0,
          max: 120,
          step: 1,
          label: 'Rate',
        },
        emberSize: {
          value: p.emberSize,
          min: 0.005,
          max: 0.08,
          step: 0.001,
          label: 'Size',
        },
        emberRise: {
          value: p.emberRise,
          min: 0,
          max: 2,
          step: 0.05,
          label: 'Rise',
        },
        emberDrift: {
          value: p.emberDrift,
          min: 0,
          max: 1.5,
          step: 0.05,
          label: 'Drift',
        },
        emberColorHot: { value: p.emberColorHot, label: 'Hot Color' },
        emberColorCool: { value: p.emberColorCool, label: 'Cool Color' },
        emberIntensity: {
          value: p.emberIntensity,
          min: 0,
          max: 12,
          step: 0.25,
          label: 'Intensity',
        },
      },
      C
    ),
    Environment: folder(
      {
        bgColor: { value: p.bgColor, label: 'Background' },
        fogNear: {
          value: p.fogNear,
          min: 1,
          max: 20,
          step: 0.5,
          label: 'Fog Near',
        },
        fogFar: {
          value: p.fogFar,
          min: 5,
          max: 40,
          step: 0.5,
          label: 'Fog Far',
        },
        groundColor: { value: p.groundColor, label: 'Ground' },
        showPile: { value: p.showPile, label: 'Cash Pile' },
        pileScale: {
          value: p.pileScale,
          min: 0.1,
          max: 6,
          step: 0.1,
          label: 'Pile Scale',
        },
        stackCount: {
          value: p.stackCount,
          min: 0,
          max: 60,
          step: 1,
          label: 'Bill Stacks',
        },
        stackLength: {
          value: p.stackLength,
          min: 0.05,
          max: 1,
          step: 0.01,
          label: 'Stack Size',
        },
        stackScale: {
          value: p.stackScale,
          min: 0.1,
          max: 5,
          step: 0.05,
          label: 'Stack Scale',
        },
        stackInnerRadius: {
          value: p.stackInnerRadius,
          min: 0,
          max: 5,
          step: 0.1,
          label: 'Stack Inner R',
        },
        stackOuterRadius: {
          value: p.stackOuterRadius,
          min: 0.5,
          max: 10,
          step: 0.1,
          label: 'Stack Outer R',
        },
      },
      C
    ),
    Lighting: folder(
      {
        ambientIntensity: {
          value: p.ambientIntensity,
          min: 0,
          max: 2,
          step: 0.01,
          label: 'Ambient',
        },
        ambientColor: { value: p.ambientColor, label: 'Ambient Color' },
        keyIntensity: {
          value: p.keyIntensity,
          min: 0,
          max: 10,
          step: 0.1,
          label: 'Key',
        },
        keyColor: { value: p.keyColor, label: 'Key Color' },
        fireLightIntensity: {
          value: p.fireLightIntensity,
          min: 0,
          max: 30,
          step: 0.5,
          label: 'Fire Light',
        },
        fireLightColor: { value: p.fireLightColor, label: 'Fire Color' },
        fireFlicker: {
          value: p.fireFlicker,
          min: 0,
          max: 1,
          step: 0.05,
          label: 'Flicker',
        },
      },
      C
    ),
    Bloom: folder(
      {
        bloomEnabled: { value: p.bloomEnabled, label: 'Enabled' },
        bloomThreshold: {
          value: p.bloomThreshold,
          min: 0,
          max: 3,
          step: 0.05,
          label: 'Threshold',
        },
        bloomStrength: {
          value: p.bloomStrength,
          min: 0,
          max: 3,
          step: 0.05,
          label: 'Strength',
        },
        bloomRadius: {
          value: p.bloomRadius,
          min: 0,
          max: 1.5,
          step: 0.05,
          label: 'Radius',
        },
      },
      C
    ),
    Debug: folder(
      {
        wireframe: { value: p.wireframe },
        showLineup: { value: p.showLineup, label: 'Scale Lineup' },
        lineupOneScale: {
          value: p.lineupOneScale,
          min: 0.01,
          max: 5,
          step: 0.01,
          label: '$1 Scale',
        },
        lineupHundredScale: {
          value: p.lineupHundredScale,
          min: 0.01,
          max: 5,
          step: 0.01,
          label: '$100 Scale',
        },
        lineupStackScale: {
          value: p.lineupStackScale,
          min: 0.01,
          max: 5,
          step: 0.01,
          label: 'Stack Scale',
        },
      },
      C
    ),
  }));

  attachSetControls(setControls);

  const camera = useMemo(() => buildCamera(controls), [buildCamera, controls]);

  return { ...controls, camera };
}
