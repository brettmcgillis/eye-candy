import { createRng } from '@modules/flora';
import { PALETTE_NAMES, getPaletteStops } from '@utils/paletteRegistry';

import {
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  sceneDefaults,
} from './renderOptions.mjs';

export default function rollConfig(
  seed,
  { base = {}, keep = [], palettes = PALETTE_NAMES, pinned = {} } = {}
) {
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
            (Math.round(rng.range(min, max) / step) * step).toFixed(6)
          );
        } else if (item.type === 'boolean')
          config[key] = rng.chance(item.default ? 0.75 : 0.35);
        else if (item.choices)
          config[key] = item.choices[Math.floor(rng() * item.choices.length)];
      });
      if (facet === 'structure') {
        config.generationSeed = String(seed);
        config.bridges = rng.chance(0.7);
      }
      if (facet === 'color') {
        const available = palettes.filter(
          (name) => getPaletteStops(name)?.length > 1
        );
        config.paletteName = available.length
          ? available[Math.floor(rng() * available.length)]
          : 'None';
        const stops = getPaletteStops(config.paletteName);
        if (stops) {
          [config.colorRangeStart] = stops;
          config.colorRangeEnd = stops.at(-1);
          config.backgroundColor = rng.chance(0.5) ? '#f2f2f2' : '#17171b';
          config.frameColor = config.backgroundColor;
        }
        config.rotate = true;
      }
    });
  return { ...config, ...pinned };
}
export const randomSeed = () => Math.random().toString(36).slice(2, 9);
export const seedFor = (seed, index) =>
  index === 0 ? String(seed) : `${seed}-${index}`;
