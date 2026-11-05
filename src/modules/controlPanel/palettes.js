import { hash01 } from './signals';

// The scene presets' colour schemes, by the preset each comes from
// (control-panel:check keeps them equal to it). Zone and chassis colours
// stay the panel's own: a moving panel has no zones and one chassis.
export const PALETTES = {
  Inventory: {
    plateColor: '#4a4d54',
    plateRoughness: 0.55,
    plateMetalness: 0.1,
    legendColor: '#ecebe6',
    knobColor: '#151515',
    capColorA: '#e2552a',
    capColorB: '#e8b331',
    capColorC: '#e9e4d6',
    metalColor: '#c9ccd1',
    ledColorA: '#ff3b2f',
    ledColorB: '#42ff6b',
    ledColorC: '#ffb12e',
    screenColor: '#5cffc8',
    glow: 4,
  },
  Inercia: {
    plateColor: '#e6e6e6',
    plateRoughness: 0.45,
    plateMetalness: 0,
    legendColor: '#111111',
    knobColor: '#e6e6e6',
    capColorA: '#e5531a',
    capColorB: '#f0a020',
    capColorC: '#f2d230',
    metalColor: '#c9ccd1',
    ledColorA: '#ff4040',
    ledColorB: '#ff4040',
    ledColorC: '#ff9ad8',
    screenColor: '#ff7ff0',
    glow: 4,
  },
  'Infinite Widget': {
    plateColor: '#050505',
    plateRoughness: 0.8,
    plateMetalness: 0,
    legendColor: '#f2f2f2',
    knobColor: '#0a0a0a',
    capColorA: '#f2f2f2',
    capColorB: '#bdbdbd',
    capColorC: '#0a0a0a',
    metalColor: '#e0e0e0',
    ledColorA: '#ffffff',
    ledColorB: '#ffffff',
    ledColorC: '#ffffff',
    screenColor: '#ffffff',
    glow: 2.5,
  },
  'Dial From Hell': {
    plateColor: '#4b6c8c',
    plateRoughness: 0.55,
    plateMetalness: 0.1,
    legendColor: '#eef2f6',
    knobColor: '#1c1c1c',
    capColorA: '#b3261e',
    capColorB: '#d9d9d9',
    capColorC: '#151515',
    metalColor: '#c9ccd1',
    ledColorA: '#ff3b2f',
    ledColorB: '#42ff6b',
    ledColorC: '#ffb12e',
    screenColor: '#5cffc8',
    glow: 4,
  },
  Cockpit: {
    plateColor: '#4a5246',
    plateRoughness: 0.75,
    plateMetalness: 0.1,
    legendColor: '#f0f0e8',
    knobColor: '#1a1a1a',
    capColorA: '#c8261d',
    capColorB: '#e5c22a',
    capColorC: '#151515',
    metalColor: '#b8bcc0',
    ledColorA: '#42ff6b',
    ledColorB: '#ffb12e',
    ledColorC: '#ff3b2f',
    screenColor: '#59ff8a',
    glow: 4,
  },
  'Night Ops': {
    plateColor: '#26292d',
    plateRoughness: 0.8,
    plateMetalness: 0.1,
    legendColor: '#a9ffcf',
    knobColor: '#121212',
    capColorA: '#d0291f',
    capColorB: '#f1c21b',
    capColorC: '#2a2a2a',
    metalColor: '#c9ccd1',
    ledColorA: '#42ff6b',
    ledColorB: '#ffb12e',
    ledColorC: '#ff3b2f',
    screenColor: '#6dffb1',
    glow: 8,
  },
  Dashboard: {
    plateColor: '#141414',
    plateRoughness: 0.3,
    plateMetalness: 0.1,
    legendColor: '#f4f4f4',
    knobColor: '#0e0e0e',
    capColorA: '#1a1a1a',
    capColorB: '#c9c9c9',
    capColorC: '#d33b2c',
    metalColor: '#e0e3e8',
    ledColorA: '#ffb12e',
    ledColorB: '#2ee6ff',
    ledColorC: '#ff3b2f',
    screenColor: '#2ee6ff',
    glow: 5,
  },
  'Lab Bench': {
    plateColor: '#cbbf9f',
    plateRoughness: 0.6,
    plateMetalness: 0.1,
    legendColor: '#16130f',
    knobColor: '#1a1a1a',
    capColorA: '#b3261e',
    capColorB: '#2c5c9e',
    capColorC: '#1a1a1a',
    metalColor: '#c4c6c8',
    ledColorA: '#ff3b2f',
    ledColorB: '#42ff6b',
    ledColorC: '#ffb12e',
    screenColor: '#6dff9e',
    glow: 4,
  },
  'Mixing Desk': {
    plateColor: '#9a9da2',
    plateRoughness: 0.4,
    plateMetalness: 0.55,
    legendColor: '#101010',
    knobColor: '#4a4c50',
    capColorA: '#d33b2c',
    capColorB: '#2f6db5',
    capColorC: '#3ea35a',
    metalColor: '#dfe2e6',
    ledColorA: '#42ff6b',
    ledColorB: '#ffb12e',
    ledColorC: '#ff3b2f',
    screenColor: '#54c8ff',
    glow: 4,
  },
  Modular: {
    plateColor: '#b9bcc0',
    plateRoughness: 0.55,
    plateMetalness: 0.3,
    legendColor: '#151515',
    knobColor: '#141414',
    capColorA: '#d5402b',
    capColorB: '#e9e4d6',
    capColorC: '#2f5fa8',
    metalColor: '#d7d9dc',
    ledColorA: '#ff3b2f',
    ledColorB: '#42ff6b',
    ledColorC: '#ffb12e',
    screenColor: '#5cffc8',
    glow: 4,
  },
};

