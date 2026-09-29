/* eslint-disable no-param-reassign */
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  DEFAULT_PARAMS,
  bouquetMembers,
  rollableKeys,
  seedFor,
  timeline,
} from '@modules/flora';
import { PALETTE_NAMES } from '@utils/gradientPalette';

import advance, { createCycleState, resetRequest } from '../utils/cycleMachine';
import useSpecimenBuilder from './useSpecimenBuilder';

const GENERATION_KEYS = Object.keys(DEFAULT_PARAMS);
const BUILD_KEYS = [...GENERATION_KEYS, 'bouquetSize', 'bouquetFill'];
const LOOK_KEYS = [...rollableKeys(), 'seed'];

const pick = (source, keys) =>
  Object.fromEntries(keys.map((key) => [key, source[key]]));

// The stems of cycle `cycle`, as the CLI would draw them with this plant as
// its one source. `overrides` is what a stem holds over the live controls: a
// repeated stem only its seed, a rolled one its whole rolled look.
function membersFor(params, cycle) {
  const seed = seedFor(params.seed, cycle);

  if (params.bouquetSize === 0) {
    return { members: [{ config: { ...params, seed }, rolled: false }], seed };
  }

  return {
    bouquet: true,
    members: bouquetMembers({
      fill: params.bouquetFill,
      index: cycle,
      roll: { base: params, paletteNames: PALETTE_NAMES },
      seed,
      size: params.bouquetSize,
      sources: [params],
    }),
    seed,
  };
}
const REBUILD_DEBOUNCE_MS = 250;

function startTime(config) {
  return config.startGrown ? timeline(config).matured : 0;
}

// Specimens never enter React state: React's dev performance tracks format the
// props of every re-rendered component, and stringifying the specimen's typed
// arrays froze the main thread for seconds on each swap.
export default function useLifecycle(config, apiRef, { onBouquet, onLevels }) {
  const build = useSpecimenBuilder();
  const stateRef = useRef(createCycleState());
  const loadedRef = useRef(false);
  const tokenRef = useRef(0);
  const configRef = useRef(config);
  const onBouquetRef = useRef(onBouquet);
  const onLevelsRef = useRef(onLevels);
  // A roll made for the *next* generation must not swap the plant on screen;
  // the cycle picks the new params up when it asks for the next specimen.
  const skipReloadRef = useRef(false);
  const rolledOnMountRef = useRef(false);

  configRef.current = config;
  onBouquetRef.current = onBouquet;
  onLevelsRef.current = onLevels;

  const buildKey = JSON.stringify(BUILD_KEYS.map((key) => config[key]));
  const params = useMemo(() => pick(config, BUILD_KEYS), [buildKey]);

  const request = useCallback(
    (cycle) => {
      const token = tokenRef.current;
      const { bouquet, members, seed } = membersFor(params, cycle);

      return build(
        members.map((member) => pick(member.config, GENERATION_KEYS))
      ).then((specimens) =>
        tokenRef.current === token && specimens
          ? {
              bouquet,
              members: members.map((member, index) => ({
                overrides: member.rolled
                  ? pick(member.config, LOOK_KEYS)
                  : { seed: member.config.seed },
                specimen: specimens[index],
              })),
              seed,
            }
          : null
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
    if (configRef.current.startGrown) {
      stateRef.current.t = startTime(configRef.current);
    }

    const timer = setTimeout(() => {
      request(stateRef.current.cycle).then((next) => {
        if (next) {
          onBouquetRef.current(next);
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
        stateRef.current.t = startTime(configRef.current);
      },
    };
  }, [apiRef]);

  useFrame((_, delta) => {
    if (!loadedRef.current) {
      return;
    }

    const levels = advance(stateRef.current, configRef.current, delta, request);

    if (levels.swap) {
      onBouquetRef.current(levels.swap);

      if (configRef.current.rollGenerations) {
        skipReloadRef.current = true;
        configRef.current.regenerate?.();
      }
    }

    onLevelsRef.current(levels);
  });
}
