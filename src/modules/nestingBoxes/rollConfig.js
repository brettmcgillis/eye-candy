import { createRng } from '@modules/flora';
import { rgbToHex } from '@utils/paletteStops';

import {
  PALETTE_SOURCES,
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  sceneDefaults,
} from './renderOptions.mjs';

function rollValue(spec, rng) {
  const { max, min, step } = spec.roll;
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

function hsl(hue, saturation, lightness) {
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
  return rgbToHex([r, g, b].map((v) => (v + m) * 255));
}

const FACET_ROLLS = {
  color(config, rng, { palettes }) {
    Object.assign(config, {
      baseColor: hsl(
        rng() * 360,
        between(rng, 0.05, 0.3),
        between(rng, 0.6, 0.88)
      ),
      colorMode: weighted(rng, [
        ['palette', 3],
        ['tint', 2],
        ['solid', 1],
      ]),
      paletteExact: rng.chance(0.4),
      paletteSource: weighted(
        rng,
        PALETTE_SOURCES.map((source) => [
          source,
          { height: 3, id: 3 }[source] ?? 2,
        ])
      ),
      ...(palettes?.length ? { paletteName: pick(rng, palettes) } : {}),
    });
  },

  // One mood, so the backdrop, fog and lights agree: fog is the backdrop
  // seen through haze, the sky light leans to the backdrop's hue and the key
  // light is warm or cool against it.
  atmosphere(config, rng) {
    const night = rng.chance(0.35);
    const hue = rng() * 360;
    const saturation = between(rng, 0.05, 0.35);
    const lightness = night
      ? between(rng, 0.04, 0.14)
      : between(rng, 0.35, 0.72);
    const warm = rng.chance(0.6);
    const surface = weighted(rng, [
      ['Concrete', 3],
      ['Stone', 3],
      ['Wood', 2],
      ['Plain', 2],
      ['Asphalt', 1],
    ]);
    const gritty = ['Concrete', 'Stone', 'Asphalt'].includes(surface);

    Object.assign(config, {
      background: hsl(hue, saturation, lightness),
      fogColor: hsl(hue, saturation, night ? lightness + 0.06 : lightness),
      fogEnabled: rng.chance(night ? 0.7 : 0.4),
      lightKeyColor: hsl(
        warm ? between(rng, 20, 45) : between(rng, 200, 230),
        between(rng, 0.3, 0.8),
        between(rng, 0.75, 0.9)
      ),
      lightSkyGroundColor: hsl(hue + 180, 0.3, between(rng, 0.02, 0.12)),
      lightSkySkyColor: hsl(
        hue + between(rng, -30, 30),
        between(rng, 0.1, 0.5),
        night ? between(rng, 0.4, 0.6) : between(rng, 0.85, 1)
      ),
      postBloomEnabled: rng.chance(night ? 0.6 : 0.15),
      surface,
      weathering: Number(between(rng, 0, gritty ? 0.6 : 0.25).toFixed(2)),
      windowsEnabled: false,
    });
    if (night) {
      Object.assign(config, {
        lightKeyIntensity: Number(between(rng, 2, 4).toFixed(2)),
        lightSkyIntensity: Number((config.lightSkyIntensity * 0.8).toFixed(2)),
      });
    }
  },
};

// A flat Nesting Boxes config — a valid preset. Facets roll on their own
// streams so one can be held while the others move. Windows are unfinished,
// so a roll never turns them on.
// `contrast` starts black too; whether the boxes read on it can only be
// judged from a render, so the CLI makes that call (scripts/lib).
function applyBackdrop(config, backdrop) {
  if (backdrop === 'rolled') return;
  Object.assign(config, { background: '#000000', fogColor: '#000000' });
}

export default function rollNestingBoxesConfig(
  batchSeed,
  {
    backdrop = 'rolled',
    base = {},
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
      keysInFacet(facet).forEach((key) => {
        const spec = RENDER_OPTIONS[key];
        if (spec.roll) config[key] = rollValue(spec, rng);
      });
      FACET_ROLLS[facet]?.(config, rng, { palettes });
    });

  if (!keep.includes('atmosphere')) {
    applyBackdrop(config, backdrop);
  }

  Object.entries(pinned).forEach(([key, value]) => {
    if (value != null) config[key] = value;
  });
  // Fog is the backdrop seen through haze, so it follows a set background.
  if (pinned.background != null && pinned.fogColor == null) {
    config.fogColor = config.background;
  }

  return config;
}

export function seedFor(seed, index) {
  return index === 0 ? String(seed) : `${seed}-${index}`;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 8);
}
