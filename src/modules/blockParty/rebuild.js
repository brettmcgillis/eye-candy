/* eslint-disable no-param-reassign */
import { rebuildDistrictCells, retireDistrictCells } from './cityModel';
import createPrng from './prng';
import { districtOrder, nextDistrict } from './rebuildOrder';

export const SETTLED = 1000;

export function groupByDistrict(model) {
  const byDistrict = model.districts.map(() => []);

  model.cells.forEach((cell) => {
    byDistrict[cell.district].push(cell);
  });

  return byDistrict;
}

function occupiedDistricts(byDistrict) {
  return byDistrict.reduce(
    (indices, cells, index) => (cells.length ? [...indices, index] : indices),
    []
  );
}

// The rolling rebuild as a plain state machine on the build clock, so the
// scene and the video CLI step the same sequence. A rebuild is two phases:
// the district recedes to ground level, and only once every cell is flush
// does its replacement emerge.
export default function createRebuildState(model, { order: mode, seed }) {
  return {
    byDistrict: groupByDistrict(model),
    cursor: { last: null, turn: -1 },
    generations: model.districts.map(() => 0),
    mode,
    model,
    order: districtOrder(mode, model.districts),
    random: createPrng(seed * 31 + 7),
    retiring: null,
    seed,
    sinceTick: 0,
  };
}

export function cellsOf(state) {
  return state.byDistrict.flat();
}

function retireNext(state, clock, revealBand) {
  const { index, turn } = nextDistrict({
    ...state.cursor,
    mode: state.mode,
    occupied: occupiedDistricts(state.byDistrict),
    order: state.order,
    random: state.random,
  });

  if (index === null) {
    return false;
  }

  const { cells, settlesAt } = retireDistrictCells({
    cells: state.byDistrict[index],
    clock,
    radius: state.model.radius,
  });

  state.byDistrict[index] = cells;
  state.cursor = { last: index, turn };
  state.retiring = { index, settlesAt: settlesAt + revealBand };

  return true;
}

function replaceRetired(state, clock, { composition, referenceHeight }) {
  const { index } = state.retiring;
  const generation = state.generations[index] + 1;

  state.retiring = null;
  state.generations[index] = generation;
  state.byDistrict[index] = rebuildDistrictCells({
    birthBase: clock,
    composition,
    district: state.model.districts[index],
    generation,
    radius: state.model.radius,
    referenceHeight,
    seed: state.seed,
  });
}

// Returns true when the cells changed. `seconds` is wall time since the last
// step; `clock` is the build clock after it.
export function stepRebuild(
  state,
  { clock, composition, enabled, every, referenceHeight, revealBand, seconds }
) {
  let changed = false;

  if (enabled) {
    state.sinceTick += seconds;

    while (state.sinceTick >= every) {
      state.sinceTick -= every;

      if (!state.retiring) {
        changed = retireNext(state, clock, revealBand) || changed;
      }
    }
  }

  if (state.retiring && clock >= state.retiring.settlesAt) {
    replaceRetired(state, clock, { composition, referenceHeight });
    changed = true;
  }

  return changed;
}
