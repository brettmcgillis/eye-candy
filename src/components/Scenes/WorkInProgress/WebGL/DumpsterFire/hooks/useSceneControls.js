/* eslint-disable no-plusplus */
import { button, folder, useControls } from 'leva';

import { useCallback, useRef, useState } from 'react';

import { localEnv } from '../../../../../../utils/appUtils';
import buildFireAndSmokeControls from '../../../../ToolBox/shared/hooks/buildFireAndSmokeControls';
import buildSplineGroupControls from '../../../../ToolBox/shared/hooks/useSplineGroupControls';
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
import { BACKGROUND, FOG_RANGE, GRID, GROUND } from '../utils/sceneData';

const SCENE_LABEL = 'Dumpster Fire';
const PARTICLE_SMOKE_FOLDER_PATH = `${SCENE_LABEL}.Simulation.Particle Smoke`;

const DEFAULT_FIRE_LIGHT_RIG = Object.freeze({
  enabled: true,
  color: '#ff7a1f',
  intensity: 12,
  intensityJitter: 3.75,
  secondaryJitter: 1.25,
  distance: 2,
  decay: 1.4,
  flickerSpeed: 7,
  swayX: 0.08,
  swayY: 0.05,
  swayZ: 0.08,
  leftX: 0.15,
  leftY: 0.45,
  leftZ: 0,
  rightX: 1.15,
  rightY: 0.45,
  rightZ: 0,
});

const DEFAULT_SCENE_ENVIRONMENT = Object.freeze({
  backgroundColor: BACKGROUND,
  floorColor: GROUND.color,
  gridColor: GRID.args[3],
  fogColor: BACKGROUND,
  fogNear: FOG_RANGE[0],
  fogFar: FOG_RANGE[1],
});

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

