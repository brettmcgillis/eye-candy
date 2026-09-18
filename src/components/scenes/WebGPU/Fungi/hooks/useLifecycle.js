import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  DEFAULT_PARAMS,
  seedFor,
  specimenLevels,
  timeline,
} from '@modules/fungi';

import advance, { createCycleState, resetRequest } from '../utils/cycleMachine';
import useSpecimenBuilder from './useSpecimenBuilder';

const GENERATION_KEYS = Object.keys(DEFAULT_PARAMS);
const REBUILD_DEBOUNCE_MS = 250;

// Specimens never enter React state: React's dev performance tracks format the
// props of every re-rendered component, and stringifying a specimen's typed
// arrays freezes the main thread (Flora found this the hard way).
export default function useLifecycle(config, rig, apiRef) {
  const build = useSpecimenBuilder();
  const stateRef = useRef(createCycleState());
  const specimenRef = useRef(null);
  const tokenRef = useRef(0);
  const configRef = useRef(config);
  // A roll made for the *next* generation must not swap the fungus on screen;
  // the cycle picks the new params up when it asks for the next specimen.
  const skipReloadRef = useRef(false);
  const rolledOnMountRef = useRef(false);

  configRef.current = config;

  const generationKey = JSON.stringify(
    GENERATION_KEYS.map((key) => config[key])
  );
  const params = useMemo(
    () => Object.fromEntries(GENERATION_KEYS.map((key) => [key, config[key]])),
    [generationKey]
  );

  const load = useCallback(
    (specimen) => {
      specimenRef.current = specimen;
      rig.load(specimen);
      rig.setConfig(configRef.current);
    },
    [rig]
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
        if (next) load(next);
      });
    }, REBUILD_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [load, request]);

  useEffect(() => {
    rig.setConfig(config);
  }, [config, rig]);

  // Rolling every generation makes the scene do what the CLI does: each cycle
  // is a fresh roll rather than the same fungus at a new seed. Switching it on
  // — including on mount — rolls straight away.
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
    // eslint-disable-next-line no-param-reassign
    apiRef.current = {
      restart: () => {
        stateRef.current.t = 0;
      },
      rot: () => {
        const state = stateRef.current;

        state.t = Math.max(state.t, timeline(configRef.current).rotAt);
      },
    };
  }, [apiRef]);

  useFrame((_, delta) => {
    if (!specimenRef.current) {
      return;
    }

    const swap = advance(stateRef.current, configRef.current, delta, request);

    if (swap) {
      load(swap);

      if (configRef.current.rollGenerations) {
        skipReloadRef.current = true;
        configRef.current.regenerate?.();
      }
    }

    rig.setLevels(
      specimenLevels(configRef.current, specimenRef.current, stateRef.current.t)
    );
  });
}
