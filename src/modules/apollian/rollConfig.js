import { createRng } from '@modules/flora';
import { rgbToHex } from '@utils/paletteStops';

import createField, { boundRadius } from './fields';
import {
  FAMILIES,
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  sceneDefaults,
} from './renderOptions.mjs';
import { pointOn, sliceFrame } from './slice';

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
const round = (v, places = 3) => Number(v.toFixed(places));

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

const FAMILY_FORMS = {
  apollian4(rng) {
    if (rng.chance(0.7)) {
      return {
        a4RotXW: round(between(rng, -25, 25), 1),
        a4RotYW: round(between(rng, -25, 25), 1),
        a4RotZW: round(between(rng, -25, 25), 1),
        a4Scale: round(between(rng, 1.12, 1.32)),
        a4Shape: 'sheets',
        a4Twist: round(between(rng, 0.4, 1), 2),
        a4W: round(between(rng, -0.06, 0.08), 4),
        fieldScale: round(between(rng, 0.35, 0.9)),
        thickness: round(between(rng, 0.002, 0.006), 4),
      };
    }
    return {
      a4RotXW: round(between(rng, -60, 60), 1),
      a4RotYW: round(between(rng, -70, 70), 1),
      a4RotZW: round(between(rng, -40, 40), 1),
      a4Scale: round(between(rng, 1.25, 1.45)),
      a4Shape: 'tubes',
      a4Twist: round(between(rng, 0, 0.3), 2),
      a4W: round(between(rng, -0.3, 0.4), 4),
      fieldScale: round(between(rng, 1.5, 3)),
      thickness: round(between(rng, 0.012, 0.035), 4),
    };
  },
  disc(rng) {
    return {
      discDrift: round(between(rng, -0.5, 0.5)),
      discFolds: pick(rng, [7, 8, 8, 9]),
      discScale: round(between(rng, 1.26, 1.44)),
      fieldScale: round(between(rng, 1.05, 1.7)),
      thickness: round(between(rng, 0.004, 0.012), 4),
    };
  },
  kleinian(rng) {
    return {
      fieldScale: round(between(rng, 0.7, 1.4)),
      fieldX: round(between(rng, -0.3, 0.3)),
      fieldY: round(between(rng, -0.3, 0.3)),
      fieldZ: round(between(rng, -0.2, 0.5)),
      kleinKey: round(between(rng, 0, 16), 2),
      thickness: round(rng.chance(0.5) ? 0 : between(rng, 0.002, 0.008), 4),
    };
  },
  classic(rng) {
    return {
      classicGap: round(between(rng, 0.01, 0.08)),
      classicMinRadius: round(between(rng, 0.01, 0.022)),
      classicWarp: round(rng.chance(0.25) ? 0 : between(rng, 0.15, 0.7), 2),
      classicWarpAzimuth: Math.round(between(rng, -180, 180)),
      classicWarpElevation: Math.round(between(rng, -60, 60)),
    };
  },
};

const BOUND_WEIGHTS = {
  apollian4: [
    ['sphere', 4],
    ['cube', 3],
    ['disc', 2],
  ],
  classic: [
    ['sphere', 6],
    ['cube', 2],
    ['disc', 2],
  ],
  disc: [
    ['disc', 6],
    ['sphere', 2],
    ['cube', 2],
  ],
  kleinian: [
    ['sphere', 4],
    ['cube', 4],
    ['disc', 2],
  ],
};

const SOLID_SAMPLES = 1200;
const SLICE_SAMPLES = 36;
const THIN = ['apollian4', 'disc'];

// The share of the bound the solid actually fills (cut included). A roll
// that carves almost nothing — or almost all of it — is thrown back.
function solidShare(config, rng) {
  const field = createField(config);
  const r = boundRadius(config);
  let inside = 0;
  for (let i = 0; i < SOLID_SAMPLES; i += 1) {
    const p = [between(rng, -r, r), between(rng, -r, r), between(rng, -r, r)];
    if (field.distance(p) < 0) inside += 1;
  }
  return inside / SOLID_SAMPLES;
}

// What a slice shows: the share of the frame the solid covers, or for
// outside bands the share the band rings cover.
function sliceShare(config) {
  const frame = sliceFrame(config, 0.8);
  const field = createField(config, { withCut: false });
  const limit =
    config.sliceMode === 'bands' && config.bandSide !== 'inside'
      ? config.bandStep * config.bandCount
      : 0;
  let shown = 0;
  for (let j = 0; j < SLICE_SAMPLES; j += 1) {
    for (let i = 0; i < SLICE_SAMPLES; i += 1) {
      const x = ((i + 0.5) / SLICE_SAMPLES) * 1.6 - 0.8;
      const y = ((j + 0.5) / SLICE_SAMPLES) * 2 - 1;
      if (field.distance(pointOn(frame, x, y)) < limit) shown += 1;
    }
  }
  return shown / SLICE_SAMPLES ** 2;
}