// Districts are the cells of a grid `size` cells across, each about a site
// jittered up to SITE_JITTER of a cell. Site (i, j) wears palette i + 3j
// (mod the count, through a seeded shuffle): with ten palettes no two
// districts within two steps of each other match. A leaf goes to the site
// nearest a point up to SEAM_JITTER of a district off its centre, so a
// border is a ragged band of mixed modules, not a ruled line.
const SITE_JITTER = 0.3;
const SEAM_JITTER = 0.14;

export function createDistricts(config) {
  const names = Object.keys(PALETTES);
  const salt = Math.imul(config.seed + 11, 2654435761);
  const order = names.map((name, n) => ({ name, r: hash01(salt, n) }));
  order.sort((a, b) => a.r - b.r);
  const size = Math.max(config.scrollDistrict, 1);
  const cell = (i, j) => Math.imul(i, 73856093) + Math.imul(j, 19349663);
  const site = (i, j) => [
    (i + 0.5 + SITE_JITTER * (2 * hash01(salt + 1, cell(i, j)) - 1)) * size,
    (j + 0.5 + SITE_JITTER * (2 * hash01(salt + 2, cell(i, j)) - 1)) * size,
  ];
  const mod = (a, n) => ((a % n) + n) % n;
  // The palette name for a leaf centred at (x, y), `key` (a string) its own
  // dice.
  return function paletteAt([x, y], key) {
    let k = 0;
    for (let n = 0; n < key.length; n += 1)
      k = Math.imul(k + key.charCodeAt(n), 16777619);
    const px = x + SEAM_JITTER * size * (2 * hash01(salt + 3, k) - 1);
    const py = y + SEAM_JITTER * size * (2 * hash01(salt + 4, k) - 1);
    const ci = Math.floor(px / size);
    const cj = Math.floor(py / size);
    let best = null;
    let far = Infinity;
    for (let j = cj - 1; j <= cj + 1; j += 1) {
      for (let i = ci - 1; i <= ci + 1; i += 1) {
        const [sx, sy] = site(i, j);
        const d = (sx - px) ** 2 + (sy - py) ** 2;
        if (d < far) [best, far] = [[i, j], d];
      }
    }
    return order[mod(best[0] + 3 * best[1], order.length)].name;
  };
}
