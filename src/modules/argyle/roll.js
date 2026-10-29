import { createRng } from '@modules/flora';

import { PALETTES } from './color';
import {
  RENDER_OPTIONS,
  SCENE_KEYS,
  configFrom,
  facets,
  keysInFacet,
  sceneDefaults,
} from './renderOptions.mjs';

const pick = (rng, list) => list[Math.floor(rng() * list.length)];
export const seedFor = (seed, index) =>
  index === 0 ? String(seed) : `${seed}-${index}`;
export const randomSeed = () => Math.random().toString(36).slice(2, 10);
export function rollConfig(seed, { base = {}, keep = [], pinned = {} } = {}) {
  const config = { ...sceneDefaults(), ...base };
  facets()
    .filter((facet) => !keep.includes(facet))
    .forEach((facet) => {
      const rng = createRng(`${seed}:${facet}`);
      keysInFacet(facet).forEach((key) => {
        const item = RENDER_OPTIONS[key];
        if (item.roll) {
          const { min, max, step } = item.roll;
          config[key] = Number(
            (Math.round((min + rng() * (max - min)) / step) * step).toFixed(6)
          );
        } else if (item.choices) config[key] = pick(rng, item.choices);
      });
      if (facet === 'layout') {
        config.pattern = pinned.pattern ?? (rng() < 0.2 ? 'logo' : 'column');
        config.rotation = 45;
        if (config.pattern === 'lattice') {
          const side = pinned.columns ?? pinned.rows ?? 22;
          config.columns = side;
          config.rows = side;
        } else {
          const width = pinned.columns ?? pick(rng, [3, 5, 7, 9, 11, 13]);
          config.columns = width;
          config.rows = Math.min(
            63,
            Math.max(width + 4, Math.round(width * (1.8 + rng() * 1.3)))
          );
          if (config.rows % 2 === 0) config.rows += 1;
        }
        const styles = pick(rng, [
          ['filled', 'filled'],
          ['filled', 'filled'],
          ['hollow', 'filled'],
          ['filled', 'hollow'],
          ['hollow', 'hollow'],
        ]);
        [config.lowerStyle, config.upperStyle] = styles;
      }
      if (facet === 'field') {
        if (rng() < 0.18) config.coverage = 1;
        config.edgeFade = rng() < 0.5 ? 0 : config.edgeFade;
      }
      if (facet === 'color') {
        config.palette = pinned.palette ?? pick(rng, Object.keys(PALETTES));
        const palette = PALETTES[config.palette] ?? PALETTES.signal;
        [config.background] = palette;
        [config.inkA, config.inkB, config.inkC] = palette.slice(1, 4);
      }
    });
  Object.entries(pinned).forEach(([key, value]) => {
    if (value != null) config[key] = value;
  });
  return config;
}
export function rollArgs({ options, typed }) {
  return {
    base: options.base ? configFrom(options.base) : {},
    keep: String(options.keep ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    pinned: Object.fromEntries(
      [...typed]
        .filter((key) => SCENE_KEYS.includes(key) || key === 'cameraFrame')
        .map((key) => [key, options[key]])
    ),
  };
}
export function patternAt({ batch, index, roll }) {
  const name = seedFor(batch, index);
  return { config: rollConfig(name, roll), name };
}
