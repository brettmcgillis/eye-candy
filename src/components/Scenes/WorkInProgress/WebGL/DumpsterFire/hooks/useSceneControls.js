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

const SCENE_LABEL = 'Dumpster Fire';
const PARTICLE_SMOKE_FOLDER_PATH = `${SCENE_LABEL}.Particle Smoke`;

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
    },
  ] = useControls(
    SCENE_LABEL,
    () => ({
      Authoring: folder(
        {
          showEffects: {
            label: 'Visible',
            value: true,
          },
          editSplines: {
            label: 'Edit Mode',
            value: true,
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
                  const allEntries = [fireAndSmokeEntries, particleSmokeEntries]
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
        { collapsed: false }
      ),
      Attractor: folder(
        {
          cursorAttractorEnabled: {
            label: 'Enabled',
            value: true,
          },
          showCursorAttractor: {
            label: 'Show Helper',
            value: true,
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
        { collapsed: false }
      ),
      Physics: folder(
        {
          physicsDebug: {
            label: 'Debug',
            value: true,
          },
        },
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
        { collapsed: false }
      ),
      'Fire And Smoke': folder(
        buildFireAndSmokeControls({
          instances: fireAndSmokeInstances,
          setInstances: setFireAndSmokeInstances,
          addInstance: () =>
            hydrateFireAndSmokeInstance(
              makeNextDumpsterFireAndSmokeSeed(fireAndSmokeInstancesRef.current)
            ),
          cloneInstance: (source) =>
            hydrateFireAndSmokeInstance(cloneDumpsterFireAndSmokeSeed(source)),
          sectionLabel: 'Splines',
          instanceLabel: 'Spline',
          keyPrefix: 'df_fas',
        }),
        { collapsed: false }
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
    cursorAttractorEnabled,
    showCursorAttractor,
    cursorAttractorMode,
    cursorAttractorStrength,
    cursorAttractorRadius,
    setFireAndSmokePoints,
    setParticleSmokePoints,
  };
}
