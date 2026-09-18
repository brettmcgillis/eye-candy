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
  // A roll made for the *next* generation must not swap the plant on screen;
  // the cycle picks the new params up when it asks for the next specimen.
  const skipReloadRef = useRef(false);
  const rolledOnMountRef = useRef(false);

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
    if (skipReloadRef.current) {
      skipReloadRef.current = false;

      return undefined;
    }

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

  // Rolling every generation makes the scene do what the CLI does: each cycle
  // is a fresh roll rather than the same plant at a new seed. Switching it on
  // — including on mount, so a reload is not the same flower every time —
  // rolls straight away rather than waiting out the current cycle.
  useEffect(() => {
    if (!config.rollGenerations) {
      rolledOnMountRef.current = false;

      return;
    }
    if (rolledOnMountRef.current) {
      return;
    }
    rolledOnMountRef.current = true;
    configRef.current.regenerate?.();
  }, [config.rollGenerations]);

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

      if (configRef.current.rollGenerations) {
        skipReloadRef.current = true;
        configRef.current.regenerate?.();
      }
    }

    uniforms.growth.value = levels.growth;
    uniforms.bloom.value = levels.bloom;
    uniforms.exit.value = levels.exit;
  });
}
