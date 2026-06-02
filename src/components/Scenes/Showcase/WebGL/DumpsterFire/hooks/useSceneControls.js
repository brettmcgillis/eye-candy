/* eslint-disable no-plusplus */
import { button, folder, useControls } from 'leva';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import usePresetsFolder from '../../../../../../hooks/usePresetsFolder';
import useSceneCameraControls from '../../../../../../hooks/useSceneCameraControls';
import { localEnv } from '../../../../../../utils/appUtils';
import buildFireAndSmokeControls from '../../../../ToolBox/shared/hooks/buildFireAndSmokeControls';
import buildSplineGroupControls from '../../../../ToolBox/shared/hooks/useSplineGroupControls';
import {
  DUMPSTER_LID_INITIAL_ANGLE,
  DUMPSTER_LID_MAX_ANGLE,
  DUMPSTER_LID_MIN_ANGLE,
} from '../components/ArticulatedDumpster';
import {
  DEFAULT_FIRE_LIGHT_RIG,
  DEFAULT_PRESET,
  PRESETS,
  PRESET_CONTROL_KEYS,
} from '../presets';
import {
  cloneDumpsterFireAndSmokeSeed,
  cloneDumpsterFireAndSmokeSeeds,
  makeNextDumpsterFireAndSmokeSeed,
  serializeDumpsterFireAndSmokeSeeds,
} from '../utils/fireAndSmokeAuthoring';
import {
  cloneDumpsterParticleSmokeConfigs,
  cloneDumpsterParticleSmokeSplines,
  makeNextDumpsterParticleSmokeConfig,
  makeNextDumpsterParticleSmokeSpline,
  serializeDumpsterParticleSmokeSplines,
} from '../utils/particleSmokeAuthoring';
import {
  CAMERA,
  DEFAULT_SHOT_TUNING_MODE,
  SHOT_TUNING_PRESETS,
} from '../utils/sceneData';
import useTrashBlasterStore from './useTrashBlasterStore';

const SCENE_LABEL = 'Dumpster Fire';
const CAMERA_FOLDER_PATH = `${SCENE_LABEL}.Camera`;
const PARTICLE_SMOKE_FOLDER_PATH = `${SCENE_LABEL}.Combustion.Particle Smoke`;
const SHOT_TUNING_MODE_OPTIONS = Object.keys(SHOT_TUNING_PRESETS);

let idCounter = 0;
const mkId = () => idCounter++;

function hydrateFireAndSmokeInstance(seed = {}) {
  return {
    id: mkId(),
    ...seed,
  };
}

function hydrateFireAndSmokeInstances(seeds) {
  return seeds.map((seed) => hydrateFireAndSmokeInstance(seed));
}

function unwrapSerializedEntries(serialized) {
  const trimmed = serialized.trim();

  if (trimmed === '[]') {
    return '';
  }

  return trimmed.replace(/^\[\n?/, '').replace(/\n?\]$/, '');
}

function getShotTuningPreset(mode = DEFAULT_SHOT_TUNING_MODE) {
  return (
    SHOT_TUNING_PRESETS[mode] ?? SHOT_TUNING_PRESETS[DEFAULT_SHOT_TUNING_MODE]
  );
}

function getShotTuningControls(mode = DEFAULT_SHOT_TUNING_MODE) {
  const preset = getShotTuningPreset(mode);

  return {
    shotMode: mode,
    shotSpawnOffset: preset.spawnOffset,
    shotSpeed: preset.speed,
    shotBaseVerticalBoost: preset.baseVerticalBoost,
    shotPointerVerticalBoost: preset.pointerVerticalBoost,
    shotSpinX: preset.spinX,
    shotSpinY: preset.spinY,
    shotSpinZ: preset.spinZ,
  };
}

function cloneSnapshot(snapshot) {
  return JSON.parse(JSON.stringify(snapshot));
}

