import { mix } from './rng';

const UNIT = 1 / 4294967296;

const dominant = (counts, from = 1) => {
  let best = from;
  for (let s = from + 1; s < counts.length; s += 1)
    if (counts[s] > counts[best]) best = s;
  return best;
};

const cyclic =
  (states, { threshold = 2, heat = 0 }) =>
  (own, counts, noise) => {
    const next = (own + 1) % states;
    return counts[next] >= threshold || noise < heat ? next : own;
  };

const territory =
  (states, { inertia = 1, heat = 0 }) =>
  (own, counts, noise) => {
    if (noise < heat) return Math.floor((noise / heat) * states);
    let best = own;
    let score = counts[own] + inertia;
    for (let s = 0; s < states; s += 1)
      if (s !== own && counts[s] > score) {
        best = s;
        score = counts[s];
      }
    return best;
  };

const life = () => (own, counts) => {
  let alive = 0;
  for (let s = 1; s < counts.length; s += 1) alive += counts[s];
  if (own === 0) return alive === 3 ? dominant(counts) : 0;
  return alive === 2 || alive === 3 ? own : 0;
};

const table =
  (states, { lambda = 0.45, seed = 0 }) =>
  (own, counts) => {
    let key = mix(seed, own);
    let alive = own;
    for (let s = 0; s < states; s += 1) {
      key = mix(key, counts[s]);
      if (s > 0) alive += counts[s];
    }
    if (alive === 0) return 0;
    if (mix(key, 1) * UNIT >= lambda) return 0;
    return 1 + Math.floor(mix(key, 2) * UNIT * (states - 1));
  };

export const RULES = { cyclic, life, table, territory };
export const RULE_NAMES = Object.keys(RULES);
export const createRule = (name, states, params = {}) =>
  RULES[name](states, params);
