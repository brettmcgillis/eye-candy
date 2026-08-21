/* eslint-disable no-param-reassign */
// Writes into caller-owned buffers throughout (mirrorInto) so evolution
// ticks never reallocate trajectory data — same pattern as
// utils/odeIntegrator.js.
import findBoundedCoeffs from './formulaBuilder';
import {
  DEFAULT_BOUND_HEIGHT,
  DEFAULT_BOUND_RADIUS,
  DEFAULT_BOUND_WIDTH,
  DEFAULT_MIN_SPREAD,
  boundsScale,
  integrate,
  isBounded,
  stepRK4,
} from './odeIntegrator';
import {
  hexToHsl,
  pickGradientColorHsl,
  resolvePaletteColors,
  sampleGradientHsl,
} from './palette';
import createRng, { combineSeed } from './rng';

export const DEFAULT_FRAMING_SHAPE = 'cube';
// Shared with the Bundle Editor's per-bundle slot generator (see
// hooks/buildBundleOverrideSchema.js) — that schema is static (not rebuilt
// when Bundle Count changes), so both need the same fixed ceiling.
export const MAX_BUNDLE_COUNT = 20;

// Leva-tunable defaults (see hooks/useSceneControls.js's Test folder).
export const DEFAULT_BUNDLE_COUNT = 4;
export const DEFAULT_STRANDS_PER_BUNDLE = 9;
// 220 steps @ DT=0.02 is only ~4.4 simulated time-units — not enough for a
// bounded field to loop/curl around itself more than once or twice, which
// read as "simple curves" rather than the reference's complex, curling
// strokes. 600 gives roughly 3x the winding time at the same cost per step.
export const DEFAULT_STEPS = 600;
export const DEFAULT_START_SPREAD = 0.35;
export const DEFAULT_COEFF_RANGE = 1.6;
// Shared "curl tightness" scalar inside every trig term's argument — see
// odeIntegrator.js's evalAxis. Period of a single term is 2π/freq; 0.6 gives
// a full curl roughly every ~10 units, visible within the bundle's typical
// excursion range without looking like noise.
export const DEFAULT_FREQ = 0.6;

// Steps/second a bundle reveals at Growth Speed = 1 — DEFAULT_STEPS (600)
// over the old default growthDuration (4s), so the new default (Growth
// Speed 1) reads the same as the old one did. Lives here rather than in
// Test.jsx because utils/rollConfig.js needs it too: a rolled per-bundle
// override has to pin its own Growth Duration back to whatever this rate
// implies, or enabling the override silently re-paces that bundle.
export const GROWTH_BASE_RATE = 150;

const DT = 0.02;
// Fraction of the bounds' own scale (see odeIntegrator.js's boundsScale) that
// bundle origins scatter within — proportional rather than a fixed [3,2,2]
// box so origins stay well inside whatever radius/width/height the user
// picks instead of risking starting outside a small custom bound.
const ORIGIN_SPREAD_FRACTION = 0.06;
const TARGET_RADIUS = 7;
// The trig basis is bounded by construction, so in practice a candidate
// either passes on the first attempt or is a rare edge case — measured
// average is ~1.0 attempts at realistic settings. This is a safety net for
// that rare case, not the normal path, so it doesn't need to be large.
const MAX_BUNDLE_ATTEMPTS = 8;
// The retry loop's own validation pass is capped independently of the
// user-facing `steps` slider — it only needs enough length to tell "stays
// bounded" from "diverges/collapses," not the full curl detail. At large
// `steps` (this scene's own saved preset uses 2000) validating at full
// length on every one of up to MAX_BUNDLE_ATTEMPTS retries was the direct
// cause of multi-second control-change freezes (todo.md: "scene locks the
// browser on control changes"). The rest of each strand out to the full
// `steps` is grown incrementally, a little per frame — see growBundle.
const VALIDATION_STEPS_CAP = 300;
// Distinct salt so the "no override, no palette" random-hue color path has
// its own independent stream, separate from the structural RNG (origin,
// formula search) — see computeBundleColor. Keeps color generation entirely
// decoupled from shape generation now that they're computed by separate
// functions with separate (and very different cost) call sites.
const COLOR_SALT = 7;
// Separate salt for the palette-shuffle RNG stream — see paletteShuffledT.
const PALETTE_SHUFFLE_SALT = 11;

