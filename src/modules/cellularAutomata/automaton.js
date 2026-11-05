/* eslint-disable no-bitwise */
import { createRng, hashSeed, mix } from './rng';

const KEEP = 4;
const UNIT = 1 / 4294967296;

export function randomStates({ count, density, seed, states }) {
  const rng = createRng(seed);
  return Uint8Array.from({ length: count }, () =>
    rng() < density ? 1 + Math.floor(rng() * (states - 1)) : 0
  );
}

export default function createAutomaton({
  init,
  neighbors,
  rule,
  seed = 0,
  states,
}) {
  const salt = typeof seed === 'number' ? seed >>> 0 : hashSeed(seed);
  const counts = new Int32Array(states);
  const frames = [];
  const blank = (generation) => ({
    age: new Uint16Array(init.length),
    generation,
    state: new Uint8Array(init.length),
  });
  function restart() {
    frames.length = 0;
    const first = blank(0);
    first.state.set(init);
    frames.push(first);
  }
  function step(prev, into) {
    const next = into ?? blank(0);
    next.generation = prev.generation + 1;
    const key = mix(salt, next.generation);
    for (let i = 0; i < init.length; i += 1) {
      counts.fill(0);
      const around = neighbors[i];
      for (let k = 0; k < around.length; k += 1)
        counts[prev.state[around[k]]] += 1;
      const own = prev.state[i];
      const result = rule(own, counts, mix(key, i) * UNIT);
      next.state[i] = result;
      next.age[i] = result === own ? Math.min(65535, prev.age[i] + 1) : 0;
    }
    return next;
  }
  restart();
  return {
    at(generation) {
      const target = Math.max(0, Math.round(generation));
      if (target < frames[0].generation) restart();
      while (frames[frames.length - 1].generation < target) {
        const recycled = frames.length >= KEEP ? frames.shift() : undefined;
        frames.push(step(frames[frames.length - 1], recycled));
      }
      return frames.find((frame) => frame.generation === target);
    },
  };
}
