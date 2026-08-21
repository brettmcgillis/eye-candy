import {
  GRADIENT_NAMES,
  hexLuminance,
  hexToHsl,
  hslToHex,
  resolvePaletteColors,
} from './palette';
import createRng, { combineSeed } from './rng';
import { GROWTH_BASE_RATE, MAX_BUNDLE_COUNT } from './testGenerator';

// Minimum gamma-space luma gap between the background and a palette stop for
// that stop to read as ink rather than as background.
const MIN_CONTRAST = 0.38;
const MAX_PALETTE_ATTEMPTS = 12;
// A gradient is accepted while at most a third of its stops are masked by the
// background. Zero-tolerance would reject most of gradients.json: plenty of
// palettes legitimately run edge to edge across the luma range, and a single
// buried stop out of six is invisible rather than ruinous.
const MASKED_STOP_TOLERANCE = 1 / 3;
const MAX_SEED = 999999;
// The LCG in rng.js is `state = 1664525 * seed + 1013904223`, so its first
// output barely moves between adjacent seeds — rolling 700, 701, 702... drew
// the same first value every time, pinning Bundle Count identically across a
// whole `--count N` batch. Hashing the seed through combineSeed decorrelates
// the roll stream; the test's own `seed` stays the raw number so it still
// round-trips through the Leva control.
const ROLL_SALT = 0x52;

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function range(rng, min, max) {
  return min + rng() * (max - min);
}

function snap(value, step, min, max) {
  const quantized = Math.round(value / step) * step;
  return Math.min(max, Math.max(min, Number(quantized.toFixed(4))));
}

function snapped(rng, min, max, step) {
  return snap(range(rng, min, max), step, min, max);
}

function chance(rng, probability) {
  return rng() < probability;
}

function rollFramingShape(rng) {
  const roll = rng();
  if (roll < 0.55) return 'cube';
  if (roll < 0.95) return 'sphere';
  return 'none';
}

function rollStructure(rng) {
  return {
    // Floor of 3: a one- or two-bundle test reads as a stray squiggle rather
    // than an ink blot.
    bundleCount: snapped(rng, 6, 20, 1),
    strandsPerBundle: snapped(rng, 25, 50, 1),
    steps: snapped(rng, 400, 2000, 1),
    startSpread: snapped(rng, 0.08, 0.7, 0.01),
    coeffRange: snapped(rng, 0.9, 2.2, 0.05),
    freq: snapped(rng, 0.25, 1.15, 0.05),
    framingShape: rollFramingShape(rng),
    boundRadius: snapped(rng, 15, 50, 1),
    boundWidth: snapped(rng, 20, 60, 1),
    boundHeight: snapped(rng, 20, 60, 1),
    minSpread: snapped(rng, 2, 9, 0.1),
  };
}

// Puts the background on whichever side of the palette has more empty luma
// room, then backs MIN_CONTRAST away from the nearest stop. Both bounds move
// in the same direction so the range can never invert at the extremes.
function chooseBackgroundLuminance(rng, stops) {
  const lo = Math.min(...stops);
  const hi = Math.max(...stops);

  if (lo >= 1 - hi) {
    const top = Math.max(0.02, lo - MIN_CONTRAST);
    return range(rng, Math.max(0, top - 0.1), top);
  }
  const bottom = Math.min(0.98, hi + MIN_CONTRAST);
  return range(rng, bottom, Math.min(1, bottom + 0.1));
}

function scorePalette(rng, name) {
  const colors = resolvePaletteColors(name);
  if (!colors || colors.length === 0) return null;

  const stops = colors.map(hexLuminance);
  const backgroundLuminance = chooseBackgroundLuminance(rng, stops);
  const masked = stops.filter(
    (l) => Math.abs(l - backgroundLuminance) < MIN_CONTRAST
  ).length;

  return {
    backgroundLuminance,
    colors,
    maskedRatio: masked / stops.length,
    name,
  };
}

function rollPalette(rng) {
  let best = null;
  for (let i = 0; i < MAX_PALETTE_ATTEMPTS; i += 1) {
    const candidate = scorePalette(rng, pick(rng, GRADIENT_NAMES));
    if (candidate && (!best || candidate.maskedRatio < best.maskedRatio)) {
      best = candidate;
    }
    if (best && best.maskedRatio <= MASKED_STOP_TOLERANCE) break;
  }
  return best;
}