function mirrorInto(points, out) {
  for (let i = 0; i < points.length; i += 3) {
    out[i] = -points[i];
    out[i + 1] = points[i + 1];
    out[i + 2] = points[i + 2];
  }
}

// Reused across every growBundle call — no per-step allocation.
const stepScratch = [0, 0, 0];

// formulaBuilder's findBoundedCoeffs only checks a single probe point (the
// bundle's origin) — cheap, but a real strand seeded startSpread away can
// still escape even when the origin trajectory doesn't (these are chaotic
// fields; nearby starts diverge). So the authoritative check integrates
// every *real* strand and requires all of them to stay bounded, retrying
// with fresh coefficients when they don't — but only for VALIDATION_STEPS_CAP
// steps, not the full (possibly 2000+) `steps`. isBounded is scoped to that
// written prefix via subarray, same reasoning as formulaBuilder.js's probe.
// This pass's integration isn't thrown away on acceptance: buildBundle seeds
// the bundle's `grownSteps` cursor from it directly, and also reuses its
// per-point distances to size the display scale — see generateStructure —
// rather than requiring a separate full-length pass just to measure it.
function validateAndMeasure(
  coeffs,
  startPoints,
  strands,
  steps,
  freq,
  bounds,
  minSpread
) {
  const validationSteps = Math.min(steps, VALIDATION_STEPS_CAP);
  let maxDist = 0;
  let ok = true;
  const endpoints = [];
  // Every strand is integrated and measured even once one has failed, rather
  // than bailing on the first. buildBundle has to hand *something* usable back
  // when all MAX_BUNDLE_ATTEMPTS candidates fail — growBundle steps from
  // `bundle.current[s]` per strand, so a short endpoints array is a crash, not
  // a degraded bundle. Failing candidates are still rejected while retries
  // remain; this only decides what the last one leaves behind.
  for (let s = 0; s < startPoints.length; s += 1) {
    const strand = strands[s * 2];
    integrate(
      coeffs,
      startPoints[s],
      validationSteps,
      DT,
      freq,
      bounds,
      strand
    );
    const view = strand.subarray(0, validationSteps * 3);
    if (!isBounded(view, bounds, minSpread)) ok = false;

    for (let i = 0; i < view.length; i += 3) {
      const dist = Math.hypot(view[i], view[i + 1], view[i + 2]);
      if (dist > maxDist) maxDist = dist;
    }
    const last = (validationSteps - 1) * 3;
    endpoints.push([view[last], view[last + 1], view[last + 2]]);
  }
  return { ok, maxDist, validationSteps, endpoints };
}

