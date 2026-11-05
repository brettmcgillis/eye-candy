# Cellular automata

`@modules/cellularAutomata` is a three-free, seeded engine for discrete
automata on any set of cells. Argyle is its first consumer; it takes cells as
neighbour lists, not a rectangle, so a tapered column, the house mark and a
plain grid are all the same thing to it.

## Parts

- `createAutomaton({ init, neighbors, rule, seed, states })` returns
  `at(generation)`, a frame `{ generation, state, age }` (`Uint8Array` states,
  `Uint16Array` generations since each cell last changed). Frames step forward
  lazily and the last four are kept; asking for an earlier generation restarts
  from `init`. Frames are reused buffers: read them before the next `at`.
- `randomStates`, `proximityNeighbors(points, radius)` and `nearestDistance`
  build the start and the adjacency. There is no wrapping: a missing neighbour
  is simply absent.
- `createRule(name, states, params)` / `RULES`. A rule is
  `(own, counts, noise) => state` where `counts` tallies the neighbours per
  state and `noise` is a deterministic `[0, 1)` hash of seed, generation and
  cell. State 0 is empty space.
  - `cyclic` (`threshold`, `heat`): a cell advances to `own + 1` when enough
    neighbours already are, or with chance `heat`. Waves and spirals.
  - `territory` (`inertia`, `heat`): plurality vote with extra weight for the
    cell's own state; `heat` is a chance of a random state. Shifting regions.
  - `life`: births at exactly three occupied neighbours (taking the commonest
    state), survival at two or three. Any non-empty state counts as alive.
  - `table` (`lambda`, `seed`): a seeded random rulebook computed by hashing
    (own state, neighbour tally); `lambda` is the share of neighbourhoods that
    stay occupied, and an all-empty neighbourhood is always quiescent.
- `createRng`, `hashSeed`, `mix`: the engine's own seeded randomness.

Everything is a pure function of the seed, so a still is its seed plus a
generation, and a live preview that steps and rewinds shows the same history.

## Adding a consumer

Build `neighbors` (usually `proximityNeighbors`), an `init`, a rule, and map
the frame's `state` and `age` onto whatever the consumer draws. Keep the
mapping in the consumer: the module knows states, never colours or geometry.
Run `npm run cellular-automata:check` after changing it.