function toObjectLiteral(snapshot) {
  return JSON.stringify(snapshot, null, 2).replace(
    /"([A-Za-z_$][A-Za-z0-9_$]*)":/g,
    '$1:'
  );
}

function formatPresetKey(presetName = DEFAULT_PRESET) {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(presetName)) {
    return presetName;
  }

  return `'${presetName.replace(/'/g, "\\'")}'`;
}

function pickPresetControlValues(snapshot = {}) {
  return PRESET_CONTROL_KEYS.reduce((acc, key) => {
    if (snapshot[key] !== undefined) {
      acc[key] = snapshot[key];
    }

    return acc;
  }, {});
}

function buildParticleSmokeColorOverrides(particleSmokeConfigs = []) {
  const baselineConfigs = cloneDumpsterParticleSmokeConfigs();
  const particleSmokeColorOverrides = baselineConfigs.map(
    (baselineConfig, index) => {
      const overrideValue = particleSmokeConfigs[index]?.particleColor;

      if (overrideValue === baselineConfig.particleColor) {
        return null;
      }

      return overrideValue ?? null;
    }
  );
  const particleSmokeVolumeColorOverrides = baselineConfigs.map(
    (baselineConfig, index) => {
      const overrideValue = particleSmokeConfigs[index]?.volColor;

      if (overrideValue === baselineConfig.volColor) {
        return null;
      }

      return overrideValue ?? null;
    }
  );

  return {
    ...(particleSmokeColorOverrides.some(Boolean)
      ? { particleSmokeColorOverrides }
      : {}),
    ...(particleSmokeVolumeColorOverrides.some(Boolean)
      ? { particleSmokeVolumeColorOverrides }
      : {}),
  };
}

function buildPresetCopySnapshot({ controlsSnapshot, particleSmokeConfigs }) {
  const presetSnapshot = pickPresetControlValues(controlsSnapshot ?? {});

  return {
    ...presetSnapshot,
    ...buildParticleSmokeColorOverrides(particleSmokeConfigs),
  };
}

function getPresetControls({ currentControls, presetSnapshot }) {
  return {
    ...currentControls,
    ...pickPresetControlValues(presetSnapshot),
  };
}

function getInitialShotTuningControls(presetSnapshot = {}) {
  const shotControls = getShotTuningControls(
    presetSnapshot.shotMode ?? DEFAULT_SHOT_TUNING_MODE
  );

  return {
    shotMode: presetSnapshot.shotMode ?? shotControls.shotMode,
    shotSpawnOffset:
      presetSnapshot.shotSpawnOffset ?? shotControls.shotSpawnOffset,
    shotSpeed: presetSnapshot.shotSpeed ?? shotControls.shotSpeed,
    shotBaseVerticalBoost:
      presetSnapshot.shotBaseVerticalBoost ??
      shotControls.shotBaseVerticalBoost,
    shotPointerVerticalBoost:
      presetSnapshot.shotPointerVerticalBoost ??
      shotControls.shotPointerVerticalBoost,
    shotSpinX: presetSnapshot.shotSpinX ?? shotControls.shotSpinX,
    shotSpinY: presetSnapshot.shotSpinY ?? shotControls.shotSpinY,
    shotSpinZ: presetSnapshot.shotSpinZ ?? shotControls.shotSpinZ,
  };
}

function getPresetDumpsterLidControls(presetSnapshot = {}) {
  return {
    dumpsterLeftLidRotation:
      presetSnapshot.dumpsterLeftLidRotation ?? DUMPSTER_LID_INITIAL_ANGLE,
    dumpsterRightLidRotation:
      presetSnapshot.dumpsterRightLidRotation ?? DUMPSTER_LID_INITIAL_ANGLE,
  };
}

function getFireAndSmokeInstancesFromPreset() {
  return hydrateFireAndSmokeInstances(cloneDumpsterFireAndSmokeSeeds());
}

