import { createRng } from '@modules/flora';

import {
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  sceneDefaults,
} from './renderOptions.mjs';

function rollValue(item, rng) {
  const { max, min, step } = item.roll;
  const raw = min + (max - min) * rng();
  return Number((Math.round(raw / step) * step).toFixed(6));
}

function weighted(rng, entries) {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = rng() * total;
  for (let i = 0; i < entries.length; i += 1) {
    roll -= entries[i][1];
    if (roll <= 0) return entries[i][0];
  }
  return entries[entries.length - 1][0];
}

const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const between = (rng, min, max) => min + (max - min) * rng();

function hex(hue, saturation, lightness) {
  const h = (((hue % 360) + 360) % 360) / 60;
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = lightness - c / 2;
  const [r, g, b] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ][Math.floor(h) % 6];
  return `#${[r, g, b]
    .map((v) =>
      Math.round((v + m) * 255)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`;
}

const FACET_ROLLS = {
  // A ghost reads on a near-black room or on paper; the skin's own studio
  // now and then.
  location(config, rng) {
    const backdrop = weighted(rng, [
      ['solid', 5],
      ['skin', 2],
    ]);
    const paper = rng.chance(0.35);
    Object.assign(config, {
      backdrop,
      backgroundColor: paper
        ? hex(rng() * 360, between(rng, 0.05, 0.25), between(rng, 0.84, 0.94))
        : hex(rng() * 360, between(rng, 0.1, 0.45), between(rng, 0.04, 0.14)),
      floor: backdrop === 'skin' && rng.chance(0.5),
      location: 'blank',
    });
  },

  pose(config, rng) {
    Object.assign(config, { strike: rng.chance(0.5) });
  },

  skin(config, rng, { skins }) {
    if (skins?.length) Object.assign(config, { skin: pick(rng, skins) });
  },
};

// A flat GhostBuster generation config. Facets roll on their own streams so
// one can be held while the others move.
export default function rollGhostConfig(
  batchSeed,
  { base = {}, keep = [], pinned = {}, skins = null } = {}
) {
  const config = { ...sceneDefaults(), ...base };

  facets()
    .filter((facet) => !keep.includes(facet))
    .forEach((facet) => {
      const rng = createRng(`${batchSeed}:${facet}`);
      keysInFacet(facet).forEach((key) => {
        const item = RENDER_OPTIONS[key];
        if (item.roll) config[key] = rollValue(item, rng);
      });
      FACET_ROLLS[facet]?.(config, rng, { skins });
    });

  Object.entries(pinned).forEach(([key, value]) => {
    if (value != null) config[key] = value;
  });

  return config;
}

export function seedFor(seed, index) {
  return index === 0 ? String(seed) : `${seed}-${index}`;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 8);
}
