import {
  ROLLABLE_GRADIENT_NAMES,
  hexLuminance,
  hexToHsl,
  hslToHex,
  resolvePaletteColors,
} from './palette';
import { RENDER_OPTIONS } from './renderOptions.mjs';
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
// One stream per facet, not one for the whole roll. A single sequential stream
// makes every draw depend on every draw before it, so holding the structure
// while varying the palette is impossible — and appending a new roll anywhere
// re-rolls every seed that came before. Separate salts make each facet
// independently seedable, which is what "one test in a hundred palettes" is.
const FACET_SALTS = {
  ink: 0x9d,
  palette: 0x7b,
  structure: 0x52,
};

// The art-directed window for every rollable parameter — the min/max/step that
// used to be arguments to inline `snapped()` calls. As data it can be read by
// the UIs, checked, and extended without touching the roll itself.
//
// Distinct from the validation range in renderOptions.mjs: that says what the
// renderer will accept, this says what is worth looking at. A parameter absent
// from this table is never rolled, which is how "how it plays" (camera, growth,
// evolution, post, sim resolution) stays put across a batch.
// The art-directed windows live on the option specs themselves, next to the
// validation range each parameter already had — `min`/`max` is what the
// renderer will accept, `roll` is what is worth looking at. Grouped here by
// facet so the roll stays a walk over data, without giving the schema a second
// home to drift from.
//
// A spec with a `facet` is rollable, and therefore pinnable. One with a `roll`
// block is drawn from that window; one without (framingShape, palette,
// monochrome) is rolled by the bespoke logic below, because a gradient name is
// not a number. A spec with no facet at all is never rolled — that is how
// camera, growth, evolution, post and the sim's resolution hold still across a
// batch, expressed as data rather than as a comment.
export const ROLL_RANGES = Object.entries(RENDER_OPTIONS).reduce(
  (facets, [key, spec]) =>
    spec.facet && spec.roll
      ? { ...facets, [spec.facet]: { ...facets[spec.facet], [key]: spec.roll } }
      : facets,
  {}
);

// Cell pixelation is a strong stylistic move rather than a dial that wants a
// value on every test, so it is gated the way emissive bundles already are:
// mostly absent, and inside its window when present.
const CELL_CHANCE = 0.35;
const CELL_KEYS = [
  'inkCellAmount',
  'inkCellReveal',
  'inkCellRevealScale',
  'inkCellScale',
  'inkCellSymmetry',
];
const CELL_RANGES = Object.fromEntries(
  CELL_KEYS.map((key) => [key, RENDER_OPTIONS[key].roll])
);
// The rest of the ink facet, drawn every time.
const INK_RANGES = Object.fromEntries(
  Object.entries(ROLL_RANGES.ink ?? {}).filter(
    ([key]) => !CELL_KEYS.includes(key)
  )
);

// Likewise for the ink's own bloom, which only means anything when a bundle is
// emissive to drive it.
const INK_BLOOM_CHANCE = 0.5;
const INK_BLOOM_RANGE = RENDER_OPTIONS.inkBloomStrength.roll ?? {
  max: 0.9,
  min: 0.2,
  step: 0.05,
};

// Every parameter the dice can set, and so every parameter a caller may pin.
// Narrowed to one facet, it is also the set a live editor needs in order to
// re-roll that facet alone and leave everything else exactly as it was.
export function rollableKeys(facet) {
  return new Set(
    Object.entries(RENDER_OPTIONS)
      .filter(([, spec]) => spec.facet && (!facet || spec.facet === facet))
      .map(([key]) => key)
  );
}

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

// Draws every parameter in a range table. Key order is the draw order, so a
// table is also the stream's contract.
function rollRanges(rng, ranges) {
  const rolled = {};
  Object.entries(ranges).forEach(([key, { max, min, step }]) => {
    rolled[key] = snapped(rng, min, max, step);
  });
  return rolled;
}

function rollStructure(rng) {
  return {
    ...rollRanges(rng, ROLL_RANGES.structure),
    framingShape: rollFramingShape(rng),
  };
}

// The ink's own facet. `emissive` is not one: it is rolled with the palette,
// because whether a bundle can glow at all depends on that palette's contrast
// against the background it was chosen with.
function rollInk(rng, { hasEmissive }) {
  const cells = chance(rng, CELL_CHANCE)
    ? rollRanges(rng, CELL_RANGES)
    : { inkCellAmount: 0 };

  const bloom = hasEmissive && chance(rng, INK_BLOOM_CHANCE);

  return {
    ...rollRanges(rng, INK_RANGES),
    ...cells,
    inkBloom: bloom,
    inkBloomStrength: bloom
      ? snapped(
          rng,
          INK_BLOOM_RANGE.min,
          INK_BLOOM_RANGE.max,
          INK_BLOOM_RANGE.step
        )
      : 0.4,
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
    const candidate = scorePalette(rng, pick(rng, ROLLABLE_GRADIENT_NAMES));
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
// Rolls a whole test — structure, style, ink and a cohesive background — as one
// flat object keyed 1:1 with the Leva schema, i.e. a valid preset.
//
// Three independent facets, each with its own seed. Passing only `seed` seeds
// all three from it, so one number still reproduces a whole test; passing a
// facet's seed holds that facet still while the others move, which is what
// makes "the same blot in a hundred palettes" a single command.
//
// `pinned` is whatever the caller set explicitly. Those keys are never rolled
// and are copied through verbatim — the one rule the CLI, the workbench and
// Leva all share, so "I chose this" always beats "the dice chose that".
//
// Deliberately does not roll Flatten, Growth, Evolution, Camera, PostProcessing
// or the sim's resolution: those are "how it plays", not "what it is", and a
// batch needs them to hold still. That is expressed by their absence from
// ROLL_RANGES rather than by omission here.
// `bundles` arrives as one object because three hundred flat keys is not a
// command line, but a config is flat — it has to be a valid preset, readable
// straight back into the scene's Leva schema. So the pin is expanded here, and
// over a cleared block: pinning the overrides means those overrides and no
// others, the same way pinning a palette means that palette.
function expandBundlePin(pinned) {
  const { bundles, ...rest } = pinned;
  return {
    overrides: bundles ? { ...clearedOverrides(), ...bundles } : null,
    pins: rest,
  };
}

export default function rollTestConfig(seed = randomSeed(), options = {}) {
  const { growthSpeed = 1, pinned = {}, seeds = {} } = options;
  const { overrides: pinnedOverrides, pins } = expandBundlePin(pinned);

  const streamFor = (facet) =>
    createRng(combineSeed(seeds[facet] ?? seed, FACET_SALTS[facet]));

  const structure = rollStructure(streamFor('structure'));

  const paletteRng = streamFor('palette');
  const { backgroundColor, backgroundLuminance, colors, style } = chance(
    paletteRng,
    0.35
  )
    ? rollMonochromeStyle(paletteRng)
    : rollPaletteStyle(paletteRng);

  const hasEmissive =
    supportsEmissive(colors, backgroundLuminance) && chance(paletteRng, 0.45);
  const overrides = hasEmissive
    ? rollEmissiveOverrides(paletteRng, {
        bundleCount: pins.bundleCount ?? structure.bundleCount,
        growthSpeed,
        steps: pins.steps ?? structure.steps,
      })
    : clearedOverrides();

  const ink = rollInk(streamFor('ink'), { hasEmissive });

  return {
    seed,
    ...structure,
    ...style,
    backgroundColor,
    ...(pinnedOverrides ?? overrides),
    ...ink,
    ...pins,
  };
}
