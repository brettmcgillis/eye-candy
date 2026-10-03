/* eslint-disable no-param-reassign */
import { createRng } from '@modules/flora';

import createKdTree from './kdTree';
import { wire } from './network';
import { createNoise } from './noise';

const smooth = (x) => {
  const t = Math.min(Math.max(x, 0), 1);
  return t * t * (3 - 2 * t);
};
const REST_SECONDS = 0.6;
const POP = 0.04;

// Grow out from the roots, hold, grow back in to them, rest: a cycle ends
// empty so a new network can swap in unseen. Points keep drifting and
// signals keep walking the revealed edges throughout.
export function growCycleSeconds(config) {
  return config.growSeconds * 2 + config.holdSeconds + REST_SECONDS;
}

export function growAt(time, config, { loop = true } = {}) {
  const grow = config.growSeconds;
  if (!loop) return Math.min(time / grow, 1);
  const t = time % growCycleSeconds(config);
  if (t < grow) return t / grow;
  if (t < grow + config.holdSeconds) return 1;
  return Math.max(1 - (t - grow - config.holdSeconds) / grow, 0);
}

// Per point and per edge, how much of it shows at `grow` in [0, 1]. Run
// backwards it retracts the network into its roots, leaves first.
export function growState(network, grow) {
  if (grow == null) return null;
  const g = Math.min(Math.max(grow, 0), 1) * (1 + POP);
  const node = (i) => smooth((g - network.arrival[i]) / POP);
  const edge = ({ a, b }) => {
    const ta = network.arrival[a];
    const tb = network.arrival[b];
    const first = Math.min(ta, tb);
    const span = Math.abs(tb - ta);
    const reached = g >= first ? 1 : 0;
    const reveal = span < 1e-6 ? reached : (g - first) / span;
    return {
      alpha: 1,
      from: ta <= tb ? 'a' : 'b',
      reveal: Math.min(Math.max(reveal, 0), 1),
    };
  };
  return { edge, node };
}

// Points wandering through a time-scrolled noise field around their homes;
// the knobs are read per call so the scene can tune them live.
export function createDrift(network, config) {
  const noise = createNoise(`${config.pointSeed}:drift`);
  const home = network.positions;
  const out = new Float32Array(home.length);
  return (time, current = config) => {
    const s = current.driftScale;
    const t = time * current.driftSpeed;
    const amount =
      current.driftAmount *
      Math.min(current.domainX, current.domainY, current.domainZ);
    for (let i = 0; i < home.length; i += 3) {
      const d = noise.vector(
        home[i] * s + t,
        home[i + 1] * s - t * 0.7,
        home[i + 2] * s + t * 0.4,
        2
      );
      out[i] = home[i] + d[0] * amount * 2;
      out[i + 1] = home[i + 1] + d[1] * amount * 2;
      out[i + 2] = home[i + 2] + d[2] * amount * 2;
    }
    return out;
  };
}

// Links that appear fade in and links that break fade out over
// `fadeSeconds`. `update(edges)` hands it a fresh wiring (from `wire` here,
// or a worker in the scene); `step(dt)` returns every edge with its alpha.
// Stepped on a fixed clock it is deterministic, so a video and the scene
// agree.
export function createEdgeFades(count, initial = []) {
  const fades = new Map();
  const keyOf = ({ a, b }) => a * count + b;
  initial.forEach((edge) =>
    fades.set(keyOf(edge), { alpha: 1, edge, live: true })
  );
  let live = initial;

  return {
    get edges() {
      return live;
    },
    update(edges) {
      live = edges;
      const present = new Set(edges.map(keyOf));
      edges.forEach((edge) => {
        const fade = fades.get(keyOf(edge));
        if (fade) Object.assign(fade, { edge, live: true });
        else fades.set(keyOf(edge), { alpha: 0, edge, live: true });
      });
      fades.forEach((fade, key) => {
        if (!present.has(key)) fade.live = false;
      });
    },
    step(dt, fadeSeconds) {
      const rate = fadeSeconds > 0 ? dt / fadeSeconds : 1;
      const out = [];
      fades.forEach((fade, key) => {
        fade.alpha = Math.min(
          Math.max(fade.alpha + (fade.live ? rate : -rate), 0),
          1
        );
        if (!fade.live && fade.alpha <= 0) fades.delete(key);
        else out.push({ ...fade.edge, alpha: fade.alpha });
      });
      return out;
    },
  };
}

// The synchronous drift clock the headless renderers use: positions at
// `time`, rewired every `rewireSeconds`, edges faded.
export function createDriftClock(network, config) {
  const drift = createDrift(network, config);
  const fades = createEdgeFades(network.count, network.edges);
  let since = 0;
  let current = { ...network };
  return {
    step(time, dt) {
      const positions = drift(time);
      since += dt;
      if (since >= config.rewireSeconds) {
        since = 0;
        const wiring = wire({ ...network, positions }, config);
        fades.update(wiring.edges);
        current = { ...network, ...wiring, positions };
      }
      return {
        edges: fades.step(dt, config.fadeSeconds),
        network: { ...current, positions },
        positions,
      };
    },
  };
}

