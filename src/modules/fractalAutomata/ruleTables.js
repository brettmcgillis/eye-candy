/* eslint-disable no-bitwise */
// Port of the hierarchical cube/face/edge subdivision CA's rule-table
// generation (~/dev/examples/260708_AutomataChunks/src/automata/rules.ts) —
// pure CPU/JS, no three.js dependency. A "rule table" maps a corner-state
// tally (how many of a cell's sampled neighbors are in state 1/2/3) to the
// state the new cell resolves to.

export const CUBE_RULE_STRIDE = 9;
export const FACE_RULE_STRIDE = 7;
export const EDGE_RULE_STRIDE = 7;

export function getK(level) {
  return (1 << level) + 1;
}

export function getRuleIndex(c1, c2, c3, stride) {
  return c1 + stride * (c2 + stride * c3);
}

function hash32(value) {
  let next = value >>> 0;
  next ^= next >>> 16;
  next = Math.imul(next, 0x7feb352d);
  next ^= next >>> 15;
  next = Math.imul(next, 0x846ca68b);
  next ^= next >>> 16;
  return next >>> 0;
}

function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededState(seed, x, z) {
  return (
    (hash32(seed ^ Math.imul(x + 1, 374761393) ^ Math.imul(z + 1, 668265263)) %
      3) +
    1
  );
}

function chooseRuleState(c1, c2, c3, maxSamples, settings, rng) {
  const filled = c1 + c2 + c3;
  if (filled === 0) {
    return 0;
  }

  if (settings.ruleMode === 'balanced') {
    const densityGate = settings.density * (0.45 + filled / maxSamples);
    if (rng() > densityGate) {
      return 0;
    }
    return ((filled + c1 * 2 + c2 * 3 + c3 * 5) % 3) + 1;
  }

  if (settings.ruleMode === 'ising') {
    const emptyWeight = Math.exp(
      settings.beta * (maxSamples - filled) - settings.density * 2.5
    );
    const weights = [
      Math.exp(settings.beta * c1 + settings.magnetism),
      Math.exp(settings.beta * c2),
      Math.exp(settings.beta * c3 - settings.magnetism),
    ];
    const total = emptyWeight + weights[0] + weights[1] + weights[2];
    const roll = rng() * total;
    if (roll < emptyWeight) {
      return 0;
    }
    if (roll < emptyWeight + weights[0]) {
      return 1;
    }
    if (roll < emptyWeight + weights[0] + weights[1]) {
      return 2;
    }
    return 3;
  }

  const densityGate = settings.density * (0.38 + filled / maxSamples);
  if (rng() > densityGate) {
    return 0;
  }

  const counts = [c1 + settings.magnetism, c2, c3 - settings.magnetism];
  const maxCount = Math.max(...counts);
  const candidates = counts
    .map((count, index) => ({ count, state: index + 1 }))
    .filter((candidate) => candidate.count === maxCount);
  return candidates[Math.floor(rng() * candidates.length)]?.state ?? 1;
}

function createRuleTable(maxSamples, stride, settings, rng) {
  const table = new Uint32Array(stride * stride * stride);
  for (let c1 = 0; c1 <= maxSamples; c1 += 1) {
    for (let c2 = 0; c2 <= maxSamples - c1; c2 += 1) {
      for (let c3 = 0; c3 <= maxSamples - c1 - c2; c3 += 1) {
        table[getRuleIndex(c1, c2, c3, stride)] = chooseRuleState(
          c1,
          c2,
          c3,
          maxSamples,
          settings,
          rng
        );
      }
    }
  }
  return table;
}

// Returns { cube, face, edge } Uint32Array rule tables for the given
// settings (seed/ruleMode/density/beta/magnetism). Deterministic — same
// settings always produce the same tables, so this is safe to call fresh on
// every structural regenerate.
export function createRuleTables(settings) {
  const seedOffsets = {
    random: 0x1a2b3c4d,
    ising: 0x5e6f7788,
    balanced: 0x13579bdf,
  };
  const rng = createRng(
    settings.seed ^ (seedOffsets[settings.ruleMode] ?? seedOffsets.random)
  );
  return {
    cube: createRuleTable(8, CUBE_RULE_STRIDE, settings, rng),
    face: createRuleTable(6, FACE_RULE_STRIDE, settings, rng),
    edge: createRuleTable(6, EDGE_RULE_STRIDE, settings, rng),
  };
}
