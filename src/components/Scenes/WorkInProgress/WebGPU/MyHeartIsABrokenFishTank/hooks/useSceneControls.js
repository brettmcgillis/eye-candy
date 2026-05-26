import { folder, useControls } from 'leva';

import { useEffect, useMemo, useRef } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import {
  WOOD_FINISH_OPTIONS,
  WOOD_GENUS_OPTIONS,
  getWoodMaterialPresetValues,
} from '../../../../../materials/webGPU/WoodMaterial';
import SCENE_PRESETS from '../presets/presets';
import sceneData from '../utils/sceneData';

const DEFAULT_PRESET = 'Default';

function formatControlOptionLabel(value) {
  return value
    .split('_')
    .map((segment) => {
      return segment.charAt(0).toUpperCase() + segment.slice(1);
    })
    .join(' ');
}

function getTableWoodPresetControls({ finish, genus }) {
  const values = getWoodMaterialPresetValues(genus, finish);

  return {
    tableWoodBarkThickness: values.barkThickness,
    tableWoodCellScale: values.cellScale,
    tableWoodCellSize: values.cellSize,
    tableWoodCenterSize: values.centerSize,
    tableWoodClearcoat: values.clearcoat,
    tableWoodClearcoatRoughness: values.clearcoatRoughness,
    tableWoodDarkGrainColor: values.darkGrainColor,
    tableWoodFineWarpScale: values.fineWarpScale,
    tableWoodFineWarpStrength: values.fineWarpStrength,
    tableWoodLargeGrainStretch: values.largeGrainStretch,
    tableWoodLargeWarpScale: values.largeWarpScale,
    tableWoodLightGrainColor: values.lightGrainColor,
    tableWoodRingBias: values.ringBias,
    tableWoodRingSizeVariance: values.ringSizeVariance,
    tableWoodRingThickness: values.ringThickness,
    tableWoodRingVarianceScale: values.ringVarianceScale,
    tableWoodSmallWarpScale: values.smallWarpScale,
    tableWoodSmallWarpStrength: values.smallWarpStrength,
    tableWoodSplotchIntensity: values.splotchIntensity,
    tableWoodSplotchScale: values.splotchScale,
  };
}

const WOOD_FINISH_CONTROL_OPTIONS = Object.freeze(
  Object.fromEntries(
    WOOD_FINISH_OPTIONS.map((value) => [formatControlOptionLabel(value), value])
  )
);

