/* eslint-disable no-param-reassign */
import { useEffect, useMemo, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import { DEFAULT_PARAMS } from '@modules/flora';

import { syncSpecimen } from '../utils/uniforms';
import useSpecimenBuilder from './useSpecimenBuilder';

const GENERATION_KEYS = Object.keys(DEFAULT_PARAMS);
const REBUILD_DEBOUNCE_MS = 120;

function seedFor(seed, cycle) {
  return cycle === 0 ? seed : `${seed}-${cycle}`;
}

function timeline(config) {
  const bloomAt = config.growSeconds * config.bloomStart;
  const matured = Math.max(config.growSeconds, bloomAt + config.bloomSeconds);
  const exitAt = matured + config.holdSeconds;
  const exitEnd = exitAt + config.exitSeconds;

  return { bloomAt, cycleEnd: exitEnd + config.restSeconds, exitAt };
}

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export default function useLifecycle(config, uniforms, apiRef) {
  const build = useSpecimenBuilder();
  const [specimen, setSpecimen] = useState(null);
  const stateRef = useRef({
    cycle: 0,
    nextReady: null,
    nextRequested: false,
    t: 0,
    token: 0,
  });
  const configRef = useRef(config);

  configRef.current = config;

  const generationKey = JSON.stringify(
    GENERATION_KEYS.map((key) => config[key])
  );
  const params = useMemo(
    () => Object.fromEntries(GENERATION_KEYS.map((key) => [key, config[key]])),
    [generationKey]
  );

  useEffect(() => {
    const state = stateRef.current;

    state.token += 1;
    state.nextReady = null;
    state.nextRequested = false;

    const { token } = state;
    const timer = setTimeout(() => {
      build({ ...params, seed: seedFor(params.seed, state.cycle) }).then(
        (next) => {
          if (state.token === token) {
            setSpecimen(next);
          }
        }
      );
    }, REBUILD_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [build, params]);

  useEffect(() => {
    if (specimen) {
      syncSpecimen(uniforms, specimen);
    }
  }, [specimen, uniforms]);

  useEffect(() => {
    apiRef.current = {
      regrow: () => {
        stateRef.current.t = Math.max(
          stateRef.current.t,
          timeline(configRef.current).exitAt
        );
      },
      restart: () => {
        stateRef.current.t = 0;
      },
    };
  }, [apiRef]);

  useFrame((_, delta) => {
    if (!specimen) {
      return;
    }

    const c = configRef.current;
    const state = stateRef.current;
    const { bloomAt, cycleEnd, exitAt } = timeline(c);

    state.t += Math.min(delta, 0.1) * c.timeScale;

    if (!c.regrow && state.t > exitAt) {
      state.t = exitAt;
    }

    uniforms.growth.value = clamp01(state.t / c.growSeconds);
    uniforms.bloom.value = clamp01((state.t - bloomAt) / c.bloomSeconds);
    uniforms.exit.value = clamp01((state.t - exitAt) / c.exitSeconds);

    if (c.regrow && state.t > exitAt && !state.nextRequested) {
      const { token } = state;

      state.nextRequested = true;
      build({ ...params, seed: seedFor(params.seed, state.cycle + 1) }).then(
        (next) => {
          if (state.token === token) {
            state.nextReady = next;
          }
        }
      );
    }

    if (state.t >= cycleEnd && state.nextReady) {
      state.cycle += 1;
      state.t = 0;
      state.nextRequested = false;
      uniforms.growth.value = 0;
      uniforms.exit.value = 0;
      setSpecimen(state.nextReady);
      state.nextReady = null;
    }
  });

  return specimen;
}