// Structural generation: coefficients + trajectories only, no color/
// visibility/growth-delay. This is the expensive half (ODE search + RK4
// integration) — deliberately has no dependency on monochrome/inkColor/
// palette/overrides, so tweaking any of those never re-runs it. Each bundle
// gets its own independent RNG stream (combineSeed(seed, id)) rather than
// sharing one sequential stream, so bundleCount/strandsPerBundle changes
// don't reshuffle bundles that already existed.
//
// Does NOT fully integrate every strand out to `steps` — only validates up
// to VALIDATION_STEPS_CAP and leaves the rest of each buffer zeroed.
// `bundle.grownSteps` starts at that validated length (not 1: the
// validation pass's own integration is real, correct data, not thrown
// away), and growBundle() below advances it the rest of the way — spread
// across frames by the caller, not all in this one synchronous call. This
// is what turns a multi-second blocking freeze on every control change into
// a real, incremental, never-blocking growth animation.
function buildBundle(seed, id, options) {
  const {
    strandsPerBundle,
    steps,
    startSpread,
    coeffRange,
    freq,
    bounds,
    minSpread,
  } = options;
  const rng = createRng(combineSeed(seed, id));
  const originSpread = boundsScale(bounds) * ORIGIN_SPREAD_FRACTION;

  const origin = [
    (rng() * 2 - 1) * originSpread,
    (rng() * 2 - 1) * originSpread,
    (rng() * 2 - 1) * originSpread,
  ];

  const startPoints = [];
  const strands = [];
  for (let s = 0; s < strandsPerBundle; s += 1) {
    startPoints.push([
      origin[0] + (rng() * 2 - 1) * startSpread,
      origin[1] + (rng() * 2 - 1) * startSpread,
      origin[2] + (rng() * 2 - 1) * startSpread,
    ]);
    strands.push(new Float32Array(steps * 3), new Float32Array(steps * 3));
  }

  let coeffs = findBoundedCoeffs(
    rng,
    origin,
    coeffRange,
    steps,
    freq,
    bounds,
    minSpread
  );
  let result = validateAndMeasure(
    coeffs,
    startPoints,
    strands,
    steps,
    freq,
    bounds,
    minSpread
  );
  let attempts = 0;
  while (!result.ok && attempts < MAX_BUNDLE_ATTEMPTS) {
    coeffs = findBoundedCoeffs(
      rng,
      origin,
      coeffRange,
      steps,
      freq,
      bounds,
      minSpread
    );
    result = validateAndMeasure(
      coeffs,
      startPoints,
      strands,
      steps,
      freq,
      bounds,
      minSpread
    );
    attempts += 1;
  }

  // Backfill the mirror strand for the validated prefix the accepted
  // candidate's strand already holds (only the primary strand was written
  // above) — growBundle keeps both in sync for everything after this.
  for (let s = 0; s < strandsPerBundle; s += 1) {
    const view = strands[s * 2].subarray(0, result.validationSteps * 3);
    mirrorInto(
      view,
      strands[s * 2 + 1].subarray(0, result.validationSteps * 3)
    );
  }

  return {
    id,
    coeffs,
    // Independent snapshot (not a reference to coeffs' arrays) of the
    // validated, known-bounded coefficients — evolution.js's drift pulls
    // `coeffs` back toward this over time rather than letting it wander
    // away from a configuration that was actually verified to work.
    originalCoeffs: {
      dx: coeffs.dx.slice(),
      dy: coeffs.dy.slice(),
      dz: coeffs.dz.slice(),
    },
    startPoints,
    strands,
    steps,
    freq,
    bounds,
    grownSteps: result.validationSteps,
    // Full float64 stepping state per strand, carried forward by growBundle
    // independently of the (float32) render buffer — see growBundle's own
    // comment for why this matters.
    current: result.endpoints,
    maxDist: result.maxDist,
  };
}

// Advances a bundle's growth by up to `maxNewSteps` more RK4 steps (fewer if
// that would exceed `bundle.steps`), continuing from wherever grownSteps
// left off — never re-walks steps that already exist. Called from Test.jsx's
// useFrame with a small per-frame budget, not all at once. Returns how many
// new steps were actually computed (0 once fully grown).
//
// Steps from `bundle.current` (float64), not by reading the last point back
// out of the (float32) strand buffer. Growth is split across many separate
// calls, one small chunk per frame — reading the running position back from
// a Float32Array at every chunk boundary would round it to float32 on every
// single call, and this is a chaotic system: those roundings compound over
// dozens of chunks into a visibly different final shape, and worse, one that
// depends on how growth happened to get chunked (framerate/hardware), not
// just on the seed. Carrying the true float64 position forward in
// `bundle.current` keeps growth's result independent of how it was paced —
// same seed always grows into the same beast, regardless of frame timing.
export function growBundle(bundle, maxNewSteps) {
  const targetStep = Math.min(bundle.steps, bundle.grownSteps + maxNewSteps);
  const newStepsCount = targetStep - bundle.grownSteps;
  if (newStepsCount <= 0) return 0;

  for (let s = 0; s < bundle.startPoints.length; s += 1) {
    const strand = bundle.strands[s * 2];
    const mirror = bundle.strands[s * 2 + 1];
    const current = bundle.current[s];
    let x = current[0];
    let y = current[1];
    let z = current[2];

    for (let i = bundle.grownSteps; i < targetStep; i += 1) {
      stepRK4(
        bundle.coeffs,
        x,
        y,
        z,
        DT,
        bundle.freq,
        bundle.bounds,
        stepScratch
      );
      [x, y, z] = stepScratch;

      const o = i * 3;
      strand[o] = x;
      strand[o + 1] = y;
      strand[o + 2] = z;
      mirror[o] = -x;
      mirror[o + 1] = y;
      mirror[o + 2] = z;
    }

    current[0] = x;
    current[1] = y;
    current[2] = z;
  }

  bundle.grownSteps = targetStep;
  return newStepsCount;
}

