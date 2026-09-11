import { useEffect, useMemo, useRef, useState } from 'react';

import buildCityModel, { rebuildDistrictCells } from '../utils/cityModel';

function groupByDistrict(model) {
  const byDistrict = model.districts.map(() => []);

  model.cells.forEach((cell) => {
    byDistrict[cell.district].push(cell);
  });

  return {
    byDistrict,
    dirty: null,
    generations: model.districts.map(() => 0),
    version: 0,
  };
}

// A district whose bounds never reach the clip disc classifies to nothing, so
// rebuilding it would burn a turn on an empty tile.
function occupiedDistricts(state) {
  return state.byDistrict.reduce(
    (indices, cells, index) => (cells.length ? [...indices, index] : indices),
    []
  );
}

export default function useCityModel({
  buildClockRef,
  rebuildEnabled,
  rebuildSeconds,
  referenceHeight,
  seed,
}) {
  const model = useMemo(
    () => buildCityModel({ referenceHeight, seed }),
    [referenceHeight, seed]
  );
  const [state, setState] = useState(() => groupByDistrict(model));
  const turnRef = useRef(0);

  useEffect(() => {
    turnRef.current = 0;
    setState(groupByDistrict(model));
  }, [model]);

  useEffect(() => {
    if (!rebuildEnabled) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setState((previous) => {
        const occupied = occupiedDistricts(previous);

        if (!occupied.length) {
          return previous;
        }

        turnRef.current = (turnRef.current + 1) % occupied.length;

        const index = occupied[turnRef.current];
        const generation = previous.generations[index] + 1;
        const byDistrict = [...previous.byDistrict];
        const generations = [...previous.generations];

        byDistrict[index] = rebuildDistrictCells({
          birthBase: buildClockRef.current,
          district: model.districts[index],
          generation,
          radius: model.radius,
          referenceHeight,
          seed,
        });
        generations[index] = generation;

        return {
          byDistrict,
          dirty: index,
          generations,
          version: previous.version + 1,
        };
      });
    }, rebuildSeconds * 1000);

    return () => window.clearInterval(intervalId);
  }, [
    buildClockRef,
    model,
    rebuildEnabled,
    rebuildSeconds,
    referenceHeight,
    seed,
  ]);

  const cells = useMemo(() => state.byDistrict.flat(), [state.byDistrict]);

  return {
    cells,
    cellsByDistrict: state.byDistrict,
    dirtyDistrict: state.dirty,
    model,
    version: state.version,
  };
}