// Signals walking the network: each runs along an edge, then picks a next
// edge at random (not straight back unless it must). Stateful and stepped,
// so it follows a network that rewires underneath it. `reach` is the grow
// level: only edges grown out that far carry signals, and a signal whose
// edge is retracting starts again somewhere still grown. At a node a signal
// keeps the straightest way on (with a little wander), so it flows along a
// path rather than jittering through a dense net.
export function createPulses(seed, count) {
  const rng = createRng(`pulses:${seed}`);
  const pulses = Array.from({ length: count }, (_, id) => ({
    age: 0,
    at: -1,
    from: -1,
    id,
    progress: 0,
    to: -1,
  }));

  const WANDER = 0.5;
  let reach = 1;
  let current = null;
  const grown = (network, a, b) =>
    reach >= 1 ||
    !network.arrival ||
    Math.max(network.arrival[a], network.arrival[b]) <= reach;

  function direction(a, b) {
    const d = [0, 1, 2].map((c) => current[b * 3 + c] - current[a * 3 + c]);
    const length = Math.hypot(...d) || 1;
    return d.map((v) => v / length);
  }

  function start(pulse, network) {
    const { adjacency, count: points } = network;
    for (let tries = 0; tries < 12; tries += 1) {
      const at = Math.floor(rng() * points);
      const options = (adjacency[at] ?? []).filter(([n]) =>
        grown(network, at, n)
      );
      if (options.length > 0) {
        const [to] = options[Math.floor(rng() * options.length)];
        Object.assign(pulse, { age: 0, from: at, progress: 0, to });
        return;
      }
    }
    pulse.from = -1;
  }

  function next(pulse, network) {
    const options = (network.adjacency[pulse.to] ?? []).filter(([n]) =>
      grown(network, pulse.to, n)
    );
    if (options.length === 0) {
      start(pulse, network);
      return;
    }
    const forward = options.filter(([n]) => n !== pulse.from);
    const pool = forward.length > 0 ? forward : options;
    const at = pulse.to;
    const heading = direction(pulse.from, at);
    let to = pool[0][0];
    let best = -Infinity;
    pool.forEach(([n]) => {
      const out = direction(at, n);
      const score =
        heading[0] * out[0] +
        heading[1] * out[1] +
        heading[2] * out[2] +
        rng() * WANDER * 2;
      if (score > best) {
        best = score;
        to = n;
      }
    });
    Object.assign(pulse, { from: at, progress: 0, to });
  }

  const lengthOf = (at, a, b) =>
    Math.hypot(
      at[a * 3] - at[b * 3],
      at[a * 3 + 1] - at[b * 3 + 1],
      at[a * 3 + 2] - at[b * 3 + 2]
    );

  return {
    pulses,
    // A rebuilt network numbers its points afresh: each signal moves to the
    // new point nearest where it was and carries on along a real edge.
    retarget(previous, network) {
      if (!previous || network.count === 0) return;
      const tree = createKdTree(network.positions);
      pulses.forEach((pulse) => {
        if (pulse.from < 0 || pulse.to >= previous.count) return;
        const t = pulse.progress;
        const where = [0, 1, 2].map(
          (c) =>
            previous.positions[pulse.from * 3 + c] * (1 - t) +
            previous.positions[pulse.to * 3 + c] * t
        );
        const at = tree.closest(...where);
        const options = at < 0 ? [] : (network.adjacency[at] ?? []);
        if (options.length === 0) {
          pulse.from = -1;
          return;
        }
        const [to] = options[Math.floor(rng() * options.length)];
        Object.assign(pulse, { from: at, progress: 0, to });
      });
    },

    step(network, at, dt, speed, grow = 1) {
      reach = grow;
      current = at;
      pulses.forEach((pulse) => {
        if (
          pulse.from < 0 ||
          pulse.from >= network.count ||
          pulse.to >= network.count ||
          !grown(network, pulse.from, pulse.to)
        )
          start(pulse, network);
        if (pulse.from < 0) return;
        pulse.age += dt;
        let travel = dt * speed;
        for (let hop = 0; hop < 8 && travel > 0; hop += 1) {
          const length = Math.max(lengthOf(at, pulse.from, pulse.to), 1e-4);
          const left = (1 - pulse.progress) * length;
          if (travel < left) {
            pulse.progress += travel / length;
            travel = 0;
          } else {
            travel -= left;
            next(pulse, network);
          }
        }
      });
    },
    // A pulse is stable to a stills time: step it there on a fixed clock.
    advance(network, positions, seconds, speed, fps = 30) {
      const frames = Math.round(seconds * fps);
      for (let f = 0; f < frames; f += 1) {
        this.step(network, positions, 1 / fps, speed);
      }
    },
  };
}
