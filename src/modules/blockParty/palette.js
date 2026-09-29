import { hexToRgb, rgbToHex, samplePalette } from '@utils/paletteStops';

import { COLOR_KEYS } from './renderOptions.mjs';

const ROLE_ORDER = { pit: 1, plaza: 1 / 3, stair: 2 / 3, tower: 0 };
const MIN_AREA = 16;

const luminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function saturation(rgb) {
  const max = Math.max(...rgb);
  const min = Math.min(...rgb);
  return max === 0 ? 0 : (max - min) / max;
}

function mixRgb(a, b, t) {
  return a.map((c, i) => c + (b[i] - c) * t);
}

// A palette's surfaces are read off its tones: the lightest stop is the paper,
// the darkest the ink, and the most saturated stops the accents, so the
// sketch's print logic survives any palette.
export function paletteRoles(stops) {
  const rgb = stops.map(hexToRgb);
  const byTone = [...rgb].sort((a, b) => luminance(a) - luminance(b));
  const dark = byTone[0];
  const light = byTone[byTone.length - 1];
  const mid =
    byTone.length > 2
      ? byTone[Math.floor(byTone.length / 2)]
      : mixRgb(dark, light, 0.5);
  const accents = [...rgb].sort((a, b) => saturation(b) - saturation(a));
  const accent = (i) => accents[i % accents.length];
  const shade = (t) => mixRgb(light, dark, t);
  const roles = {
    cardColor: light,
    cardEdgeColor: shade(0.12),
    glowFloorColor: mixRgb(dark, accent(0), 0.25),
    groundColor: light,
    neonAmberColor: accent(2),
    neonCyanColor: accent(1),
    neonMagentaColor: accent(0),
    patternColor: shade(0.15),
    pedestalColor: light,
    pitColor: dark,
    pitFloorColor: mixRgb(dark, [0, 0, 0], 0.5),
    pitRimColor: shade(0.25),
    pitStrataColor: mixRgb(dark, light, 0.2),
    ringColor: accent(0),
    stairHighColor: shade(0.2),
    stairLowColor: dark,
    towerBaseColor: mixRgb(dark, mid, 0.5),
    towerColor: dark,
    wellFloorColor: dark,
    wellWallColor: shade(0.15),
  };

  return Object.fromEntries(
    Object.entries(roles).map(([key, value]) => [key, rgbToHex(value)])
  );
}

// The colour every surface key ends up with: its authored colour moved
// `paletteSurfaces` of the way to the palette's role. No stops = authored.
export function resolveSurfaceColors(config, stops) {
  const roles = stops ? paletteRoles(stops) : null;
  const amount = roles ? (config.paletteSurfaces ?? 1) : 0;

  const surfaces = Object.fromEntries(
    COLOR_KEYS.map((key) => {
      const authored = config[key];
      if (!roles || amount <= 0) return [key, authored];
      return [
        key,
        rgbToHex(mixRgb(hexToRgb(authored), hexToRgb(roles[key]), amount)),
      ];
    })
  );

  return { ...surfaces, backgroundColor: config.backgroundColor };
}

function cellHash(cell) {
  const value =
    Math.sin(cell.rect.x * 12.9898 + cell.rect.y * 78.233) * 43758.5453;

  return value - Math.floor(value);
}

const clamp01 = (t) => Math.min(1, Math.max(0, t));

// Where a cell sits on the palette, before shift/repeat. The shader and the
// SVG both map this through paletteCoordinate.
export function cellTone(colorBy, { districtCount, radius }) {
  const centre = (cell) => ({
    x: cell.footprint.x + cell.footprint.w / 2,
    y: cell.footprint.y + cell.footprint.h / 2,
  });
  const maxArea = (radius * 2) ** 2;

  switch (colorBy) {
    case 'radial':
      return (cell) => {
        const { x, y } = centre(cell);
        return clamp01(Math.hypot(x, y) / radius);
      };
    case 'size':
      return (cell) =>
        clamp01(
          Math.log(Math.max(cell.area, MIN_AREA) / MIN_AREA) /
            Math.log(maxArea / MIN_AREA)
        );
    case 'random':
      return cellHash;
    case 'x':
      return (cell) => clamp01((centre(cell).x / radius + 1) / 2);
    case 'y':
      return (cell) => clamp01((centre(cell).y / radius + 1) / 2);
    case 'role':
      return (cell) => ROLE_ORDER[cell.role] ?? 0;
    default:
      return (cell) => (cell.district + 0.5) / Math.max(districtCount, 1);
  }
}

// The palette LUT wraps mirrored, so a shifted or repeated tone folds back
// through the gradient instead of snapping to an end.
export function paletteCoordinate(
  tone,
  { paletteRepeat = 1, paletteReverse = false, paletteShift = 0 } = {}
) {
  const u = tone * paletteRepeat + paletteShift;
  const folded = ((u % 2) + 2) % 2;
  const mirrored = folded > 1 ? 2 - folded : folded;
  return paletteReverse ? 1 - mirrored : mirrored;
}

export function cellColor(stops, tone, config) {
  return rgbToHex(
    samplePalette(
      stops,
      paletteCoordinate(tone, config),
      config.paletteExact ?? true
    )
  );
}

export const CELL_TARGETS = {
  accents: { accents: 1, cards: 0, towers: 0 },
  all: { accents: 1, cards: 1, towers: 1 },
  cards: { accents: 0, cards: 1, towers: 0 },
  none: { accents: 0, cards: 0, towers: 0 },
  towers: { accents: 0, cards: 0, towers: 1 },
};
