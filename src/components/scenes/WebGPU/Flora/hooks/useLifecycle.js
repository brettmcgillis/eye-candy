/* eslint-disable no-param-reassign */
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import { DEFAULT_PARAMS, seedFor, timeline } from '@modules/flora';

import advance, { createCycleState, resetRequest } from '../utils/cycleMachine';
import useSpecimenBuilder from './useSpecimenBuilder';

const GENERATION_KEYS = Object.keys(DEFAULT_PARAMS);
const REBUILD_DEBOUNCE_MS = 250;

// Specimens never enter React state: React's dev performance tracks format the
// props of every re-rendered component, and stringifying the specimen's typed
// arrays froze the main thread for seconds on each swap.
export default function useLifecycle(config, uniforms, apiRef, onSpecimen) {
  const build = useSpecimenBuilder();
  const stateRef = useRef(createCycleState());
  const loadedRef = useRef(false);
  const tokenRef = useRef(0);
  const configRef = useRef(config);
  const onSpecimenRef = useRef(onSpecimen);

  configRef.current = config;
  onSpecimenRef.current = onSpecimen;

  const generationKey = JSON.stringify(
    GENERATION_KEYS.map((key) => config[key])
  );
  const params = useMemo(
    () => Object.fromEntries(GENERATION_KEYS.map((key) => [key, config[key]])),
    [generationKey]
  );

  const request = useCallback(
    (cycle) => {
      const token = tokenRef.current;

      return build({ ...params, seed: seedFor(params.seed, cycle) }).then(
        (next) => (tokenRef.current === token ? next : null)
      );
    },
    [build, params]
  );

  useEffect(() => {
    tokenRef.current += 1;
    resetRequest(stateRef.current);

    const timer = setTimeout(() => {
      request(stateRef.current.cycle).then((next) => {
        if (next) {
          onSpecimenRef.current(next);
          loadedRef.current = true;
        }
      });
    }, REBUILD_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [request]);

  useEffect(() => {
    apiRef.current = {
      regrow: () => {
        const state = stateRef.current;

        state.t = Math.max(state.t, timeline(configRef.current).exitAt);
      },
      restart: () => {
        stateRef.current.t = 0;
      },
    };
  }, [apiRef]);

  useFrame((_, delta) => {
    if (!loadedRef.current) {
      return;
    }

    const levels = advance(stateRef.current, configRef.current, delta, request);

    if (levels.swap) {
      onSpecimenRef.current(levels.swap);
    }

    uniforms.growth.value = levels.growth;
    uniforms.bloom.value = levels.bloom;
    uniforms.exit.value = levels.exit;
  });
}