function rollMonochromeStyle(rng) {
  const dark = chance(rng, 0.45);
  const hue = rng();
  const backgroundLuminance = dark
    ? range(rng, 0.03, 0.13)
    : range(rng, 0.86, 0.96);

  return {
    backgroundColor: hslToHex(hue, range(rng, 0.02, 0.12), backgroundLuminance),
    backgroundLuminance,
    colors: null,
    style: {
      inkColor: hslToHex(
        hue,
        range(rng, 0, 0.32),
        dark ? range(rng, 0.72, 0.92) : range(rng, 0.06, 0.2)
      ),
      monochrome: true,
      palette: 'Random',
      paletteExact: false,
      paletteShuffleSeed: 0,
    },
  };
}

function rollPaletteStyle(rng) {
  const chosen = rollPalette(rng);
  if (!chosen) return rollMonochromeStyle(rng);

  const anchor = hexToHsl(pick(rng, chosen.colors));

  return {
    backgroundColor: hslToHex(
      anchor.h,
      range(rng, 0.03, 0.16),
      chosen.backgroundLuminance
    ),
    backgroundLuminance: chosen.backgroundLuminance,
    colors: chosen.colors,
    style: {
      inkColor: hslToHex(anchor.h, 0.1, 0.12),
      monochrome: false,
      palette: chosen.name,
      paletteExact: chance(rng, 0.35),
      paletteShuffleSeed: chance(rng, 0.6)
        ? Math.floor(rng() * MAX_SEED) + 1
        : 0,
    },
  };
}

// Glow only earns its keep against a dark ground with saturated ink — on
// paper it just washes the stroke out.
function supportsEmissive(colors, backgroundLuminance) {
  if (!colors || backgroundLuminance >= 0.3) return false;
  const meanSaturation =
    colors.reduce((sum, hex) => sum + hexToHsl(hex).s, 0) / colors.length;
  return meanSaturation > 0.35;
}

function clearedOverrides() {
  const overrides = {};
  for (let i = 0; i < MAX_BUNDLE_COUNT; i += 1) {
    overrides[`bundle${i}Override`] = false;
  }
  return overrides;
}

function rollEmissiveOverrides(rng, { bundleCount, growthSpeed, steps }) {
  const overrides = clearedOverrides();

  // Enabling a bundle's Override folder also hands its Growth Duration to
  // resolveGrowthRate, which then ignores the global Growth Speed for that
  // bundle. Pinning it to the duration the global rate implies keeps a
  // glowing bundle growing in step with its siblings. The control's own
  // 0-15s range still clamps it at very slow Growth Speeds.
  const growthDuration =
    growthSpeed > 0
      ? snap(steps / (GROWTH_BASE_RATE * growthSpeed), 0.5, 0, 15)
      : 0;

  const available = Array.from({ length: bundleCount }, (unused, i) => i);
  const glowCount = 1 + Math.floor(rng() * Math.max(1, bundleCount / 3));
  for (let n = 0; n < glowCount && available.length > 0; n += 1) {
    const [index] = available.splice(Math.floor(rng() * available.length), 1);
    overrides[`bundle${index}Override`] = true;
    overrides[`bundle${index}Emissive`] = true;
    overrides[`bundle${index}EmissiveIntensity`] = snap(
      range(rng, 1.6, 4),
      0.1,
      1,
      5
    );
    overrides[`bundle${index}GrowthDuration`] = growthDuration;
  }
  return overrides;
}

export function randomSeed() {
  return Math.floor(Math.random() * MAX_SEED) + 1;
}

// Rolls a whole test — structure, style and a cohesive background — as one
// flat object keyed 1:1 with the Leva schema, i.e. a valid preset. `seed`
// drives the roll *and* becomes the test's own seed, so a single number
// reproduces the result exactly; the returned object is still fully
// hand-editable afterwards.
//
// Deliberately does not roll Flatten, Growth, Evolution, Camera or
// PostProcessing: those are "how it plays", not "what it is", and a video or
// cinematic sweep needs them to hold still across rolls.
export default function rollTestConfig(seed = randomSeed(), options = {}) {
  const { growthSpeed = 1 } = options;
  const rng = createRng(combineSeed(seed, ROLL_SALT));

  const structure = rollStructure(rng);
  const { backgroundColor, backgroundLuminance, colors, style } = chance(
    rng,
    0.35
  )
    ? rollMonochromeStyle(rng)
    : rollPaletteStyle(rng);

  const overrides =
    supportsEmissive(colors, backgroundLuminance) && chance(rng, 0.45)
      ? rollEmissiveOverrides(rng, {
          bundleCount: structure.bundleCount,
          growthSpeed,
          steps: structure.steps,
        })
      : clearedOverrides();

  return {
    seed,
    ...structure,
    ...style,
    backgroundColor,
    ...overrides,
  };
}