// A bundle's structural override (Bundle Editor's "Structural Override"
// toggle) pins it to its own startSpread/coeffRange/freq/bounds, immune to
// sweeps of the global values — same as Color Override already is to
// monochrome/palette. Falls back to the global bundleOptions per field.
function resolveBundleOptions(globalOptions, override) {
  if (!override || !override.structuralOverride) return globalOptions;
  return {
    ...globalOptions,
    startSpread: override.startSpread ?? globalOptions.startSpread,
    coeffRange: override.coeffRange ?? globalOptions.coeffRange,
    freq: override.freq ?? globalOptions.freq,
    bounds: {
      shape: override.framingShape ?? globalOptions.bounds.shape,
      radius: override.boundRadius ?? globalOptions.bounds.radius,
      width: override.boundWidth ?? globalOptions.bounds.width,
      height: override.boundHeight ?? globalOptions.bounds.height,
    },
  };
}

// Identifies a bundle's structural inputs (not id/seed — those are checked
// separately in generateStructure) well enough to tell "needs rebuilding"
// from "identical to last time." JSON.stringify is fine here: this runs
// once per bundle per structural-relevant control change, not per frame.
function fingerprintBundleOptions(resolvedOptions) {
  return JSON.stringify({
    strandsPerBundle: resolvedOptions.strandsPerBundle,
    steps: resolvedOptions.steps,
    startSpread: resolvedOptions.startSpread,
    coeffRange: resolvedOptions.coeffRange,
    freq: resolvedOptions.freq,
    bounds: resolvedOptions.bounds,
    minSpread: resolvedOptions.minSpread,
  });
}

// Generates the structural half of a beast: `bundleCount` bundles, each
// `strandsPerBundle` mirrored stroke pairs (bilateral symmetry across X=0,
// the classic Rorschach fold). Returns a display `scale` rather than baking
// it into the points, so evolution's re-integration always happens in the
// ODE's own unscaled space — sized from each bundle's validation-pass
// maxDist (an estimate from the first VALIDATION_STEPS_CAP steps, not the
// full trajectory, since the full trajectory doesn't exist synchronously
// anymore) rather than a full measurement pass.
//
// `previousBundles`, when given, lets bundles survive across calls: any
// bundle whose seed and effective structural inputs are unchanged from last
// time is reused by reference (same coeffs, grownSteps, evolution state)
// instead of rebuilt — otherwise every Bundle Editor structural-override
// edit would regenerate and re-grow the *entire* beast, snapping every
// other bundle's evolution progress back to its pristine start. Only
// `overrides[i].structuralOverride` bundles, or ones whose global inputs
// actually changed, get rebuilt; everything else keeps its object identity
// (and Test.jsx relies on that identity check to know what to reset).
export function generateStructure(seed, options = {}, previousBundles = null) {
  const {
    bundleCount = DEFAULT_BUNDLE_COUNT,
    strandsPerBundle = DEFAULT_STRANDS_PER_BUNDLE,
    steps = DEFAULT_STEPS,
    startSpread = DEFAULT_START_SPREAD,
    coeffRange = DEFAULT_COEFF_RANGE,
    freq = DEFAULT_FREQ,
    framingShape = DEFAULT_FRAMING_SHAPE,
    boundRadius = DEFAULT_BOUND_RADIUS,
    boundWidth = DEFAULT_BOUND_WIDTH,
    boundHeight = DEFAULT_BOUND_HEIGHT,
    minSpread = DEFAULT_MIN_SPREAD,
    overrides = {},
  } = options;

  const globalBundleOptions = {
    strandsPerBundle,
    steps,
    startSpread,
    coeffRange,
    freq,
    bounds: {
      shape: framingShape,
      radius: boundRadius,
      width: boundWidth,
      height: boundHeight,
    },
    minSpread,
  };

  const bundles = [];
  let maxDist = 0;
  for (let i = 0; i < bundleCount; i += 1) {
    const resolvedOptions = resolveBundleOptions(
      globalBundleOptions,
      overrides[i]
    );
    const fingerprint = fingerprintBundleOptions(resolvedOptions);
    const prev = previousBundles && previousBundles[i];

    const bundle =
      prev && prev.seed === seed && prev.structuralFingerprint === fingerprint
        ? prev
        : buildBundle(seed, i, resolvedOptions);
    bundle.seed = seed;
    bundle.structuralFingerprint = fingerprint;

    if (bundle.maxDist > maxDist) maxDist = bundle.maxDist;
    bundles.push(bundle);
  }

  const scale = maxDist > 0 ? TARGET_RADIUS / maxDist : 1;

  return { bundles, scale, steps, strandsPerBundle };
}

