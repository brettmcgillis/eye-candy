#!/usr/bin/env node

/* eslint-disable no-console */
import process from 'node:process';

import loadModules from './lib/loadModules.mjs';

const SCENE = '/src/components/scenes/WebGPU/PartyLine';
const ENTRIES = {
  grid: `${SCENE}/games/compete/ownershipGrid.js`,
  hub: '/src/modules/partyRoom/createLoopbackHub.js',
  partyRules: `${SCENE}/utils/partyRules.js`,
  presets: `${SCENE}/presets/presets.js`,
  room: '/src/modules/partyRoom/createRoom.js',
  rules: `${SCENE}/games/gameRules.js`,
};

const loaded = await loadModules(Object.values(ENTRIES));
const mod = (key) => loaded[ENTRIES[key]];
const createRoom = mod('room').default;
const createLoopbackHub = mod('hub').default;
const createPartyRules = mod('partyRules').default;
const GAME_RULES = mod('rules').default;
const { DEFAULT_PRESET, PRESETS } = mod('presets');
const { applyOp, countOwners, createGrid } = mod('grid');

let failures = 0;
const ok = (condition, message) => {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${message}`);
  if (!condition) failures += 1;
};
const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

let clock = 1_000_000;
const now = () => clock;

function makePeer(hub, id, config, options = {}) {
  const rules = createPartyRules(GAME_RULES, DEFAULT_PRESET);
  const room = createRoom({
    getConfig: () => config,
    graceMs: 60,
    now,
    priority: options.priority ?? 0,
    rules,
    tickMs: 10,
    transport: hub.connect(id, options),
  });
  const peer = { epochs: 0, log: [], room };
  room.subscribeOps(({ ops, reset }) => {
    if (reset) {
      peer.log = [];
      peer.epochs += 1;
    }
    peer.log.push(...ops);
  });
  room.setProfile({ avatar: id.charCodeAt(0), color: 3, name: id });
  return peer;
}

const meta = (peer) => peer.room.getSnapshot().meta;

async function checkRoomAndCollab() {
  const hub = createLoopbackHub({ latencyMs: 2 });
  const config = { ...PRESETS.ScribbleTogether, preset: 'ScribbleTogether' };
  const host = makePeer(hub, 'm', config);
  await sleep(120);
  ok(host.room.getSnapshot().isHost, 'lone peer self-elects');

  clock += 1000;
  const kid = makePeer(hub, 'k', config, { joinDelayMs: 200 });
  await sleep(100);
  ok(kid.room.getSnapshot().isHost, 'slow-connecting peer hosts alone first');
  await sleep(300);
  ok(kid.room.getSnapshot().hostId === 'm', 'older room wins the merge');

  const { players } = meta(host);
  const colors = Object.values(players).map((p) => p.color);
  ok(
    Object.keys(players).length === 2 && new Set(colors).size === 2,
    'requested colour clash resolves to distinct colours'
  );
  ok(
    players.m.avatar === 'm'.charCodeAt(0) &&
      players.k.avatar === 'k'.charCodeAt(0),
    'chosen avatars reach the room'
  );

  kid.room.dispatch({ c: 20, p: [0, 0, 65535, 65535], type: 'stroke', w: 10 });
  kid.room.dispatch({ c: 999, p: [5, 5], type: 'stroke', w: 10 });
  host.room.dispatch({ p: [100, 100], type: 'stroke', w: 4 });
  kid.room.dispatch({ p: [1, 2, 3], type: 'stroke', w: 4 });
  await sleep(40);
  ok(
    host.log.length === 3 && kid.log.length === 3,
    'strokes ordered for everyone, malformed batch rejected'
  );
  ok(
    host.log.find((op) => op.pid === 'k')?.c === 20,
    'chosen ink colour is kept on the stroke'
  );
  ok(
    host.log.filter((op) => op.pid === 'k')[1]?.c === players.k.color,
    'invalid ink falls back to the pen colour'
  );

  clock += 5000;
  await sleep(40);
  ok(Boolean(meta(kid).game.prompt), 'first prompt appears after the delay');

  kid.room.dispatch({ preset: 'ScribbleBattle', type: 'preset' });
  kid.room.dispatch({ type: 'clear' });
  await sleep(40);
  ok(
    meta(kid).preset === 'ScribbleTogether' && kid.log.length === 3,
    'non-host cannot switch games or clear the board'
  );

  kid.room.dispatch({ erase: true, p: [0, 0, 9, 9], type: 'stroke', w: 24 });
  await sleep(40);
  ok(
    host.log.at(-1)?.k === 'e' && host.log.at(-1)?.w === 24,
    'eraser strokes are logged as erase ops'
  );

  host.room.dispatch({ preset: 'ScribbleBattle', type: 'preset' });
  await sleep(40);
  ok(meta(kid).preset === 'ScribbleBattle', 'preset switch reaches peers');
  ok(kid.log.length === 0, 'preset switch clears the board');

  host.room.leave();
  await sleep(120);
  ok(kid.room.getSnapshot().isHost, 'remaining peer takes over as host');
  ok(meta(kid).preset === 'ScribbleBattle', 'migrated host keeps room state');
  kid.room.leave();
}

async function checkCompete() {
  const hub = createLoopbackHub({ latencyMs: 2 });
  const config = {
    ...PRESETS.ScribbleBattle,
    competeEraserEvery: 1,
    competeRoundSeconds: 5,
    preset: 'ScribbleBattle',
  };
  const host = makePeer(hub, 'a', config);
  await sleep(120);
  const kid = makePeer(hub, 'b', config);
  await sleep(120);

  kid.room.dispatch({ patch: { competeRoundSeconds: 20 }, type: 'settings' });
  kid.room.dispatch({ type: 'start' });
  await sleep(40);
  ok(
    meta(host).game.phase === 'lobby' &&
      meta(host).settings.competeRoundSeconds !== 20,
    'non-host cannot set the length or start'
  );
  host.room.dispatch({
    patch: { competeEraserEvery: 4, competeRoundSeconds: 10, junk: 1 },
    type: 'settings',
  });
  host.room.dispatch({ patch: { competeRoundSeconds: 15 }, type: 'settings' });
  await sleep(40);
  ok(
    meta(kid).settings.competeRoundSeconds === 10 &&
      meta(kid).settings.competeEraserEvery === 4 &&
      !('junk' in meta(kid).settings),
    'host settings sync; off-menu values are rejected'
  );
  kid.room.dispatch({ p: [0, 0, 65535, 0], type: 'stroke' });
  host.room.dispatch({ type: 'start' });
  await sleep(40);
  ok(meta(kid).game.phase === 'countdown', 'start enters countdown');
  ok(kid.log.length === 0, 'strokes outside a round are ignored');

  clock += 3100;
  await sleep(40);
  ok(meta(kid).game.phase === 'drawing', 'countdown hands over to drawing');
  ok(meta(kid).game.round.seconds === 10, 'round uses the chosen length');

  const sweep = (peer, y) => {
    const points = [];
    for (let x = 0; x <= 65535; x += 4096) points.push(x, y);
    peer.room.dispatch({ p: points, type: 'stroke' });
  };
  for (let y = 2000; y < 60000; y += 400) sweep(kid, y);
  for (let y = 2000; y < 20000; y += 400) sweep(host, y);

  for (let step = 0; step < 160; step += 1) {
    clock += 100;
    // eslint-disable-next-line no-await-in-loop
    await sleep(12);
  }
  await sleep(40);

  const { game } = meta(kid);
  ok(game.phase === 'results', 'round ends on the timer');
  ok(
    kid.log.some((op) => op.k === 'e'),
    'eraser gusts are logged as ops'
  );

  const replica = createGrid(game.round.grid);
  kid.log.forEach((op) => applyOp(replica, op));
  const counts = countOwners(replica);
  const scored = Object.fromEntries(game.results.map((r) => [r.name, r.cells]));
  ok(
    scored.a === counts[meta(kid).players.a.color + 1] &&
      scored.b === counts[meta(kid).players.b.color + 1],
    'client replica matches host scoring exactly'
  );
  ok(game.results[0].name === 'b', 'bigger coverage wins');

  host.room.leave();
  kid.room.leave();
}

async function checkHostSelection() {
  const hub = createLoopbackHub({ latencyMs: 2 });
  const config = { ...PRESETS.ScribbleTogether, preset: 'ScribbleTogether' };
  const first = makePeer(hub, 't', config);
  await sleep(120);
  clock += 10;
  const second = makePeer(hub, 's', config);
  await sleep(120);
  clock += 10;
  const third = makePeer(hub, 'a', config);
  await sleep(120);
  first.room.dispatch({ p: [9, 9], type: 'stroke', w: 4 });
  await sleep(40);

  first.room.leave();
  await sleep(150);
  ok(
    second.room.getSnapshot().isHost && third.room.getSnapshot().hostId === 's',
    'host leaving hands over to the next player in (not the lowest id)'
  );

  const laptop = makePeer(hub, 'z', config, { priority: 1 });
  await sleep(250);
  ok(
    laptop.room.getSnapshot().isHost &&
      second.room.getSnapshot().hostId === 'z' &&
      third.room.getSnapshot().hostId === 'z',
    'localhost peer takes over hosting when it joins'
  );
  ok(
    laptop.log.length === 1 && Object.keys(meta(laptop).players).length === 3,
    'localhost takeover keeps the board and players'
  );
  [second, third, laptop].forEach((peer) => peer.room.leave());
}

await checkRoomAndCollab();
await checkCompete();
await checkHostSelection();

console.log(failures ? `\n${failures} failure(s)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