const WOOD_GENUS_CONTROL_OPTIONS = Object.freeze(
  Object.fromEntries(
    WOOD_GENUS_OPTIONS.map((value) => [formatControlOptionLabel(value), value])
  )
);

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
    defaultPreset: DEFAULT_PRESET,
    getPresetControls,
    presets: SCENE_PRESETS,
  });

  const preset = SCENE_PRESETS[initialPreset] || SCENE_PRESETS[DEFAULT_PRESET];
  const tableWoodPresetKeyRef = useRef(
    `${preset.tableWoodGenus}:${preset.tableWoodFinish}`
  );

  const [controls, setControls] = useControls(
    sceneData.sceneTitle,
    () => ({
      Presets: presetsFolder,

      Scene: folder(
        {
          backgroundColor: {
            label: 'Background',
            value: preset.backgroundColor,
          },
          floorColor: {
            label: 'Floor',
            value: preset.floorColor,
          },
          gridColor: {
            label: 'Grid',
            value: preset.gridColor,
          },
          fogColor: {
            label: 'Fog',
            value: preset.fogColor,
          },
          fogNear: {
            label: 'Fog Near',
            max: 40,
            min: 0,
            step: 0.25,
            value: preset.fogNear,
          },
          fogFar: {
            label: 'Fog Far',
            max: 60,
            min: 1,
            step: 0.25,
            value: preset.fogFar,
          },
          ambientIntensity: {
            label: 'Ambient',
            max: 3,
            min: 0,
            step: 0.05,
            value: preset.ambientIntensity,
          },
          directionalIntensity: {
            label: 'Main Light',
            max: 4,
            min: 0,
            step: 0.05,
            value: preset.directionalIntensity,
          },
          directionalPosition: {
            label: 'Light Pos',
            step: 0.1,
            value: preset.directionalPosition,
          },
        },
        { collapsed: true }
      ),

      Camera: folder(
        {
          cameraMode: {
            label: 'Mode',
            options: ['Fixed', 'Orbit', 'Operator'],
            value: preset.cameraMode,
          },
          'Fixed Frame': folder(
            {
              cameraDesktopPosition: {
                label: 'Desktop Pos',
                step: 0.1,
                value: preset.cameraDesktopPosition,
              },
              cameraDesktopTarget: {
                label: 'Desktop Target',
                step: 0.1,
                value: preset.cameraDesktopTarget,
              },
              cameraDesktopFov: {
                label: 'Desktop Fov',
                max: 90,
                min: 15,
                step: 1,
                value: preset.cameraDesktopFov,
              },
              cameraMobilePosition: {
                label: 'Mobile Pos',
                step: 0.1,
                value: preset.cameraMobilePosition,
              },
              cameraMobileTarget: {
                label: 'Mobile Target',
                step: 0.1,
                value: preset.cameraMobileTarget,
              },
              cameraMobileFov: {
                label: 'Mobile Fov',
                max: 90,
                min: 15,
                step: 1,
                value: preset.cameraMobileFov,
              },
            },
            { collapsed: true }
          ),
          Operator: folder(
            {
              operatorMoveSpeed: {
                label: 'Move Speed',
                max: 20,
                min: 0.5,
                step: 0.1,
                value: preset.operatorMoveSpeed,
              },
              operatorLiftSpeed: {
                label: 'Lift Speed',
                max: 20,
                min: 0.5,
                step: 0.1,
                value: preset.operatorLiftSpeed,
              },
              operatorBoostMultiplier: {
                label: 'Boost',
                max: 10,
                min: 1,
                step: 0.1,
                value: preset.operatorBoostMultiplier,
              },
              operatorPointerLookSensitivity: {
                label: 'Pointer Look',
                max: 0.02,
                min: 0.0005,
                step: 0.0005,
                value: preset.operatorPointerLookSensitivity,
              },
              operatorStickLookSpeed: {
                label: 'Stick Look',
                max: 10,
                min: 0.1,
                step: 0.1,
                value: preset.operatorStickLookSpeed,
              },
              operatorZoomSpeed: {
                label: 'Zoom Speed',
                max: 120,
                min: 1,
                step: 1,
                value: preset.operatorZoomSpeed,
              },
              operatorMinFov: {
                label: 'Min Fov',
                max: 90,
                min: 10,
                step: 1,
                value: preset.operatorMinFov,
              },
              operatorMaxFov: {
                label: 'Max Fov',
                max: 120,
                min: 20,
                step: 1,
                value: preset.operatorMaxFov,
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),

      Tank: folder(
        {
          tankVisible: {
            label: 'Visible',
            value: preset.tankVisible,
          },
          tankPosition: {
            label: 'Position',
            step: 0.05,
            value: preset.tankPosition,
          },
          tankRotation: {
            label: 'Rotation',
            max: Math.PI,
            min: -Math.PI,
            step: 0.01,
            value: preset.tankRotation,
          },
          tankScale: {
            label: 'Scale',
            max: 3,
            min: 0.1,
            step: 0.01,
            value: preset.tankScale,
          },
          Dimensions: folder(
            {
              tankWidth: {
                label: 'Width',
                max: 8,
                min: 0.5,
                step: 0.05,
                value: preset.tankWidth,
              },
              tankHeight: {
                label: 'Height',
                max: 8,
                min: 0.5,
                step: 0.05,
                value: preset.tankHeight,
              },
              tankDepth: {
                label: 'Depth',
                max: 8,
                min: 0.5,
                step: 0.05,
                value: preset.tankDepth,
              },
            },
            { collapsed: true }
          ),
          Glass: folder(
            {
              glassThickness: {
                label: 'Thickness',
                max: 0.4,
                min: 0.01,
                step: 0.01,
                value: preset.glassThickness,
              },
              glassColor: {
                label: 'Color',
                value: preset.glassColor,
              },
              glassOpacity: {
                label: 'Opacity',
                max: 1,
                min: 0,
                step: 0.01,
                value: preset.glassOpacity,
              },
              'Break Impulse': folder(
                {
                  splashBreakImpulseStrength: {
                    label: 'Strength',
                    max: 8,
                    min: 0,
                    step: 0.05,
                    value: preset.splashBreakImpulseStrength,
                  },
                  splashBreakImpulseRadius: {
                    label: 'Radius',
                    max: 12,
                    min: 0.1,
                    step: 0.1,
                    value: preset.splashBreakImpulseRadius,
                  },
                  splashBreakImpulseDuration: {
                    label: 'Duration',
                    max: 2,
                    min: 0.01,
                    step: 0.01,
                    value: preset.splashBreakImpulseDuration,
                  },
                },
                { collapsed: true }
              ),
            },
            { collapsed: true }
          ),
          Materials: folder(
            {
              sandColor: {
                label: 'Sand Color',
                value: preset.sandColor,
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),

      Water: folder(
        {
          waterInset: {
            label: 'Water Inset',
            max: 0.4,
            min: 0.01,
            step: 0.01,
            value: preset.waterInset,
          },
          waterLevel: {
            label: 'Water Level',
            max: 1,
            min: 0.05,
            step: 0.01,
            value: preset.waterLevel,
          },
          waterColor: {
            label: 'Water Color',
            value: preset.waterColor,
          },
          drainRate: {
            label: 'Drain Rate',
            max: 1,
            min: 0,
            step: 0.01,
            value: preset.drainRate,
          },
          spillExtent: {
            label: 'Spill Extent',
            max: 10,
            min: 0,
            step: 0.1,
            value: preset.spillExtent,
          },
          spillOpacity: {
            label: 'Spill Opacity',
            max: 1,
            min: 0,
            step: 0.01,
            value: preset.spillOpacity,
          },
          spillThickness: {
            label: 'Spill Thickness',
            max: 0.3,
            min: 0.005,
            step: 0.005,
            value: preset.spillThickness,
          },
          waterDisturbance: {
            label: 'Cursor Push',
            max: 0.5,
            min: 0,
            step: 0.005,
            value: preset.waterDisturbance,
          },
          Splash: folder(
            {
              splashParticleBudget: {
                label: 'Particle Budget',
                options: ['Small', 'Medium', 'Large', 'Very Large'],
                value: preset.splashParticleBudget,
              },
              splashSimSpeed: {
                label: 'Step Scale',
                max: 30,
                min: 0.25,
                step: 0.25,
                value: preset.splashSimSpeed,
              },
              splashMaxDelta: {
                label: 'Max Dt',
                max: 0.5,
                min: 0.01,
                step: 0.01,
                value: preset.splashMaxDelta,
              },
              splashGravity: {
                label: 'Gravity',
                max: 2,
                min: 0,
                step: 0.01,
                value: preset.splashGravity,
              },
              splashColorDensity: {
                label: 'Color Density',
                max: 6,
                min: 0,
                step: 0.1,
                value: preset.splashColorDensity,
              },
              splashRestDensity: {
                label: 'Rest Density',
                max: 8,
                min: 0.5,
                step: 0.1,
                value: preset.splashRestDensity,
              },
              splashStiffness: {
                label: 'Stiffness',
                max: 120,
                min: 1,
                step: 1,
                value: preset.splashStiffness,
              },
              splashViscosity: {
                label: 'Viscosity',
                max: 1,
                min: 0,
                step: 0.01,
                value: preset.splashViscosity,
              },
              splashWallStiffness: {
                label: 'Wall Stiffness',
                max: 4,
                min: 0,
                step: 0.05,
                value: preset.splashWallStiffness,
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),

      Table: folder(
        {
          tablePosition: {
            label: 'Position',
            step: 0.05,
            value: preset.tablePosition,
          },
          Dimensions: folder(
            {
              tableWidth: {
                label: 'Width',
                max: 16,
                min: 0.5,
                step: 0.05,
                value: preset.tableWidth,
              },
              tableDepth: {
                label: 'Depth',
                max: 16,
                min: 0.5,
                step: 0.05,
                value: preset.tableDepth,
              },
              tableThickness: {
                label: 'Thickness',
                max: 1.5,
                min: 0.02,
                step: 0.01,
                value: preset.tableThickness,
              },
            },
            { collapsed: true }
          ),
          Legs: folder(
            {
              tableLegWidth: {
                label: 'Width',
                max: 1.5,
                min: 0.05,
                step: 0.01,
                value: preset.tableLegWidth,
              },
              tableLegDepth: {
                label: 'Depth',
                max: 1.5,
                min: 0.05,
                step: 0.01,
                value: preset.tableLegDepth,
              },
              tableLegInset: {
                label: 'Inset',
                max: 2,
                min: 0,
                step: 0.01,
                value: preset.tableLegInset,
              },
            },
            { collapsed: true }
          ),
          Appearance: folder(
            {
              tableRoughness: {
                label: 'Roughness',
                max: 1,
                min: 0,
                step: 0.01,
                value: preset.tableRoughness,
              },
              tableMetalness: {
                label: 'Metalness',
                max: 1,
                min: 0,
                step: 0.01,
                value: preset.tableMetalness,
              },
              Preset: folder(
                {
                  tableWoodGenus: {
                    label: 'Species',
                    options: WOOD_GENUS_CONTROL_OPTIONS,
                    value: preset.tableWoodGenus,
                  },
                  tableWoodFinish: {
                    label: 'Finish',
                    options: WOOD_FINISH_CONTROL_OPTIONS,
                    value: preset.tableWoodFinish,
                  },
                },
                { collapsed: false }
              ),
              Colors: folder(
                {
                  tableWoodDarkGrainColor: {
                    label: 'Dark Grain',
                    value: preset.tableWoodDarkGrainColor,
                  },
                  tableWoodLightGrainColor: {
                    label: 'Light Grain',
                    value: preset.tableWoodLightGrainColor,
                  },
                },
                { collapsed: true }
              ),
              Mapping: folder(
                {
                  tableWoodGrainScale: {
                    label: 'Scale',
                    step: 0.05,
                    value: preset.tableWoodGrainScale,
                  },
                  tableWoodGrainOffset: {
                    label: 'Offset',
                    step: 0.01,
                    value: preset.tableWoodGrainOffset,
                  },
                  tableWoodGrainRotation: {
                    label: 'Rotation',
                    step: 1,
                    value: preset.tableWoodGrainRotation,
                  },
                },
                { collapsed: true }
              ),
              Structure: folder(
                {
                  tableWoodCenterSize: {
                    label: 'Center Size',
                    max: 2,
                    min: 0,
                    step: 0.01,
                    value: preset.tableWoodCenterSize,
                  },
                  tableWoodLargeWarpScale: {
                    label: 'Large Warp',
                    max: 1,
                    min: 0,
                    step: 0.001,
                    value: preset.tableWoodLargeWarpScale,
                  },
                  tableWoodLargeGrainStretch: {
                    label: 'Large Stretch',
                    max: 1,
                    min: 0,
                    step: 0.001,
                    value: preset.tableWoodLargeGrainStretch,
                  },
                  tableWoodSmallWarpStrength: {
                    label: 'Small Warp Strength',
                    max: 0.2,
                    min: 0,
                    step: 0.001,
                    value: preset.tableWoodSmallWarpStrength,
                  },
                  tableWoodSmallWarpScale: {
                    label: 'Small Warp Scale',
                    max: 16,
                    min: 0.1,
                    step: 0.05,
                    value: preset.tableWoodSmallWarpScale,
                  },
                  tableWoodFineWarpStrength: {
                    label: 'Fine Warp Strength',
                    max: 0.05,
                    min: 0,
                    step: 0.001,
                    value: preset.tableWoodFineWarpStrength,
                  },
                  tableWoodFineWarpScale: {
                    label: 'Fine Warp Scale',
                    max: 50,
                    min: 0.1,
                    step: 0.1,
                    value: preset.tableWoodFineWarpScale,
                  },
                },
                { collapsed: true }
              ),
              Rings: folder(
                {
                  tableWoodRingThickness: {
                    label: 'Ring Thickness',
                    max: 0.08,
                    min: 0.01,
                    step: 0.0005,
                    value: preset.tableWoodRingThickness,
                  },
                  tableWoodRingBias: {
                    label: 'Ring Bias',
                    max: 1,
                    min: -0.2,
                    step: 0.001,
                    value: preset.tableWoodRingBias,
                  },
                  tableWoodRingSizeVariance: {
                    label: 'Ring Size Variance',
                    max: 0.5,
                    min: 0,
                    step: 0.001,
                    value: preset.tableWoodRingSizeVariance,
                  },
                  tableWoodRingVarianceScale: {
                    label: 'Ring Variance Scale',
                    max: 10,
                    min: 0.1,
                    step: 0.1,
                    value: preset.tableWoodRingVarianceScale,
                  },
                  tableWoodBarkThickness: {
                    label: 'Bark Thickness',
                    max: 1.2,
                    min: 0,
                    step: 0.01,
                    value: preset.tableWoodBarkThickness,
                  },
                },
                { collapsed: true }
              ),
              'Grain Detail': folder(
                {
                  tableWoodSplotchScale: {
                    label: 'Splotch Scale',
                    max: 2.5,
                    min: 0,
                    step: 0.01,
                    value: preset.tableWoodSplotchScale,
                  },
                  tableWoodSplotchIntensity: {
                    label: 'Splotch Intensity',
                    max: 4,
                    min: 0,
                    step: 0.01,
                    value: preset.tableWoodSplotchIntensity,
                  },
                  tableWoodCellScale: {
                    label: 'Cell Scale',
                    max: 2000,
                    min: 100,
                    step: 5,
                    value: preset.tableWoodCellScale,
                  },
                  tableWoodCellSize: {
                    label: 'Cell Size',
                    max: 0.5,
                    min: 0.01,
                    step: 0.001,
                    value: preset.tableWoodCellSize,
                  },
                },
                { collapsed: true }
              ),
              Finish: folder(
                {
                  tableWoodClearcoat: {
                    label: 'Clearcoat',
                    max: 1,
                    min: 0,
                    step: 0.01,
                    value: preset.tableWoodClearcoat,
                  },
                  tableWoodClearcoatRoughness: {
                    label: 'Clearcoat Roughness',
                    max: 1,
                    min: 0,
                    step: 0.01,
                    value: preset.tableWoodClearcoatRoughness,
                  },
                },
                { collapsed: true }
              ),
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),

      Rocks: folder(
        {
          rockScale: {
            label: 'Scale',
            max: 0.7,
            min: 0.1,
            step: 0.1,
            value: preset.rockScale,
          },
          rockSpeed: {
            label: 'Speed',
            max: 80,
            min: 1,
            step: 0.5,
            value: preset.rockSpeed,
          },
          rockGravity: {
            label: 'Gravity',
            max: 30,
            min: 0,
            step: 0.5,
            value: preset.rockGravity,
          },
          rockSpin: {
            label: 'Spin',
            max: 30,
            min: 0,
            step: 0.5,
            value: preset.rockSpin,
          },
        },
        { collapsed: true }
      ),

      Fish: folder(
        {
          fishVisible: {
            label: 'Visible',
            value: preset.fishVisible,
          },
          fishCount: {
            label: 'Count',
            options: [0, 1, 2],
            value: preset.fishCount,
          },
          fishScale: {
            label: 'Scale',
            max: 0.2,
            min: 0.001,
            step: 0.001,
            value: preset.fishScale,
          },
          fishSpeed: {
            label: 'Speed',
            max: 4,
            min: 0.05,
            step: 0.05,
            value: preset.fishSpeed,
          },
          fishRadiusX: {
            label: 'Radius X',
            max: 4,
            min: 0.05,
            step: 0.01,
            value: preset.fishRadiusX,
          },
          fishRadiusZ: {
            label: 'Radius Z',
            max: 4,
            min: 0.05,
            step: 0.01,
            value: preset.fishRadiusZ,
          },
          fishBaseYOffset: {
            label: 'Base Offset',
            max: 2,
            min: -1,
            step: 0.01,
            value: preset.fishBaseYOffset,
          },
          fishStrandLevel: {
            label: 'Strand Level',
            max: 1,
            min: 0,
            step: 0.01,
            value: preset.fishStrandLevel,
          },
          fishEscapeDistance: {
            label: 'Escape Dist',
            max: 4,
            min: 0,
            step: 0.01,
            value: preset.fishEscapeDistance,
          },
          fishBobAmplitude: {
            label: 'Bob',
            max: 1,
            min: 0,
            step: 0.01,
            value: preset.fishBobAmplitude,
          },
          fishFlopAmplitude: {
            label: 'Flop',
            max: Math.PI,
            min: 0,
            step: 0.01,
            value: preset.fishFlopAmplitude,
          },
          fishMarkerSize: {
            label: 'Marker Size',
            max: 0.4,
            min: 0.005,
            step: 0.005,
            value: preset.fishMarkerSize,
          },
          fishMarkerColor: {
            label: 'Marker Color',
            value: preset.fishMarkerColor,
          },
        },
        { collapsed: true }
      ),

      Debug: folder(
        {
          showRapierDebug: {
            label: 'Rapier Debug',
            value: preset.showRapierDebug,
          },
          splashRunning: {
            label: 'Sim Running',
            value: preset.splashRunning,
          },
          splashShowParticles: {
            label: 'Show Particles',
            value: preset.splashShowParticles,
          },
          showTankBounds: {
            label: 'Tank Bounds',
            value: preset.showTankBounds,
          },
          showWaterBounds: {
            label: 'Water Bounds',
            value: preset.showWaterBounds,
          },
          showFishMarkers: {
            label: 'Fish Markers',
            value: preset.showFishMarkers,
          },
        },
        { collapsed: true }
      ),
    }),
    { collapsed: true }
  );

  attachSetControls(setControls);
  controlsSnapshotRef.current = { ...controls };

  useEffect(() => {
    const nextTableWoodPresetKey = `${controls.tableWoodGenus}:${controls.tableWoodFinish}`;

    if (tableWoodPresetKeyRef.current === nextTableWoodPresetKey) {
      return;
    }

    tableWoodPresetKeyRef.current = nextTableWoodPresetKey;
    setControls(
      getTableWoodPresetControls({
        finish: controls.tableWoodFinish,
        genus: controls.tableWoodGenus,
      })
    );
  }, [controls.tableWoodFinish, controls.tableWoodGenus, setControls]);

  const cameraConfig = useMemo(
    () => ({
      desktopFov: controls.cameraDesktopFov,
      desktopPosition: [
        controls.cameraDesktopPosition.x,
        controls.cameraDesktopPosition.y,
        controls.cameraDesktopPosition.z,
      ],
      desktopTarget: [
        controls.cameraDesktopTarget.x,
        controls.cameraDesktopTarget.y,
        controls.cameraDesktopTarget.z,
      ],
      mobileFov: controls.cameraMobileFov,
      mobilePosition: [
        controls.cameraMobilePosition.x,
        controls.cameraMobilePosition.y,
        controls.cameraMobilePosition.z,
      ],
      mobileTarget: [
        controls.cameraMobileTarget.x,
        controls.cameraMobileTarget.y,
        controls.cameraMobileTarget.z,
      ],
    }),
    [
      controls.cameraDesktopFov,
      controls.cameraDesktopPosition.x,
      controls.cameraDesktopPosition.y,
      controls.cameraDesktopPosition.z,
      controls.cameraDesktopTarget.x,
      controls.cameraDesktopTarget.y,
      controls.cameraDesktopTarget.z,
      controls.cameraMobileFov,
      controls.cameraMobilePosition.x,
      controls.cameraMobilePosition.y,
      controls.cameraMobilePosition.z,
      controls.cameraMobileTarget.x,
      controls.cameraMobileTarget.y,
      controls.cameraMobileTarget.z,
    ]
  );

  const sceneEnvironment = useMemo(
    () => ({
      ambientIntensity: controls.ambientIntensity,
      backgroundColor: controls.backgroundColor,
      directionalIntensity: controls.directionalIntensity,
      directionalPosition: [
        controls.directionalPosition.x,
        controls.directionalPosition.y,
        controls.directionalPosition.z,
      ],
      floorColor: controls.floorColor,
      fogColor: controls.fogColor,
      fogFar: controls.fogFar,
      fogNear: controls.fogNear,
      gridColor: controls.gridColor,
    }),
    [
      controls.ambientIntensity,
      controls.backgroundColor,
      controls.directionalIntensity,
      controls.directionalPosition.x,
      controls.directionalPosition.y,
      controls.directionalPosition.z,
      controls.floorColor,
      controls.fogColor,
      controls.fogFar,
      controls.fogNear,
      controls.gridColor,
    ]
  );

  const operatorCamera = useMemo(
    () => ({
      boostMultiplier: controls.operatorBoostMultiplier,
      liftSpeed: controls.operatorLiftSpeed,
      maxFov: Math.max(controls.operatorMinFov, controls.operatorMaxFov),
      minFov: Math.min(controls.operatorMinFov, controls.operatorMaxFov),
      moveSpeed: controls.operatorMoveSpeed,
      pointerLookSensitivity: controls.operatorPointerLookSensitivity,
      stickLookSpeed: controls.operatorStickLookSpeed,
      zoomSpeed: controls.operatorZoomSpeed,
    }),
    [
      controls.operatorBoostMultiplier,
      controls.operatorLiftSpeed,
      controls.operatorMaxFov,
      controls.operatorMinFov,
      controls.operatorMoveSpeed,
      controls.operatorPointerLookSensitivity,
      controls.operatorStickLookSpeed,
      controls.operatorZoomSpeed,
    ]
  );

  const tankTransform = useMemo(
    () => ({
      position: [
        controls.tankPosition.x,
        controls.tankPosition.y,
        controls.tankPosition.z,
      ],
      rotation: [
        controls.tankRotation.x,
        controls.tankRotation.y,
        controls.tankRotation.z,
      ],
      scale: controls.tankScale,
    }),
    [
      controls.tankPosition.x,
      controls.tankPosition.y,
      controls.tankPosition.z,
      controls.tankRotation.x,
      controls.tankRotation.y,
      controls.tankRotation.z,
      controls.tankScale,
    ]
  );

  const tank = useMemo(
    () => ({
      depth: controls.tankDepth,
      drainRate: controls.drainRate,
      glassColor: controls.glassColor,
      glassOpacity: controls.glassOpacity,
      glassThickness: controls.glassThickness,
      height: controls.tankHeight,
      sandColor: controls.sandColor,
      splashBreakImpulseDuration: controls.splashBreakImpulseDuration,
      splashBreakImpulseRadius: controls.splashBreakImpulseRadius,
      splashBreakImpulseStrength: controls.splashBreakImpulseStrength,
      splashColorDensity: controls.splashColorDensity,
      splashGravity: controls.splashGravity,
      splashMaxDelta: controls.splashMaxDelta,
      splashParticleBudget: controls.splashParticleBudget,
      splashRestDensity: controls.splashRestDensity,
      splashRunning: controls.splashRunning,
      splashShowParticles: controls.splashShowParticles,
      splashSimSpeed: controls.splashSimSpeed,
      splashStiffness: controls.splashStiffness,
      splashViscosity: controls.splashViscosity,
      splashWallStiffness: controls.splashWallStiffness,
      spillExtent: controls.spillExtent,
      spillOpacity: controls.spillOpacity,
      spillThickness: controls.spillThickness,
      tankScale: controls.tankScale,
      visible: controls.tankVisible,
      waterColor: controls.waterColor,
      waterDisturbance: controls.waterDisturbance,
      waterInset: controls.waterInset,
      waterLevel: controls.waterLevel,
      width: controls.tankWidth,
    }),
    [
      controls.tankDepth,
      controls.drainRate,
      controls.glassColor,
      controls.glassOpacity,
      controls.glassThickness,
      controls.tankHeight,
      controls.sandColor,
      controls.splashBreakImpulseDuration,
      controls.splashBreakImpulseRadius,
      controls.splashBreakImpulseStrength,
      controls.splashColorDensity,
      controls.splashGravity,
      controls.splashMaxDelta,
      controls.splashParticleBudget,
      controls.splashRestDensity,
      controls.splashRunning,
      controls.splashShowParticles,
      controls.splashSimSpeed,
      controls.splashStiffness,
      controls.splashViscosity,
      controls.splashWallStiffness,
      controls.spillExtent,
      controls.spillOpacity,
      controls.spillThickness,
      controls.tankScale,
      controls.tankVisible,
      controls.waterColor,
      controls.waterDisturbance,
      controls.waterInset,
      controls.waterLevel,
      controls.tankWidth,
    ]
  );

  const table = useMemo(
    () => ({
      color: controls.tableWoodLightGrainColor,
      depth: controls.tableDepth,
      legs: {
        depth: controls.tableLegDepth,
        inset: controls.tableLegInset,
        width: controls.tableLegWidth,
      },
      metalness: controls.tableMetalness,
      position: [
        controls.tablePosition.x,
        controls.tablePosition.y,
        controls.tablePosition.z,
      ],
      roughness: controls.tableRoughness,
      thickness: controls.tableThickness,
      wood: {
        barkThickness: controls.tableWoodBarkThickness,
        cellScale: controls.tableWoodCellScale,
        cellSize: controls.tableWoodCellSize,
        centerSize: controls.tableWoodCenterSize,
        clearcoat: controls.tableWoodClearcoat,
        clearcoatRoughness: controls.tableWoodClearcoatRoughness,
        darkGrainColor: controls.tableWoodDarkGrainColor,
        fineWarpScale: controls.tableWoodFineWarpScale,
        fineWarpStrength: controls.tableWoodFineWarpStrength,
        finish: controls.tableWoodFinish,
        grainOffset: [
          controls.tableWoodGrainOffset.x,
          controls.tableWoodGrainOffset.y,
          controls.tableWoodGrainOffset.z,
        ],
        grainRotation: [
          controls.tableWoodGrainRotation.x,
          controls.tableWoodGrainRotation.y,
          controls.tableWoodGrainRotation.z,
        ],
        grainScale: [
          controls.tableWoodGrainScale.x,
          controls.tableWoodGrainScale.y,
          controls.tableWoodGrainScale.z,
        ],
        genus: controls.tableWoodGenus,
        largeGrainStretch: controls.tableWoodLargeGrainStretch,
        largeWarpScale: controls.tableWoodLargeWarpScale,
        lightGrainColor: controls.tableWoodLightGrainColor,
        ringBias: controls.tableWoodRingBias,
        ringSizeVariance: controls.tableWoodRingSizeVariance,
        ringThickness: controls.tableWoodRingThickness,
        ringVarianceScale: controls.tableWoodRingVarianceScale,
        smallWarpScale: controls.tableWoodSmallWarpScale,
        smallWarpStrength: controls.tableWoodSmallWarpStrength,
        splotchIntensity: controls.tableWoodSplotchIntensity,
        splotchScale: controls.tableWoodSplotchScale,
      },
      width: controls.tableWidth,
    }),
    [
      controls.tableDepth,
      controls.tableLegDepth,
      controls.tableLegInset,
      controls.tableLegWidth,
      controls.tableMetalness,
      controls.tablePosition.x,
      controls.tablePosition.y,
      controls.tablePosition.z,
      controls.tableRoughness,
      controls.tableThickness,
      controls.tableWoodBarkThickness,
      controls.tableWoodCellScale,
      controls.tableWoodCellSize,
      controls.tableWoodCenterSize,
      controls.tableWoodClearcoat,
      controls.tableWoodClearcoatRoughness,
      controls.tableWoodDarkGrainColor,
      controls.tableWoodFineWarpScale,
      controls.tableWoodFineWarpStrength,
      controls.tableWoodFinish,
      controls.tableWoodGenus,
      controls.tableWoodGrainOffset.x,
      controls.tableWoodGrainOffset.y,
      controls.tableWoodGrainOffset.z,
      controls.tableWoodGrainRotation.x,
      controls.tableWoodGrainRotation.y,
      controls.tableWoodGrainRotation.z,
      controls.tableWoodGrainScale.x,
      controls.tableWoodGrainScale.y,
      controls.tableWoodGrainScale.z,
      controls.tableWoodLargeGrainStretch,
      controls.tableWoodLargeWarpScale,
      controls.tableWoodLightGrainColor,
      controls.tableWoodRingBias,
      controls.tableWoodRingSizeVariance,
      controls.tableWoodRingThickness,
      controls.tableWoodRingVarianceScale,
      controls.tableWoodSmallWarpScale,
      controls.tableWoodSmallWarpStrength,
      controls.tableWoodSplotchIntensity,
      controls.tableWoodSplotchScale,
      controls.tableWidth,
    ]
  );

  const fish = useMemo(
    () => ({
      escapeDistance: controls.fishEscapeDistance,
      baseYOffset: controls.fishBaseYOffset,
      bobAmplitude: controls.fishBobAmplitude,
      count: controls.fishCount,
      flopAmplitude: controls.fishFlopAmplitude,
      markerColor: controls.fishMarkerColor,
      markerSize: controls.fishMarkerSize,
      radiusX: controls.fishRadiusX,
      radiusZ: controls.fishRadiusZ,
      scale: controls.fishScale,
      speed: controls.fishSpeed,
      strandLevel: controls.fishStrandLevel,
      visible: controls.fishVisible,
    }),
    [
      controls.fishEscapeDistance,
      controls.fishBaseYOffset,
      controls.fishBobAmplitude,
      controls.fishCount,
      controls.fishFlopAmplitude,
      controls.fishMarkerColor,
      controls.fishMarkerSize,
      controls.fishRadiusX,
      controls.fishRadiusZ,
      controls.fishScale,
      controls.fishSpeed,
      controls.fishStrandLevel,
      controls.fishVisible,
    ]
  );

  const rocks = useMemo(
    () => ({
      gravity: controls.rockGravity,
      scale: controls.rockScale,
      speed: controls.rockSpeed,
      spin: controls.rockSpin,
    }),
    [
      controls.rockGravity,
      controls.rockScale,
      controls.rockSpeed,
      controls.rockSpin,
    ]
  );

  const debug = useMemo(
    () => ({
      showFishMarkers: controls.showFishMarkers,
      showRapierDebug: controls.showRapierDebug,
      showTankBounds: controls.showTankBounds,
      showWaterBounds: controls.showWaterBounds,
    }),
    [
      controls.showFishMarkers,
      controls.showRapierDebug,
      controls.showTankBounds,
      controls.showWaterBounds,
    ]
  );

  return {
    cameraConfig,
    cameraMode: controls.cameraMode,
    debug,
    fish,
    operatorCamera,
    rocks,
    sceneEnvironment,
    table,
    tank,
    tankTransform,
  };
}
