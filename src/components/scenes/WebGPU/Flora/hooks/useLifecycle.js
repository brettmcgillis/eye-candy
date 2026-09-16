/* eslint-disable no-param-reassign */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import { DEFAULT_PARAMS } from '@modules/flora';

import advance, {
  createCycleState,
  resetRequest,
  timeline,
} from '../utils/cycleMachine';
import { syncSpecimen } from '../utils/uniforms';
import useSpecimenBuilder from './useSpecimenBuilder';

const GENERATION_KEYS = Object.keys(DEFAULT_PARAMS);
const REBUILD_DEBOUNCE_MS = 250;

function seedFor(seed, cycle) {
  return cycle === 0 ? seed : `${seed}-${cycle}`;
}

export default function useLifecycle(config, uniforms, apiRef) {
  const build = useSpecimenBuilder();
  const [specimen, setSpecimen] = useState(null);
  const stateRef = useRef(createCycleState());
  const tokenRef = useRef(0);
  const configRef = useRef(config);

  configRef.current = config;

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
          setSpecimen(next);
        }
      });
    }, REBUILD_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [request]);

  useEffect(() => {
    if (specimen) {
      syncSpecimen(uniforms, specimen);
    }
  }, [specimen, uniforms]);

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
    if (!specimen) {
      return;
    }

    const levels = advance(stateRef.current, configRef.current, delta, request);

    uniforms.growth.value = levels.growth;
    uniforms.bloom.value = levels.bloom;
    uniforms.exit.value = levels.exit;

    if (levels.swap) {
      setSpecimen(levels.swap);
    }
  });

  return specimen;
}
