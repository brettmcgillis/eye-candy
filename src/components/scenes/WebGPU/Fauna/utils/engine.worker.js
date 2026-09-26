import {
  CAPACITY,
  SNAPSHOT_STRIDE,
  bodyTransferables,
  buildBody,
  createWorld,
  express,
  inspectCreature,
  rollFounders,
  setWorldParams,
  stepWorld,
  worldSummary,
  writeSnapshot,
} from '@modules/fauna';

const TICK = 1 / 30;
const INTERVAL_MS = 33;
const MAX_TICKS = 32;
const BUILD_BUDGET_MS = 12;
const REPORT_MS = 250;

const state = {
  accumulator: 0,
  epoch: 0,
  lastReport: 0,
  paused: false,
  pending: [],
  posted: new Set(),
  selected: null,
  timeScale: 1,
  world: null,
};

function post(message, transfer = []) {
  globalThis.postMessage(message, transfer);
}

function drainEvents(world, despawns) {
  world.events.forEach((event) => {
    if (event.type === 'spawn') {
      state.pending.push(event);

      return;
    }

    const queued = state.pending.findIndex((p) => p.id === event.id);

    if (queued >= 0) {
      state.pending.splice(queued, 1);
    } else if (state.posted.delete(event.id)) {
      despawns.push(event);
    }
  });
  world.events.length = 0; // eslint-disable-line no-param-reassign
}

function buildPending(spawns, transfer) {
  const start = performance.now();

  while (state.pending.length && performance.now() - start < BUILD_BUDGET_MS) {
    const event = state.pending.shift();
    const body = buildBody(event.genome);

    state.posted.add(event.id);
    spawns.push({ body, id: event.id, slot: event.slot });
    transfer.push(...bodyTransferables(body));
  }
}

function tick() {
  const { world } = state;

  if (!world) return;

  if (!state.paused) {
    state.accumulator = Math.min(
      state.accumulator + state.timeScale,
      MAX_TICKS
    );

    while (state.accumulator >= 1) {
      stepWorld(world, TICK);
      state.accumulator -= 1;
    }
  }

  const despawns = [];
  const spawns = [];
  const transfer = [];

  drainEvents(world, despawns);
  buildPending(spawns, transfer);

  const snapshot = writeSnapshot(
    world,
    new Float32Array(CAPACITY * SNAPSHOT_STRIDE)
  );

  transfer.push(snapshot.buffer);

  const now = performance.now();
  let report = null;

  if (now - state.lastReport > REPORT_MS) {
    state.lastReport = now;
    report = {
      inspect: state.selected ? inspectCreature(world, state.selected) : null,
      meat: world.food.meat.slice(),
      plant: world.food.plant.slice(),
      summary: worldSummary(world),
    };
    transfer.push(report.meat.buffer, report.plant.buffer);
  }

  post(
    { despawns, epoch: state.epoch, report, snapshot, spawns, type: 'frame' },
    transfer
  );
}

const handlers = {
  body({ detail, genome, key }) {
    const body = buildBody(genome, { detail });

    post({ body, key, type: 'body' }, bodyTransferables(body));
  },
  founders({ params, requestId }) {
    const founders = rollFounders(params).map((genome) => ({
      genome,
      phenotype: express(genome),
    }));

    post({ founders, requestId, type: 'founders' });
  },
  release({ epoch, genomes, params, seed }) {
    state.epoch = epoch;
    state.world = createWorld(genomes, params, seed);
    state.pending = [];
    state.posted = new Set();
    state.accumulator = 0;
  },
  select({ id }) {
    state.selected = id;
    state.lastReport = 0;
  },
  settings({ params, paused, timeScale }) {
    state.paused = paused;
    state.timeScale = timeScale;

    if (state.world) {
      setWorldParams(state.world, params);
    }
  },
};

globalThis.onmessage = ({ data }) => handlers[data.type]?.(data);
setInterval(tick, INTERVAL_MS);
