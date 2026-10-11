import { createRng } from '@modules/flora';
import { rgbToHex } from '@utils/paletteStops';

import {
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

// Three state colours that belong together. The structure is mostly one
// material seen under a few lights, so most schemes keep lightness apart and
// saturation low, with the odd loud accent.
function stateColors(rng) {
  const hue = rng() * 360;
  const scheme = weighted(rng, [
    ['analogous', 3],
    ['complement', 3],
    ['accent', 3],
    ['mono', 2],
    ['triad', 1],
  ]);
  const tone = (offset, saturation, lightness) =>
    hsl(hue + offset, saturation, lightness);
  const lightnesses = [
    between(rng, 0.62, 0.88),
    between(rng, 0.3, 0.55),
    between(rng, 0.08, 0.25),
  ].sort(() => rng() - 0.5);

  if (scheme === 'analogous') {
    return [
      tone(0, between(rng, 0.45, 0.85), lightnesses[0]),
      tone(between(rng, 20, 45), between(rng, 0.45, 0.85), lightnesses[1]),
      tone(between(rng, 50, 90), between(rng, 0.3, 0.7), lightnesses[2]),
    ];
  }
  if (scheme === 'complement') {
    return [
      tone(0, between(rng, 0.5, 0.9), lightnesses[0]),
      tone(180, between(rng, 0.5, 0.9), lightnesses[1]),
      tone(0, between(rng, 0.05, 0.2), lightnesses[2]),
    ];
  }
  if (scheme === 'accent') {
    return [
      hsl(hue, between(rng, 0.02, 0.12), between(rng, 0.6, 0.9)),
      hsl(hue, 0.9, between(rng, 0.45, 0.6)),
      hsl(hue + 20, between(rng, 0.02, 0.15), between(rng, 0.12, 0.35)),
    ];
  }
  if (scheme === 'mono') {
    const saturation = between(rng, 0.15, 0.7);
    return lightnesses.map((l) => tone(0, saturation, l));
  }
  return [0, 120, 240].map((offset, i) =>
    tone(offset, between(rng, 0.5, 0.85), lightnesses[i])
  );
}

const FACET_ROLLS = {
  structure(config, rng) {
    Object.assign(config, {
      baseFill: weighted(rng, [
        ['random', 9],
        ['split', 1],
      ]),
      ruleMode: weighted(rng, [
        ['random', 6],
        ['balanced', 3],
        ['ising', 1],
      ]),
    });
  },

  detail(config, rng) {
    Object.assign(config, {
      detailAltitudeVariance: rng.chance(0.25),
      detailEnhanceEnabled: rng.chance(0.45),
    });
  },

  color(config, rng, { palettes }) {
    const named = palettes?.length && rng.chance(0.4);
    const [start, mid, end] = stateColors(rng);
    Object.assign(config, {
      paletteExact: rng.chance(0.4),
      paletteMid: mid,
      paletteName: named
        ? palettes[Math.floor(rng() * palettes.length)]
        : 'None',
      paletteStart: start,
      paletteEnd: end,
    });
  },

  material(config, rng) {
    Object.assign(config, {
      state3Clearcoat: rng.chance(0.5)
        ? Number(between(rng, 0.1, 0.6).toFixed(2))
        : 0,
    });
  },

  // One mood: the backdrop, the key's bearing and the godray light agree.
  atmosphere(config, rng) {
    const night = rng.chance(0.8);
    const hue = rng() * 360;
    const warm = rng.chance(0.6);
    const beam = hsl(
      warm ? between(rng, 25, 50) : between(rng, 190, 230),
      between(rng, 0.5, 0.95),
      between(rng, 0.6, 0.8)
    );
    Object.assign(config, {
      backgroundColor: night
        ? hsl(hue, between(rng, 0.2, 0.7), between(rng, 0.01, 0.05))
        : hsl(hue, between(rng, 0.03, 0.2), between(rng, 0.25, 0.6)),
      godraysBlendColor: beam,
      godraysColor: beam,
      godraysEnabled: rng.chance(night ? 0.45 : 0.2),
    });
  },
};

// A flat Fractal Automata config — a valid preset. Facets roll on their own
// streams so one can be held while the others move.
export default function rollFractalAutomataConfig(
  batchSeed,
  { base = {}, keep = [], palettes = null, pinned = {} } = {}
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
