import {
  PALETTE_NONE,
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  sceneDefaults,
} from './renderOptions.mjs';
import { createRng } from './rng';

const hex = (h, s, l) => {
  const hue = ((h % 1) + 1) % 1;
  const a = s * Math.min(l, 1 - l);
  const channel = (n) => {
    const k = (n + hue * 12) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
};

// A coherent flower palette from one base hue: the crown carries it, the
// accent sits beside or across from it, bud and tips wash toward white, the
// stem stays a plausible green.
function rollColors(rng) {
  const hue = rng();
  const accent = hue + (rng.chance(0.5) ? rng.range(0.06, 0.14) : 0.5);

  return {
    accentColor: hex(accent, rng.range(0.55, 0.9), rng.range(0.5, 0.7)),
    budColor: hex(hue, rng.range(0.15, 0.35), rng.range(0.86, 0.93)),
    crownColor: hex(hue, rng.range(0.55, 0.9), rng.range(0.45, 0.68)),
    ornamentColor: hex(
      rng.chance(0.5) ? accent : hue + 0.12,
      rng.range(0.6, 0.95),
      rng.range(0.55, 0.75)
    ),
    stemColor: hex(rng.range(0.25, 0.4), rng.range(0.35, 0.6), 0.4),
    tipColor: hex(hue, rng.range(0.2, 0.6), rng.range(0.88, 0.96)),
  };
}

function rollValue(spec, rng) {
  const { max, min, step } = spec.roll;
  const raw = min + (max - min) * rng();
  const snapped = Math.round(raw / step) * step;
  return Number(snapped.toFixed(6));
}

export function rollableKeys() {
  return new Set(facets().flatMap((facet) => keysInFacet(facet)));
}

// A flat scene-keyed flower config — a valid Flora preset. Facets roll on
// their own streams so one can be held while the others move; `pinned` wins
// over everything; `base` supplies whatever the dice leave alone.
export default function rollFloraConfig(
  seed,
  { base = {}, keep = [], paletteNames = [], pinned = {}, seeds = {} } = {}
) {
  const config = { ...sceneDefaults(), ...base, seed: String(seed) };
  const streams = Object.fromEntries(
    facets().map((facet) => [
      facet,
      createRng(`${seeds[facet] ?? seed}:${facet}`),
    ])
  );

  facets()
    .filter((facet) => !keep.includes(facet))
    .forEach((facet) => {
      const rng = streams[facet];
      keysInFacet(facet).forEach((key) => {
        const spec = RENDER_OPTIONS[key];
        if (spec.roll) config[key] = rollValue(spec, rng);
      });

      if (facet === 'palette') {
        Object.assign(config, rollColors(rng));
        config.paletteExact = rng.chance(0.3);
        config.paletteName =
          paletteNames.length > 0 && rng.chance(0.55)
            ? paletteNames[Math.floor(rng() * paletteNames.length)]
            : PALETTE_NONE;
      }
    });

  Object.entries(pinned).forEach(([key, value]) => {
    if (value != null && key !== 'seed') config[key] = value;
  });

  return config;
}
