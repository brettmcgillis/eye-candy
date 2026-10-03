/* eslint-disable no-param-reassign */
import { createRng } from '@modules/flora';

import {
  EXHIBITS,
  FAMILIES,
  MATERIALS,
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  kindKey,
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

// The form roll picks a family and an exhibit in it, then rolls only that
// exhibit's own parameters and its family's: the rest keep their defaults,
// so a rolled config is a readable preset.
function rollForm(config, rng, { families }) {
  const family = pick(rng, families);
  const id = pick(rng, EXHIBITS[family]);
  config.family = family;
  config[kindKey(family)] = id;
  keysInFacet('form').forEach((key) => {
    const item = RENDER_OPTIONS[key];
    if (!item.roll) return;
    const mine =
      item.exhibit === id ||
      (!item.exhibit && item.when?.family?.includes(family));
    if (mine) config[key] = rollValue(item, rng);
  });
  config.objectSpin = Math.round(-180 + 360 * rng());
}

const MATERIAL_WEIGHTS = {
  brass: 1,
  bronze: 3,
  ceramic: 1.5,
  marble: 2.5,
  painted: 1,
  plaster: 3,
  steel: 2,
};

function rollLook(config, rng, { palettes }) {
  config.material = weighted(
    rng,
    MATERIALS.map((m) => [m, MATERIAL_WEIGHTS[m]])
  );
  if (palettes?.length) config.paletteName = pick(rng, palettes);
  if (config.material === 'painted') {
    config.paletteAmount = Number((0.7 + 0.3 * rng()).toFixed(2));
  }
}

const PLINTH_GREYS = ['#b3ada4', '#d8d3ca', '#8f8a94', '#c9c3b8', '#ece8e0'];

function rollStage(config, rng) {
  config.plinth = weighted(rng, [
    ['column', 3],
    ['block', 3],
    ['turned', 2],
    ['none', 0.4],
  ]);
  config.plinthColor = pick(rng, PLINTH_GREYS);
}

const FACET_ROLLS = { form: rollForm, look: rollLook, stage: rollStage };

// A flat ExhibitA config — a valid preset. Facets roll on their own streams
// so one can be held while the others move.
export default function rollExhibitConfig(
  batchSeed,
  {
    base = {},
    families = FAMILIES,
    keep = [],
    palettes = null,
    pinned = {},
  } = {}
) {
  const config = { ...sceneDefaults(), ...base };

  facets()
    .filter((facet) => !keep.includes(facet))
    .forEach((facet) => {
      const rng = createRng(`${batchSeed}:${facet}`);
      if (facet !== 'form') {
        keysInFacet(facet).forEach((key) => {
          const item = RENDER_OPTIONS[key];
          if (item.roll) config[key] = rollValue(item, rng);
        });
      }
      FACET_ROLLS[facet]?.(config, rng, { families, palettes });
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
