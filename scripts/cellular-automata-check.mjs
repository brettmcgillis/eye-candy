#!/usr/bin/env node
import process from 'node:process';

import loadModules from './lib/loadModules.mjs';

const entry = '/src/modules/cellularAutomata/index.js';
const { [entry]: ca } = await loadModules([entry]);
const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

const grid = (size) =>
  Array.from({ length: size * size }, (_, i) => ({
    x: i % size,
    y: Math.floor(i / size),
  }));
const nine = grid(3);
check(
  ca.proximityNeighbors(nine, 1.05)[4].length === 4,
  'near neighbourhood of a centre tile is not four'
);
check(
  ca.proximityNeighbors(nine, 1.5)[4].length === 8,
  'wide neighbourhood of a centre tile is not eight'
);
check(
  ca.proximityNeighbors(nine, 1.5)[0].length === 3,
  'a corner tile does not have three wide neighbours'
);
check(
  ca.nearestDistance(nine) === 1,
  'nearest distance of a unit grid is not 1'
);

const blinkerPoints = grid(5);
const blinker = new Uint8Array(25);
[11, 12, 13].forEach((i) => {
  blinker[i] = 1;
});
const life = ca.createAutomaton({
  init: blinker,
  neighbors: ca.proximityNeighbors(blinkerPoints, 1.5),
  rule: ca.createRule('life', 5),
  states: 5,
});
check(!same(life.at(1).state, blinker), 'a Life blinker did not flip');
check(same(life.at(2).state, blinker), 'a Life blinker lacks period two');
check(life.at(2).age[11] === 0, 'a Life blinker end should be born each step');
check(
  life.at(2).age[12] === 2,
  'a Life blinker centre should survive every step'
);

const block = new Uint8Array(25);
[6, 7, 11, 12].forEach((i) => {
  block[i] = 2;
});
const still = ca.createAutomaton({
  init: block,
  neighbors: ca.proximityNeighbors(blinkerPoints, 1.5),
  rule: ca.createRule('life', 5),
  states: 5,
});
check(same(still.at(6).state, block), 'a Life block did not hold its colour');
check(still.at(6).age[6] === 6, 'a still life tile does not count its age');

const neighbors = ca.proximityNeighbors(grid(9), 1.05);
const init = ca.randomStates({ count: 81, density: 0.9, seed: 'x', states: 5 });
const make = (name, params) =>
  ca.createAutomaton({
    init,
    neighbors,
    rule: ca.createRule(name, 5, { seed: 3, ...params }),
    seed: 'run',
    states: 5,
  });
ca.RULE_NAMES.forEach((name) => {
  const a = make(name, { heat: 0.05 });
  const b = make(name, { heat: 0.05 });
  const forward = a.at(40).state.slice();
  check(same(forward, b.at(40).state), `${name} is not deterministic`);
  a.at(3);
  check(same(a.at(40).state, forward), `${name} rewinds to a different state`);
  check(
    forward.every((s) => s >= 0 && s < 5),
    `${name} left the state range`
  );
});

const quiet = ca.createAutomaton({
  init: new Uint8Array(81),
  neighbors,
  rule: ca.createRule('table', 5, { lambda: 0.9, seed: 5 }),
  states: 5,
});
check(
  quiet.at(25).state.every((s) => s === 0),
  'an empty table automaton did not stay empty'
);

const ring = [Int32Array.of(1, 2), Int32Array.of(0, 2), Int32Array.of(0, 1)];
const cycleOf = (cells) =>
  ca.createAutomaton({
    init: Uint8Array.from(cells),
    neighbors: ring,
    rule: ca.createRule('cyclic', 5, { threshold: 2 }),
    states: 5,
  });
check(
  same(cycleOf([1, 2, 2]).at(1).state, Uint8Array.from([2, 2, 2])),
  'a cyclic tile with two leading neighbours did not advance'
);
check(
  same(cycleOf([1, 2, 0]).at(1).state, Uint8Array.from([1, 2, 0])),
  'a cyclic tile with one leading neighbour advanced'
);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(
  'Cellular automata: neighbourhoods, Life blinker and block, four seeded rules, rewinds and quiescence passed.'
);