function getParticleSmokeStateFromPreset(presetSnapshot = {}) {
  const particleSmokeColorOverrides =
    presetSnapshot.particleSmokeColorOverrides ?? [];
  const particleSmokeVolumeColorOverrides =
    presetSnapshot.particleSmokeVolumeColorOverrides ?? [];

  return {
    splines: cloneDumpsterParticleSmokeSplines(),
    configs: cloneDumpsterParticleSmokeConfigs().map((config, index) => ({
      ...config,
      ...(typeof particleSmokeColorOverrides[index] === 'string'
        ? { particleColor: particleSmokeColorOverrides[index] }
        : {}),
      ...(typeof particleSmokeVolumeColorOverrides[index] === 'string'
        ? { volColor: particleSmokeVolumeColorOverrides[index] }
        : {}),
    })),
  };
}

export default function useSceneControls() {
  const [presetRevision, setPresetRevision] = useState(0);
  const fireAndSmokeInstancesRef = useRef([]);
  const particleSmokeSplinesRef = useRef([]);
  const particleSmokeConfigsRef = useRef([]);
  const copyTransform = useCallback((controlsSnapshot) => {
    const presetName = controlsSnapshot?.preset ?? DEFAULT_PRESET;
    const presetSnapshot = buildPresetCopySnapshot({
      controlsSnapshot,
      particleSmokeConfigs: particleSmokeConfigsRef.current,
    });

    return `${formatPresetKey(presetName)}: ${toObjectLiteral(presetSnapshot)},`;
  }, []);
  const {
    applyPresetByName,
    attachSetControls,
    controlsSnapshotRef,
    initialPreset,
    presetsFolder,
    selectedPreset,
  } = usePresetsFolder({
    copyTransform,
    defaultPreset: DEFAULT_PRESET,
    getPresetControls,
    presets: PRESETS,
  });
  const initialPresetSnapshot =
    PRESETS[initialPreset] || PRESETS[DEFAULT_PRESET];
  const initialShotTuningControls = getInitialShotTuningControls(
    initialPresetSnapshot
  );
  const [fireAndSmokeInstances, setFireAndSmokeInstances] = useState(() =>
    getFireAndSmokeInstancesFromPreset()
  );
  const [particleSmokeSplines, setParticleSmokeSplines] = useState(
    () => getParticleSmokeStateFromPreset(initialPresetSnapshot).splines
  );
  const [particleSmokeConfigs, setParticleSmokeConfigs] = useState(
    () => getParticleSmokeStateFromPreset(initialPresetSnapshot).configs
  );
  const cleanupNonce = useTrashBlasterStore((s) => s.cleanupNonce);
  const cameraApiRef = useRef(null);
  const setControlsRef = useRef(null);
  const shotModeRef = useRef(DEFAULT_SHOT_TUNING_MODE);
  const applyingShotModeRef = useRef(false);
  fireAndSmokeInstancesRef.current = fireAndSmokeInstances;
  particleSmokeSplinesRef.current = particleSmokeSplines;
  particleSmokeConfigsRef.current = particleSmokeConfigs;

  const applyShotMode = useCallback((mode) => {
    const setControls = setControlsRef.current;

    shotModeRef.current = mode;

    if (!setControls) {
      return;
    }

    applyingShotModeRef.current = true;
    setControls(getShotTuningControls(mode));
    applyingShotModeRef.current = false;
  }, []);

  const setFireAndSmokePoints = useCallback((id, updater) => {
    setFireAndSmokeInstances((prev) =>
      prev.map((instance) => {
        if (instance.id !== id) {
          return instance;
        }

        return {
          ...instance,
          controlPoints:
            typeof updater === 'function'
              ? updater(instance.controlPoints)
              : updater,
        };
      })
    );
  }, []);

  const setParticleSmokePoints = useCallback((index, updater) => {
    setParticleSmokeSplines((prev) =>
      prev.map((spline, splineIndex) => {
        if (splineIndex !== index) {
          return spline;
        }

        return {
          ...spline,
          points:
            typeof updater === 'function' ? updater(spline.points) : updater,
        };
      })
    );
  }, []);

  const particleSmokeSections = particleSmokeSplines.reduce(
    (acc, spline, index) => {
      const folderLabel = `Particle Smoke ${index + 1}`;
      const config = particleSmokeConfigs[index] ?? {};

      acc[folderLabel] = folder(
        buildSplineGroupControls(index, config, {
          sceneLabel: PARTICLE_SMOKE_FOLDER_PATH,
          folderLabel,
          splineInstance: spline,
          setSplineConfigs: setParticleSmokeConfigs,
          setSplines: setParticleSmokeSplines,
          allowedTypes: 'smoke',
          supportsAttractors: true,
        }),
        { collapsed: true }
      );

      return acc;
    },
    {}
  );
  const cameraControlOverrides = useMemo(() => {
    return {
      cameraAutoFit: {
        render: (get) => get(`${CAMERA_FOLDER_PATH}.cameraMode`) === 'orbit',
      },
    };
  }, []);
  const { buildCamera, cameraControls } = useSceneCameraControls({
    apiRef: cameraApiRef,
    camera: CAMERA,
    cameraFolderPath: CAMERA_FOLDER_PATH,
    controlsSnapshotRef,
    controlOverrides: cameraControlOverrides,
  });

  const [controls, setControls] = useControls(
    SCENE_LABEL,
    () => ({
      Presets: presetsFolder,

      Scene: folder(
        {
          sceneBackgroundColor: {
            label: 'Background',
            value: initialPresetSnapshot.sceneBackgroundColor,
          },
          sceneFloorColor: {
            label: 'Floor',
            value: initialPresetSnapshot.sceneFloorColor,
          },
          sceneGridColor: {
            label: 'Grid Lines',
            value: initialPresetSnapshot.sceneGridColor,
          },
          sceneFogColor: {
            label: 'Fog',
            value: initialPresetSnapshot.sceneFogColor,
          },
          sceneFogNear: {
            label: 'Fog Near',
            value: initialPresetSnapshot.sceneFogNear,
            min: 0,
            max: 100,
            step: 0.1,
          },
          sceneFogFar: {
            label: 'Fog Far',
            value: initialPresetSnapshot.sceneFogFar,
            min: 0,
            max: 150,
            step: 0.1,
          },
        },
        { collapsed: true }
      ),
      Camera: folder(cameraControls, { collapsed: true }),
      Physics: folder(
        {
          physicsDebug: {
            label: 'Debug',
            value: initialPresetSnapshot.physicsDebug,
          },
        },
        { collapsed: true }
      ),
      'Trash Blaster': folder(
        {
          shotMode: {
            label: 'Mode',
            value: initialShotTuningControls.shotMode,
            options: SHOT_TUNING_MODE_OPTIONS,
            onChange: (nextMode) => {
              if (!nextMode || applyingShotModeRef.current) {
                return;
              }

              applyShotMode(nextMode);
            },
          },
          resetShotMode: button(() => {
            applyShotMode(shotModeRef.current);
          }),
          shotSpeed: {
            label: 'Speed',
            value: initialShotTuningControls.shotSpeed,
            min: 1,
            max: 80,
            step: 0.5,
          },
          shotBaseVerticalBoost: {
            label: 'Base Lift',
            value: initialShotTuningControls.shotBaseVerticalBoost,
            min: -10,
            max: 20,
            step: 0.1,
          },
          shotPointerVerticalBoost: {
            label: 'Pointer Lift',
            value: initialShotTuningControls.shotPointerVerticalBoost,
            min: -10,
            max: 20,
            step: 0.1,
          },
          shotSpawnOffset: {
            label: 'Spawn Offset',
            value: initialShotTuningControls.shotSpawnOffset,
            min: 0.1,
            max: 6,
            step: 0.05,
          },
          shotSpinX: {
            label: 'Spin X',
            value: initialShotTuningControls.shotSpinX,
            min: 0,
            max: 30,
            step: 0.1,
          },
          shotSpinY: {
            label: 'Spin Y',
            value: initialShotTuningControls.shotSpinY,
            min: 0,
            max: 30,
            step: 0.1,
          },
          shotSpinZ: {
            label: 'Spin Z',
            value: initialShotTuningControls.shotSpinZ,
            min: 0,
            max: 30,
            step: 0.1,
          },
        },
        { collapsed: true }
      ),
      Dumpster: folder(
        {
          dumpsterLeftLidRotation: {
            label: 'Left Lid',
            value:
              initialPresetSnapshot.dumpsterLeftLidRotation ??
              DUMPSTER_LID_INITIAL_ANGLE,
            min: DUMPSTER_LID_MIN_ANGLE,
            max: DUMPSTER_LID_MAX_ANGLE,
            step: 0.01,
          },
          dumpsterRightLidRotation: {
            label: 'Right Lid',
            value:
              initialPresetSnapshot.dumpsterRightLidRotation ??
              DUMPSTER_LID_INITIAL_ANGLE,
            min: DUMPSTER_LID_MIN_ANGLE,
            max: DUMPSTER_LID_MAX_ANGLE,
            step: 0.01,
          },
        },
        { collapsed: true }
      ),
      Combustion: folder(
        {
          Authoring: folder(
            {
              showEffects: {
                label: 'Visible',
                value: initialPresetSnapshot.showEffects,
              },
              editSplines: {
                label: 'Edit Mode',
                value: initialPresetSnapshot.editSplines,
              },
              ...(localEnv()
                ? {
                    copySeeds: button(() => {
                      const fireAndSmokeEntries = unwrapSerializedEntries(
                        serializeDumpsterFireAndSmokeSeeds(
                          fireAndSmokeInstancesRef.current
                        )
                      );
                      const particleSmokeEntries = unwrapSerializedEntries(
                        serializeDumpsterParticleSmokeSplines(
                          particleSmokeSplinesRef.current,
                          particleSmokeConfigsRef.current
                        )
                      );
                      const allEntries = [
                        fireAndSmokeEntries,
                        particleSmokeEntries,
                      ]
                        .filter(Boolean)
                        .join(',\n');

                      navigator.clipboard.writeText(
                        allEntries
                          ? `[
${allEntries}
]`
                          : '[]'
                      );
                    }),
                  }
                : {}),
            },
            { collapsed: true }
          ),
          Attractor: folder(
            {
              cursorAttractorEnabled: {
                label: 'Enabled',
                value: initialPresetSnapshot.cursorAttractorEnabled,
              },
              showCursorAttractor: {
                label: 'Show Helper',
                value: initialPresetSnapshot.showCursorAttractor,
              },
              cursorAttractorMode: {
                label: 'Mode',
                value: initialPresetSnapshot.cursorAttractorMode,
                options: ['attractor', 'repeller'],
              },
              cursorAttractorStrength: {
                label: 'Strength',
                value: initialPresetSnapshot.cursorAttractorStrength,
                min: 0,
                max: 50,
                step: 0.5,
              },
              cursorAttractorRadius: {
                label: 'Radius',
                value: initialPresetSnapshot.cursorAttractorRadius,
                min: 0.1,
                max: 20,
                step: 0.1,
              },
            },
            { collapsed: true }
          ),
          'Fire And Smoke': folder(
            buildFireAndSmokeControls({
              instances: fireAndSmokeInstances,
              setInstances: setFireAndSmokeInstances,
              addInstance: () =>
                hydrateFireAndSmokeInstance(
                  makeNextDumpsterFireAndSmokeSeed(
                    fireAndSmokeInstancesRef.current
                  )
                ),
              cloneInstance: (source) =>
                hydrateFireAndSmokeInstance(
                  cloneDumpsterFireAndSmokeSeed(source)
                ),
              sectionLabel: 'Splines',
              instanceLabel: 'Spline',
              keyPrefix: 'df_fas',
              supportsAttractors: true,
            }),
            { collapsed: true }
          ),
          'Particle Smoke': folder(
            {
              'Add Particle Smoke': button(() => {
                setParticleSmokeSplines((prev) => [
                  ...prev,
                  makeNextDumpsterParticleSmokeSpline(prev),
                ]);
                setParticleSmokeConfigs((prev) => [
                  ...prev,
                  makeNextDumpsterParticleSmokeConfig(prev),
                ]);
              }),
              'Remove All Particle Smoke': button(() => {
                setParticleSmokeSplines([]);
                setParticleSmokeConfigs([]);
              }),
              ...particleSmokeSections,
            },
            { collapsed: true }
          ),
          Lights: folder(
            {
              fireLightEnabled: {
                label: 'Enabled',
                value:
                  initialPresetSnapshot.fireLightEnabled ??
                  DEFAULT_FIRE_LIGHT_RIG.enabled,
              },
              fireLightColor: {
                label: 'Color',
                value:
                  initialPresetSnapshot.fireLightColor ??
                  DEFAULT_FIRE_LIGHT_RIG.color,
              },
              fireLightIntensity: {
                label: 'Intensity',
                value:
                  initialPresetSnapshot.fireLightIntensity ??
                  DEFAULT_FIRE_LIGHT_RIG.intensity,
                min: 0,
                max: 40,
                step: 0.1,
              },
              fireLightIntensityJitter: {
                label: 'Flicker Amount',
                value:
                  initialPresetSnapshot.fireLightIntensityJitter ??
                  DEFAULT_FIRE_LIGHT_RIG.intensityJitter,
                min: 0,
                max: 20,
                step: 0.05,
              },
              fireLightSecondaryJitter: {
                label: 'Flicker Detail',
                value:
                  initialPresetSnapshot.fireLightSecondaryJitter ??
                  DEFAULT_FIRE_LIGHT_RIG.secondaryJitter,
                min: 0,
                max: 10,
                step: 0.05,
              },
              fireLightDistance: {
                label: 'Distance',
                value:
                  initialPresetSnapshot.fireLightDistance ??
                  DEFAULT_FIRE_LIGHT_RIG.distance,
                min: 0,
                max: 30,
                step: 0.1,
              },
              fireLightDecay: {
                label: 'Decay',
                value:
                  initialPresetSnapshot.fireLightDecay ??
                  DEFAULT_FIRE_LIGHT_RIG.decay,
                min: 0,
                max: 4,
                step: 0.05,
              },
              fireLightFlickerSpeed: {
                label: 'Flicker Speed',
                value:
                  initialPresetSnapshot.fireLightFlickerSpeed ??
                  DEFAULT_FIRE_LIGHT_RIG.flickerSpeed,
                min: 0,
                max: 30,
                step: 0.1,
              },
              fireLightSwayX: {
                label: 'Sway X',
                value:
                  initialPresetSnapshot.fireLightSwayX ??
                  DEFAULT_FIRE_LIGHT_RIG.swayX,
                min: 0,
                max: 1,
                step: 0.01,
              },
              fireLightSwayY: {
                label: 'Sway Y',
                value:
                  initialPresetSnapshot.fireLightSwayY ??
                  DEFAULT_FIRE_LIGHT_RIG.swayY,
                min: 0,
                max: 1,
                step: 0.01,
              },
              fireLightSwayZ: {
                label: 'Sway Z',
                value:
                  initialPresetSnapshot.fireLightSwayZ ??
                  DEFAULT_FIRE_LIGHT_RIG.swayZ,
                min: 0,
                max: 1,
                step: 0.01,
              },
              fireLightLeftX: {
                label: 'Left X',
                value:
                  initialPresetSnapshot.fireLightLeftX ??
                  DEFAULT_FIRE_LIGHT_RIG.leftX,
                min: -3,
                max: 3,
                step: 0.01,
              },
              fireLightLeftY: {
                label: 'Left Y',
                value:
                  initialPresetSnapshot.fireLightLeftY ??
                  DEFAULT_FIRE_LIGHT_RIG.leftY,
                min: -1,
                max: 4,
                step: 0.01,
              },
              fireLightLeftZ: {
                label: 'Left Z',
                value:
                  initialPresetSnapshot.fireLightLeftZ ??
                  DEFAULT_FIRE_LIGHT_RIG.leftZ,
                min: -3,
                max: 3,
                step: 0.01,
              },
              fireLightRightX: {
                label: 'Right X',
                value:
                  initialPresetSnapshot.fireLightRightX ??
                  DEFAULT_FIRE_LIGHT_RIG.rightX,
                min: -3,
                max: 3,
                step: 0.01,
              },
              fireLightRightY: {
                label: 'Right Y',
                value:
                  initialPresetSnapshot.fireLightRightY ??
                  DEFAULT_FIRE_LIGHT_RIG.rightY,
                min: -1,
                max: 4,
                step: 0.01,
              },
              fireLightRightZ: {
                label: 'Right Z',
                value:
                  initialPresetSnapshot.fireLightRightZ ??
                  DEFAULT_FIRE_LIGHT_RIG.rightZ,
                min: -3,
                max: 3,
                step: 0.01,
              },
            },
            { collapsed: true }
          ),
        },
        { collapsed: true }
      ),
      'Brick Wall': folder(
        {
          brickWallEnabled: {
            label: 'Enabled',
            value: initialPresetSnapshot.brickWallEnabled,
          },
          brickWallLength: {
            label: 'Length',
            value: initialPresetSnapshot.brickWallLength,
            min: 4,
            max: 25,
            step: 0.25,
          },
          brickWallHeight: {
            label: 'Height',
            value: initialPresetSnapshot.brickWallHeight,
            min: 0.8,
            max: 4.5,
            step: 0.1,
          },
          brickWallTintColor: {
            label: 'Tint',
            value: initialPresetSnapshot.brickWallTintColor,
          },
          brickWallPosition: {
            label: 'Position',
            step: 0.05,
            value: initialPresetSnapshot.brickWallPosition,
          },
        },
        { collapsed: true }
      ),
    }),
    [
      cameraControls,
      fireAndSmokeInstances.length,
      particleSmokeSplines.length,
      presetRevision,
      presetsFolder,
    ]
  );

  const {
    showEffects,
    editSplines,
    physicsDebug,
    cursorAttractorEnabled,
    showCursorAttractor,
    cursorAttractorMode,
    cursorAttractorStrength,
    cursorAttractorRadius,
    dumpsterLeftLidRotation,
    dumpsterRightLidRotation,
    sceneBackgroundColor,
    sceneFloorColor,
    sceneGridColor,
    sceneFogColor,
    sceneFogNear,
    sceneFogFar,
    brickWallEnabled,
    brickWallLength,
    brickWallHeight,
    brickWallTintColor,
    brickWallPosition,
    fireLightEnabled,
    fireLightColor,
    fireLightIntensity,
    fireLightIntensityJitter,
    fireLightSecondaryJitter,
    fireLightDistance,
    fireLightDecay,
    fireLightFlickerSpeed,
    fireLightSwayX,
    fireLightSwayY,
    fireLightSwayZ,
    fireLightLeftX,
    fireLightLeftY,
    fireLightLeftZ,
    fireLightRightX,
    fireLightRightY,
    fireLightRightZ,
    shotMode,
    shotSpawnOffset,
    shotSpeed,
    shotBaseVerticalBoost,
    shotPointerVerticalBoost,
    shotSpinX,
    shotSpinY,
    shotSpinZ,
  } = controls;

  useEffect(() => {
    attachSetControls(setControls);
    setControlsRef.current = setControls;
  }, [attachSetControls, setControls]);

  useEffect(() => {
    controlsSnapshotRef.current = cloneSnapshot(controls);
  }, [controls, controlsSnapshotRef]);

  useEffect(() => {
    const presetSnapshot = PRESETS[selectedPreset] || PRESETS[DEFAULT_PRESET];
    const particleSmokeState = getParticleSmokeStateFromPreset(presetSnapshot);

    applyPresetByName(selectedPreset, {
      currentControls: controlsSnapshotRef.current,
    });
    setFireAndSmokeInstances(getFireAndSmokeInstancesFromPreset());
    setParticleSmokeSplines(particleSmokeState.splines);
    setParticleSmokeConfigs(particleSmokeState.configs);
    setPresetRevision((previousValue) => previousValue + 1);
  }, [applyPresetByName, controlsSnapshotRef, selectedPreset]);

  useEffect(() => {
    shotModeRef.current = shotMode;
  }, [shotMode]);

  useEffect(() => {
    if (cleanupNonce === 0) {
      return;
    }

    const presetSnapshot = PRESETS[selectedPreset] || PRESETS[DEFAULT_PRESET];

    setControls(getPresetDumpsterLidControls(presetSnapshot));
  }, [cleanupNonce, selectedPreset, setControls]);

  const camera = useMemo(() => {
    return buildCamera(controls);
  }, [buildCamera, controls]);

  return {
    fireAndSmokeInstances,
    particleSmokeSplines,
    particleSmokeConfigs,
    showEffects,
    editSplines,
    physicsDebug,
    camera,
    cameraApiRef,
    cursorAttractorEnabled,
    showCursorAttractor,
    cursorAttractorMode,
    cursorAttractorStrength,
    cursorAttractorRadius,
    sceneEnvironment: {
      backgroundColor: sceneBackgroundColor,
      floorColor: sceneFloorColor,
      gridColor: sceneGridColor,
      fogColor: sceneFogColor,
      fogNear: sceneFogNear,
      fogFar: sceneFogFar,
    },
    brickWallConfig: {
      enabled: brickWallEnabled,
      length: brickWallLength,
      height: brickWallHeight,
      tintColor: brickWallTintColor,
      position: [
        brickWallPosition?.x ?? 0,
        brickWallPosition?.y ?? 0,
        brickWallPosition?.z ?? 0,
      ],
    },
    dumpsterConfig: {
      leftLidRotation: dumpsterLeftLidRotation,
      rightLidRotation: dumpsterRightLidRotation,
    },
    fireLightRig: {
      enabled: fireLightEnabled,
      color: fireLightColor,
      intensity: fireLightIntensity,
      intensityJitter: fireLightIntensityJitter,
      secondaryJitter: fireLightSecondaryJitter,
      distance: fireLightDistance,
      decay: fireLightDecay,
      flickerSpeed: fireLightFlickerSpeed,
      swayX: fireLightSwayX,
      swayY: fireLightSwayY,
      swayZ: fireLightSwayZ,
      leftX: fireLightLeftX,
      leftY: fireLightLeftY,
      leftZ: fireLightLeftZ,
      rightX: fireLightRightX,
      rightY: fireLightRightY,
      rightZ: fireLightRightZ,
    },
    trashShotConfig: {
      mode: shotMode,
      spawnOffset: shotSpawnOffset,
      speed: shotSpeed,
      baseVerticalBoost: shotBaseVerticalBoost,
      pointerVerticalBoost: shotPointerVerticalBoost,
      spinX: shotSpinX,
      spinY: shotSpinY,
      spinZ: shotSpinZ,
    },
    setFireAndSmokePoints,
    setParticleSmokePoints,
  };
}