// `paletteColors`/`t` (bundle position 0-1 across the beast) sample a named
// gradient from gradients.json instead of a random hue when a palette is
// selected — see utils/palette.js. `paletteExact` switches that sampling
// from a blended gradient (sampleGradientHsl) to the palette's literal hex
// stops (pickGradientColorHsl). Falls back to the original random-hue
// behavior when no palette is chosen ('Random' in the Leva dropdown), using
// its own independent RNG stream (COLOR_SALT) rather than sharing the
// structural one. `inkColor` is the monochrome-mode override, `override` the
// Bundle Editor's entry for this index (or {}).
function computeBundleColor(
  seed,
  id,
  monochrome,
  inkColor,
  paletteColors,
  paletteExact,
  t,
  override
) {
  if (override.colorOverride) return hexToHsl(override.color);
  if (monochrome) return hexToHsl(inkColor);
  if (paletteColors) {
    return paletteExact
      ? pickGradientColorHsl(paletteColors, t)
      : sampleGradientHsl(paletteColors, t);
  }
  const rng = createRng(combineSeed(seed, id, COLOR_SALT));
  return { h: rng(), s: 0.55 + rng() * 0.3, l: 0.35 + rng() * 0.15 };
}

// Evenly-spaced t always samples the same bundleCount positions along a
// palette, so a gradient with more stops than there are bundles (a real
// case — some lospec palettes run past MAX_BUNDLE_COUNT) never shows most
// of its colors, and bundle 0 always gets the coolest one. `paletteShuffleSeed`
// (0 = unshuffled, the Style folder's "Shuffle Palette Colors" button rerolls
// it) swaps that for an independent random t per bundle — reproducible for a
// given seed/bundleCount, so it round-trips through presets like everything
// else, but samples a different slice of the palette every reroll.
function paletteShuffledT(shuffleSeed, i) {
  return createRng(combineSeed(shuffleSeed, i, PALETTE_SHUFFLE_SALT))();
}

// Style generation: color/visibility/growth-delay for `bundleCount` bundles.
// No ODE math at all — safe to recompute on every keystroke of monochrome/
// inkColor/palette/Bundle Editor changes without the cost generateStructure
// has. `overrides` is the Bundle Editor's map of bundle-index -> per-bundle
// art-direction overrides, applied on top of otherwise-normal styling.
export function computeStyles(seed, bundleCount, options = {}) {
  const {
    monochrome = false,
    inkColor = '#1f1f1f',
    palette = 'Random',
    paletteExact = false,
    paletteShuffleSeed = 0,
    overrides = {},
  } = options;
  const paletteColors = resolvePaletteColors(palette);

  const evenT = bundleCount > 1 ? 1 / (bundleCount - 1) : 0;

  const styles = [];
  for (let i = 0; i < bundleCount; i += 1) {
    const t = paletteShuffleSeed
      ? paletteShuffledT(paletteShuffleSeed, i)
      : i * evenT;
    const override = overrides[i] || {};
    styles.push({
      color: computeBundleColor(
        seed,
        i,
        monochrome,
        inkColor,
        paletteColors,
        paletteExact,
        t,
        override
      ),
      visible: override.visible !== false,
      growthDelay: override.growthDelay || 0,
      emissive: override.emissive || false,
      emissiveIntensity: override.emissiveIntensity || 2,
    });
  }
  return styles;
}