const FACET_ROLLS = {
  form(config, rng, { families }) {
    const family = pick(rng, families);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const bound = weighted(rng, BOUND_WEIGHTS[family]);
      Object.assign(config, FAMILY_FORMS[family](rng), {
        bound,
        cubeHalf: round(rng.chance(0.5) ? 0.75 : between(rng, 0.2, 0.6), 2),
        discHalf: round(between(rng, 0.12, 0.35), 2),
        family,
        objectSpin: Math.round(between(rng, -180, 180)),
        objectTilt: Math.round(
          bound === 'disc'
            ? weighted(rng, [
                [0, 3],
                [between(rng, 55, 90), 2],
              ])
            : between(rng, -25, 25)
        ),
      });
      if (family === 'classic') return;
      const filled = solidShare({ ...config, sectionCut: false }, rng);
      if (filled > 0.01 && filled < 0.85) return;
    }
  },

  slice(config, rng) {
    const signed = config.family === 'kleinian' || config.family === 'classic';
    const flat = config.bound === 'disc' && rng.chance(0.7);
    Object.assign(config, {
      bandSide: signed
        ? weighted(rng, [
            ['inside', 3],
            ['both', 1],
          ])
        : 'outside',
      sectionCut: rng.chance(0.3),
      sliceElevation: flat ? 90 : config.sliceElevation,
      sliceMode: weighted(rng, [
        ['bands', 4],
        ['section', 3],
        ['stack', 3],
      ]),
      sliceSpin: Math.round(between(rng, -180, 180)),
      svgPens: Math.round(between(rng, 3, 7)),
      svgStyle: weighted(rng, [
        ['pens', 4],
        ['hatch', 3],
        ['outline', 2],
      ]),
    });
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const share = sliceShare(config);
      if (share > 0.04 && share < 0.92) break;
      Object.assign(config, {
        sliceAzimuth: Math.round(between(rng, -180, 180)),
        sliceElevation: flat
          ? 90
          : Math.round(between(rng, -90, 90) * (attempt < 6 ? 1 : 0.3)),
        sliceOffset: round(between(rng, -0.4, 0.4) * (attempt < 6 ? 1 : 0.25)),
      });
    }
    if (config.sectionCut && solidShare(config, rng) < 0.01) {
      Object.assign(config, { sectionCut: false });
    }
  },

  look(config, rng, { palettes }) {
    Object.assign(config, {
      clearcoat: round(between(rng, 0, 0.8), 2),
      colorDepth: round(rng.chance(0.5) ? between(rng, 0.2, 1) : 0, 2),
      colorHeight: round(rng.chance(0.3) ? between(rng, 0.1, 0.6) : 0, 2),
      colorRadius: round(rng.chance(0.3) ? between(rng, 0.1, 0.6) : 0, 2),
      colorTrap: round(between(rng, 0.3, 1), 2),
      material: weighted(rng, [
        ['matte', 4],
        ['iridescent', 2],
        ['metal', 2],
        ['glass', THIN.includes(config.family) ? 0 : 2],
      ]),
      paletteName: palettes?.length ? pick(rng, palettes) : config.paletteName,
      paletteReverse: rng.chance(0.3),
    });
  },

  // The backdrop may be dark or pale, but what the light falls on never
  // is: a dark plinth and sky in linear light reflect next to nothing, and
  // the floor is the backdrop itself, darkened only by shadow.
  stage(config, rng) {
    const hue = rng() * 360;
    const dark = rng.chance(0.6);
    const lightness = dark ? between(rng, 0.08, 0.2) : between(rng, 0.62, 0.85);
    const saturation = between(rng, 0.03, 0.25);
    Object.assign(config, {
      ambient: round(between(rng, 0.9, 1.4), 2),
      background: hsl(hue, saturation, lightness),
      floorColor: hsl(hue, saturation, lightness * 0.3),
      floorShadow: round(between(rng, 0.55, 0.85), 2),
      lightColor: hsl(between(rng, 20, 50), between(rng, 0.1, 0.5), 0.92),
      plinth: weighted(rng, [
        ['column', 3],
        ['block', 2],
        ['none', 1],
      ]),
      plinthColor: hsl(
        hue + between(rng, -20, 20),
        between(rng, 0.02, 0.15),
        between(rng, 0.45, 0.8)
      ),
      plinthHeight: round(between(rng, 0.35, 1.1), 2),
      plinthWidth: round(between(rng, 0.5, 1.05), 2),
      skyHorizon: hsl(
        hue + 180,
        between(rng, 0.05, 0.3),
        between(rng, 0.7, 0.9)
      ),
      skyZenith: hsl(hue, between(rng, 0.04, 0.18), between(rng, 0.5, 0.72)),
      slicePaper: dark ? hsl(hue, saturation, lightness * 0.8) : '#f2ede4',
    });
  },
};

// A flat Apollian config — a valid preset. Facets roll on their own streams
// so one can be held while the others move.
export default function rollApollianConfig(
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
      keysInFacet(facet).forEach((key) => {
        const item = RENDER_OPTIONS[key];
        if (item.roll) config[key] = rollValue(item, rng);
      });
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
