/* eslint-disable no-plusplus */
import { button, folder, useControls } from 'leva';

import { useCallback, useRef, useState } from 'react';

import { localEnv } from '../../../../../../utils/appUtils';
import buildFireAndSmokeControls from '../../../../ToolBox/shared/hooks/buildFireAndSmokeControls';
import {
  cloneDumpsterFireAndSmokeSeed,
  cloneDumpsterFireAndSmokeSeeds,
  makeNextDumpsterFireAndSmokeSeed,
  serializeDumpsterFireAndSmokeSeeds,
} from '../utils/fireAndSmokeAuthoring';

const SCENE_LABEL = 'Dumpster Fire';

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

export default function useSceneControls() {
  const [fireAndSmokeInstances, setFireAndSmokeInstances] = useState(() =>
    hydrateFireAndSmokeInstances(cloneDumpsterFireAndSmokeSeeds())
  );
  const fireAndSmokeInstancesRef = useRef(fireAndSmokeInstances);
  fireAndSmokeInstancesRef.current = fireAndSmokeInstances;

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

  const [{ showEffects, editSplines }] = useControls(
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
                  navigator.clipboard.writeText(
                    serializeDumpsterFireAndSmokeSeeds(
                      fireAndSmokeInstancesRef.current
                    )
                  );
                }),
              }
            : {}),
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
    [fireAndSmokeInstances.length]
  );

  return {
    fireAndSmokeInstances,
    showEffects,
    editSplines,
    setFireAndSmokePoints,
  };
}
