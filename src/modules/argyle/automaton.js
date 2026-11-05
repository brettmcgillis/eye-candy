import {
  createAutomaton,
  createRule,
  nearestDistance,
  proximityNeighbors,
  randomStates,
} from '@modules/cellularAutomata';

export const STATES = 5;
export const inkOf = (state) => (state > 2 ? 1 : 0);
export const hollowOf = (state) => state === 2 || state === 4;

const PITCH = 1.5 / Math.SQRT2;

function startStates(c, tiles, neighbors) {
  const init = randomStates({
    count: tiles.length,
    density: c.density,
    seed: `${c.seed}:start`,
    states: STATES,
  });
  if (c.start !== 'centre') return init;
  let centre = 0;
  tiles.forEach((tile, i) => {
    if (
      Math.hypot(tile.x, tile.y) < Math.hypot(tiles[centre].x, tiles[centre].y)
    )
      centre = i;
  });
  const cluster = randomStates({
    count: tiles.length,
    density: 1,
    seed: `${c.seed}:cluster`,
    states: STATES,
  });
  const seeded = new Uint8Array(tiles.length);
  [centre, ...neighbors[centre]].forEach((i) => {
    seeded[i] = cluster[i];
  });
  return seeded;
}

export default function createTileAutomaton(c, tiles) {
  const pitch = c.pattern === 'logo' ? nearestDistance(tiles) : PITCH;
  const wide = c.neighborhood === 'wide' || c.rule === 'life';
  const neighbors = proximityNeighbors(tiles, pitch * (wide ? 1.5 : 1.05));
  return createAutomaton({
    init: startStates(c, tiles, neighbors),
    neighbors,
    rule: createRule(c.rule, STATES, {
      heat: c.heat,
      inertia: c.inertia,
      lambda: c.lambda,
      seed: c.seed,
      threshold: c.threshold,
    }),
    seed: `${c.seed}:rule`,
    states: STATES,
  });
}
