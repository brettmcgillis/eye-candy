import { useEffect, useMemo, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import {
  buildCityModel,
  cellsOf,
  createRebuildState,
  stepRebuild,
} from '@modules/blockParty';

// The kernel's rebuild state machine stepped on the build clock; React only
// hears about it when the cells actually change.
export default function useCityState({
  buildClockRef,
  composition,
  rebuildEnabled,
  rebuildOrder,
  rebuildSeconds,
  referenceHeight,
  revealBand,
  seed,
}) {
  const model = useMemo(
    () => buildCityModel({ composition, referenceHeight, seed }),
    [composition, referenceHeight, seed]
  );
  const stateRef = useRef(null);
  const [cells, setCells] = useState(model.cells);
  const liveRef = useRef(null);

  liveRef.current = {
    composition,
    enabled: rebuildEnabled,
    every: rebuildSeconds,
    referenceHeight,
    revealBand,
  };

  useEffect(() => {
    stateRef.current = createRebuildState(model, { order: rebuildOrder, seed });
    setCells(cellsOf(stateRef.current));
  }, [model, rebuildOrder, seed]);

  useFrame((_, delta) => {
    const state = stateRef.current;

    if (!state || state.model !== model) {
      return;
    }

    if (
      stepRebuild(state, {
        ...liveRef.current,
        clock: buildClockRef.current,
        seconds: delta,
      })
    ) {
      setCells(cellsOf(state));
    }
  });

  return { cells, model };
}