export default function useSceneControls() {
  const [fireAndSmokeInstances, setFireAndSmokeInstances] = useState(() =>
    hydrateFireAndSmokeInstances(cloneDumpsterFireAndSmokeSeeds())
  );
  const [particleSmokeSplines, setParticleSmokeSplines] = useState(() =>
    cloneDumpsterParticleSmokeSplines()
  );
  const [particleSmokeConfigs, setParticleSmokeConfigs] = useState(() =>
    cloneDumpsterParticleSmokeConfigs()
  );
  const fireAndSmokeInstancesRef = useRef(fireAndSmokeInstances);
  const particleSmokeSplinesRef = useRef(particleSmokeSplines);
  const particleSmokeConfigsRef = useRef(particleSmokeConfigs);
  fireAndSmokeInstancesRef.current = fireAndSmokeInstances;
  particleSmokeSplinesRef.current = particleSmokeSplines;
  particleSmokeConfigsRef.current = particleSmokeConfigs;

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
        }),
        { collapsed: true }
      );

      return acc;
    },
    {}
  );

  const [
    {
      showEffects,
      editSplines,
      physicsDebug,
      cursorAttractorEnabled,
      showCursorAttractor,
      cursorAttractorMode,
      cursorAttractorStrength,
      cursorAttractorRadius,
      cameraMode,
      operatorMoveSpeed,
      operatorLiftSpeed,
      operatorBoostMultiplier,
      operatorPointerLookSensitivity,
      operatorStickLookSpeed,
      operatorZoomSpeed,
      operatorMinFov,
      operatorMaxFov,
      sceneBackgroundColor,
      sceneFloorColor,
      sceneGridColor,
      sceneFogColor,
      sceneFogNear,
      sceneFogFar,
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
    },
  ] = useControls(
    SCENE_LABEL,
    () => ({
      Scene: folder(
        {
          sceneBackgroundColor: {
            label: 'Background',
            value: DEFAULT_SCENE_ENVIRONMENT.backgroundColor,
          },
          sceneFloorColor: {
            label: 'Floor',
            value: DEFAULT_SCENE_ENVIRONMENT.floorColor,
          },
          sceneGridColor: {
            label: 'Grid Lines',
            value: DEFAULT_SCENE_ENVIRONMENT.gridColor,
          },
          sceneFogColor: {
            label: 'Fog',
            value: DEFAULT_SCENE_ENVIRONMENT.fogColor,
          },
          sceneFogNear: {
            label: 'Fog Near',
            value: DEFAULT_SCENE_ENVIRONMENT.fogNear,
            min: 0,
            max: 100,
            step: 0.1,
          },
          sceneFogFar: {
            label: 'Fog Far',
            value: DEFAULT_SCENE_ENVIRONMENT.fogFar,
            min: 0,
            max: 150,
            step: 0.1,
          },
        },
        { collapsed: true }
      ),
      Camera: folder(
        {
          cameraMode: {
            label: 'Mode',
            value: 'Fixed',
            options: ['Fixed', 'Orbit', 'Operator'],
          },
          operatorMoveSpeed: {
            label: 'Move Speed',
            value: 8,
            min: 0.5,
            max: 40,
            step: 0.1,
          },
          operatorLiftSpeed: {
            label: 'Lift Speed',
            value: 6,
            min: 0.5,
            max: 30,
            step: 0.1,
          },
          operatorBoostMultiplier: {
            label: 'Boost Multiplier',
            value: 2.2,
            min: 1,
            max: 8,
            step: 0.1,
          },
          operatorPointerLookSensitivity: {
            label: 'Pointer Look',
            value: 0.0032,
            min: 0.0005,
            max: 0.02,
            step: 0.0001,
          },
          operatorStickLookSpeed: {
            label: 'Stick Look',
            value: 2.6,
            min: 0.1,
            max: 15,
            step: 0.1,
          },
          operatorZoomSpeed: {
            label: 'Zoom Speed',
            value: 32,
            min: 1,
            max: 120,
            step: 0.5,
          },
          operatorMinFov: {
            label: 'Min FOV',
            value: 24,
            min: 5,
            max: 90,
            step: 1,
          },
          operatorMaxFov: {
            label: 'Max FOV',
            value: 80,
            min: 5,
            max: 120,
            step: 1,
          },
        },
        { collapsed: true }
      ),
      Physics: folder(
        {
          physicsDebug: {
            label: 'Debug',
            value: false,
          },
        },
        { collapsed: true }
      ),
      Simulation: folder(
        {
          Authoring: folder(
            {
              showEffects: {
                label: 'Visible',
                value: true,
              },
              editSplines: {
                label: 'Edit Mode',
                value: false,
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
                value: true,
              },
              showCursorAttractor: {
                label: 'Show Helper',
                value: false,
              },
              cursorAttractorMode: {
                label: 'Mode',
                value: 'attractor',
                options: ['attractor', 'repeller'],
              },
              cursorAttractorStrength: {
                label: 'Strength',
                value: 3,
                min: 0,
                max: 50,
                step: 0.5,
              },
              cursorAttractorRadius: {
                label: 'Radius',
                value: 3,
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
                value: DEFAULT_FIRE_LIGHT_RIG.enabled,
              },
              fireLightColor: {
                label: 'Color',
                value: DEFAULT_FIRE_LIGHT_RIG.color,
              },
              fireLightIntensity: {
                label: 'Intensity',
                value: DEFAULT_FIRE_LIGHT_RIG.intensity,
                min: 0,
                max: 40,
                step: 0.1,
              },
              fireLightIntensityJitter: {
                label: 'Flicker Amount',
                value: DEFAULT_FIRE_LIGHT_RIG.intensityJitter,
                min: 0,
                max: 20,
                step: 0.05,
              },
              fireLightSecondaryJitter: {
                label: 'Flicker Detail',
                value: DEFAULT_FIRE_LIGHT_RIG.secondaryJitter,
                min: 0,
                max: 10,
                step: 0.05,
              },
              fireLightDistance: {
                label: 'Distance',
                value: DEFAULT_FIRE_LIGHT_RIG.distance,
                min: 0,
                max: 30,
                step: 0.1,
              },
              fireLightDecay: {
                label: 'Decay',
                value: DEFAULT_FIRE_LIGHT_RIG.decay,
                min: 0,
                max: 4,
                step: 0.05,
              },
              fireLightFlickerSpeed: {
                label: 'Flicker Speed',
                value: DEFAULT_FIRE_LIGHT_RIG.flickerSpeed,
                min: 0,
                max: 30,
                step: 0.1,
              },
              fireLightSwayX: {
                label: 'Sway X',
                value: DEFAULT_FIRE_LIGHT_RIG.swayX,
                min: 0,
                max: 1,
                step: 0.01,
              },
              fireLightSwayY: {
                label: 'Sway Y',
                value: DEFAULT_FIRE_LIGHT_RIG.swayY,
                min: 0,
                max: 1,
                step: 0.01,
              },
              fireLightSwayZ: {
                label: 'Sway Z',
                value: DEFAULT_FIRE_LIGHT_RIG.swayZ,
                min: 0,
                max: 1,
                step: 0.01,
              },
              fireLightLeftX: {
                label: 'Left X',
                value: DEFAULT_FIRE_LIGHT_RIG.leftX,
                min: -3,
                max: 3,
                step: 0.01,
              },
              fireLightLeftY: {
                label: 'Left Y',
                value: DEFAULT_FIRE_LIGHT_RIG.leftY,
                min: -1,
                max: 4,
                step: 0.01,
              },
              fireLightLeftZ: {
                label: 'Left Z',
                value: DEFAULT_FIRE_LIGHT_RIG.leftZ,
                min: -3,
                max: 3,
                step: 0.01,
              },
              fireLightRightX: {
                label: 'Right X',
                value: DEFAULT_FIRE_LIGHT_RIG.rightX,
                min: -3,
                max: 3,
                step: 0.01,
              },
              fireLightRightY: {
                label: 'Right Y',
                value: DEFAULT_FIRE_LIGHT_RIG.rightY,
                min: -1,
                max: 4,
                step: 0.01,
              },
              fireLightRightZ: {
                label: 'Right Z',
                value: DEFAULT_FIRE_LIGHT_RIG.rightZ,
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
    }),
    [fireAndSmokeInstances.length, particleSmokeSplines.length]
  );

  return {
    fireAndSmokeInstances,
    particleSmokeSplines,
    particleSmokeConfigs,
    showEffects,
    editSplines,
    physicsDebug,
    cameraMode,
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
    operatorCamera: {
      moveSpeed: operatorMoveSpeed,
      liftSpeed: operatorLiftSpeed,
      boostMultiplier: operatorBoostMultiplier,
      pointerLookSensitivity: operatorPointerLookSensitivity,
      stickLookSpeed: operatorStickLookSpeed,
      zoomSpeed: operatorZoomSpeed,
      minFov: Math.min(operatorMinFov, operatorMaxFov),
      maxFov: Math.max(operatorMinFov, operatorMaxFov),
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
    setFireAndSmokePoints,
    setParticleSmokePoints,
  };
}
