import { createRng } from '@modules/flora';
import { hexToRgb, rgbToHex } from '@utils/paletteStops';

import {
  DOMAINS,
  ORIENTATIONS,
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

// A colour nudged in brightness and warmth, so two panels from one
// template are siblings rather than twins.
function nudge(rng, hex, amount = 0.08) {
  const k = 1 + (rng() * 2 - 1) * amount;
  const warm = (rng() * 2 - 1) * amount * 40;
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex([r * k + warm, g * k, b * k - warm]);
}

// Moods per domain: plate, zone, legend, knob, three caps, metal, three
// LEDs, phosphor, background, plate roughness / metalness ranges.
const MOODS = {
  synth: [
    [
      '#1b1b1d',
      '#3a3d44',
      '#ece8dc',
      '#111111',
      ['#d5402b', '#e8892d', '#e8c63a'],
      '#c9ccd1',
      ['#ff3b2f', '#ff3b2f', '#ffb12e'],
      '#ffb347',
      '#0e0e10',
    ],
    [
      '#b9bcc0',
      '#8c9096',
      '#151515',
      '#141414',
      ['#d5402b', '#e9e4d6', '#2f5fa8'],
      '#d7d9dc',
      ['#ff3b2f', '#42ff6b', '#ffb12e'],
      '#7dffb0',
      '#2a2b2e',
    ],
    [
      '#e6dfcf',
      '#c9b48a',
      '#1d1a16',
      '#1a1a1a',
      ['#b8352a', '#2e5e8c', '#e8c63a'],
      '#cfcfcf',
      ['#ff3b2f', '#ff3b2f', '#42ff6b'],
      '#ffd27a',
      '#2b2622',
    ],
  ],
  cockpit: [
    [
      '#4a5246',
      '#3a4038',
      '#f0f0e8',
      '#1a1a1a',
      ['#c8261d', '#e5c22a', '#151515'],
      '#b8bcc0',
      ['#42ff6b', '#ffb12e', '#ff3b2f'],
      '#59ff8a',
      '#11140f',
    ],
    [
      '#2f3236',
      '#3d4146',
      '#f2f2f2',
      '#121212',
      ['#d0291f', '#f1c21b', '#e9e9e9'],
      '#a9adb2',
      ['#42ff6b', '#ffb12e', '#ff3b2f'],
      '#6dffb1',
      '#0d0e10',
    ],
  ],
  dashboard: [
    [
      '#141414',
      '#262626',
      '#f4f4f4',
      '#0e0e0e',
      ['#1a1a1a', '#c9c9c9', '#d33b2c'],
      '#e0e3e8',
      ['#ffb12e', '#2ee6ff', '#ff3b2f'],
      '#2ee6ff',
      '#070707',
    ],
    [
      '#2b2420',
      '#3e342d',
      '#f0e6d8',
      '#151210',
      ['#3a2f28', '#c8a86b', '#a23b2a'],
      '#d9c7a3',
      ['#ffb12e', '#ffb12e', '#ff3b2f'],
      '#ffb347',
      '#120e0c',
    ],
  ],
  lab: [
    [
      '#cbbf9f',
      '#a99a76',
      '#16130f',
      '#1a1a1a',
      ['#b3261e', '#2c5c9e', '#1a1a1a'],
      '#c4c6c8',
      ['#ff3b2f', '#42ff6b', '#ffb12e'],
      '#6dff9e',
      '#2a261f',
    ],
    [
      '#4b6c8c',
      '#365069',
      '#eef2f6',
      '#1c1c1c',
      ['#b3261e', '#d9d9d9', '#151515'],
      '#c7cbd0',
      ['#ff3b2f', '#42ff6b', '#42ff6b'],
      '#7dffd0',
      '#141b22',
    ],
    [
      '#a9aba6',
      '#8f918b',
      '#121212',
      '#2a2a2a',
      ['#c0392b', '#2d6a4f', '#e1c542'],
      '#c9ccd1',
      ['#ff3b2f', '#42ff6b', '#ffb12e'],
      '#9dff7a',
      '#1d1e1c',
    ],
  ],
  console: [
    [
      '#9a9da2',
      '#7d8186',
      '#101010',
      '#4a4c50',
      ['#d33b2c', '#2f6db5', '#3ea35a'],
      '#dfe2e6',
      ['#42ff6b', '#ffb12e', '#ff3b2f'],
      '#54c8ff',
      '#1a1b1d',
    ],
    [
      '#2a2f3a',
      '#3b4352',
      '#e6e8ec',
      '#3b3d42',
      ['#e04a3b', '#e8c63a', '#e9e4d6'],
      '#c9ccd1',
      ['#42ff6b', '#ffb12e', '#ff3b2f'],
      '#54c8ff',
      '#0f1115',
    ],
  ],
};

const SHAPE_WEIGHTS = [
  ['landscape', 0.45],
  ['portrait', 0.35],
  ['square', 0.2],
];

const stepped = (rng, min, max) => min + Math.floor(rng() * (max - min + 1));

function rollShape(rng, orientation) {
  const shape =
    orientation === 'any' ? weighted(rng, SHAPE_WEIGHTS) : orientation;
  if (shape === 'square') {
    const side = stepped(rng, 10, 16);
    const other = side + stepped(rng, -1, 1);
    return rng() < 0.5 ? [side, other] : [other, side];
  }
  const long = stepped(rng, 12, 22);
  const short = Math.max(6, Math.round(long * (0.35 + rng() * 0.45)));
  return shape === 'portrait' ? [short, long] : [long, short];
}

const FACET_ROLLS = {
  layout(config, rng) {
    const mode = weighted(rng, [
      ['subdivide', 5],
      ['grid', 3],
      ['pack', 1.2],
    ]);
    Object.assign(config, {
      enclosure: rng() < 0.7,
      gridBlock: rng() < 0.5 ? 2 : 4,
      layoutMode: mode,
    });
  },

  look(config, rng) {
    const domain = weighted(rng, [
      ['mixed', 3],
      ...DOMAINS.filter((d) => d !== 'mixed').map((d) => [d, 1]),
    ]);
    const moodDomain =
      domain === 'mixed' ? pick(rng, Object.keys(MOODS)) : domain;
    const [plate, zone, legend, knob, caps, metal, leds, phosphor, background] =
      pick(rng, MOODS[moodDomain]);
    const shuffled = [...caps].sort(() => rng() - 0.5);
    Object.assign(config, {
      background: nudge(rng, background, 0.15),
      capColorA: nudge(rng, shuffled[0]),
      capColorB: nudge(rng, shuffled[1]),
      capColorC: nudge(rng, shuffled[2]),
      chassisColor: nudge(rng, '#0b0b0c', 0.3),
      domain,
      knobColor: nudge(rng, knob),
      ledColorA: leds[0],
      ledColorB: leds[1],
      ledColorC: leds[2],
      legendColor: legend,
      metalColor: nudge(rng, metal, 0.05),
      plateColor: nudge(rng, plate),
      screenColor: nudge(rng, phosphor, 0.05),
      zoneColor: nudge(rng, zone),
      plateMetalness:
        moodDomain === 'console' && rng() < 0.6 ? 0.55 : config.plateMetalness,
    });
  },
};

// A flat ControlPanel config — a valid preset. Facets roll on their own
// streams so one can be held while the others move.
export default function rollControlPanelConfig(
  batchSeed,
  { base = {}, keep = [], orientation = 'any', pinned = {} } = {}
) {
  if (!ORIENTATIONS.includes(orientation))
    throw new Error(`orientation must be one of ${ORIENTATIONS.join(', ')}.`);
  const config = { ...sceneDefaults(), ...base };

  facets()
    .filter((facet) => !keep.includes(facet))
    .forEach((facet) => {
      const rng = createRng(`${batchSeed}:${facet}`);
      keysInFacet(facet).forEach((key) => {
        const item = RENDER_OPTIONS[key];
        if (item.roll) config[key] = rollValue(item, rng);
      });
      FACET_ROLLS[facet]?.(config, rng);
    });

  if (!keep.includes('layout') && !pinned.panelDesign && !config.panelDesign) {
    const shapeRng = createRng(`${batchSeed}:shape`);
    [config.panelCols, config.panelRows] = rollShape(shapeRng, orientation);
  }

  Object.entries(pinned).forEach(([key, value]) => {
    if (value != null) config[key] = value;
  });

  if (
    !Object.prototype.hasOwnProperty.call(pinned, 'patchState') &&
    (!keep.includes('patch') || !keep.includes('layout'))
  )
    config.patchState = '';
  return config;
}

export function seedFor(seed, index) {
  return index === 0 ? String(seed) : `${seed}-${index}`;
}

export function randomSeed() {
  return Math.random().toString(36).slice(2, 8);
}
