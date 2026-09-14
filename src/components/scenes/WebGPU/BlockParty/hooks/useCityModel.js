import { useEffect, useMemo, useRef, useState } from 'react';

import { useFrame } from '@react-three/fiber';

import buildCityModel, {
  rebuildDistrictCells,
  retireDistrictCells,
} from '../utils/cityModel';
import { districtOrder, nextDistrict } from '../utils/rebuildOrder';

function groupByDistrict(model) {
  const byDistrict = model.districts.map(() => []);

  model.cells.forEach((cell) => {
    byDistrict[cell.district].push(cell);
  });

  return { byDistrict, generations: model.districts.map(() => 0) };
}

function occupiedDistricts(byDistrict) {
  return byDistrict.reduce(
    (indices, cells, index) => (cells.length ? [...indices, index] : indices),
    []
  );
}

// A rebuild is two phases on the build clock: the district recedes to ground
// level, and only once every cell is flush does its replacement emerge.
export default function useCityModel({
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
  const [state, setState] = useState(() => groupByDistrict(model));
  const cursorRef = useRef({ last: null, turn: -1 });
  const retiringRef = useRef(null);
  const liveRef = useRef({ composition, revealBand });

  liveRef.current = { composition, revealBand };

  const order = useMemo(
    () => districtOrder(rebuildOrder, model.districts),
    [model, rebuildOrder]
  );

  useEffect(() => {
    cursorRef.current = { last: null, turn: -1 };
    retiringRef.current = null;
    setState(groupByDistrict(model));
  }, [model]);

  useEffect(() => {
    if (!rebuildEnabled) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      if (retiringRef.current) {
        return;
      }

      setState((previous) => {
        const { index, turn } = nextDistrict({
          ...cursorRef.current,
          mode: rebuildOrder,
          occupied: occupiedDistricts(previous.byDistrict),
          order,
        });

        if (index === null) {
          return previous;
        }

        const { cells, settlesAt } = retireDistrictCells({
          cells: previous.byDistrict[index],
          clock: buildClockRef.current,
          radius: model.radius,
        });
        const byDistrict = [...previous.byDistrict];

        byDistrict[index] = cells;
        cursorRef.current = { last: index, turn };
        retiringRef.current = {
          index,
          settlesAt: settlesAt + liveRef.current.revealBand,
        };

        return { ...previous, byDistrict };
      });
    }, rebuildSeconds * 1000);

    return () => window.clearInterval(intervalId);
  }, [
    buildClockRef,
    model,
    order,
    rebuildEnabled,
    rebuildOrder,
    rebuildSeconds,
  ]);

  useFrame(() => {
    const retiring = retiringRef.current;

    if (!retiring || buildClockRef.current < retiring.settlesAt) {
      return;
    }

    retiringRef.current = null;

    setState((previous) => {
      const { index } = retiring;
      const generation = previous.generations[index] + 1;
      const byDistrict = [...previous.byDistrict];
      const generations = [...previous.generations];

      byDistrict[index] = rebuildDistrictCells({
        birthBase: buildClockRef.current,
        composition: liveRef.current.composition,
        district: model.districts[index],
        generation,
        radius: model.radius,
        referenceHeight,
        seed,
      });
      generations[index] = generation;

      return { byDistrict, generations };
    });
  });

  const cells = useMemo(() => state.byDistrict.flat(), [state.byDistrict]);

  return { cells, cellsByDistrict: state.byDistrict, model };
}
