import {
  Fn,
  abs,
  dot,
  float,
  floor,
  fract,
  max,
  mix,
  sin,
  smoothstep,
  uniform,
  uv,
  vec2,
  vec3,
  vec4,
} from 'three/tsl';

// The classic Rorschach pattern, ported from the WebGL shader behind the
// RorschachCLI dev page. It is a five-octave gradient-noise fBm whose *third*
// dimension is time, so the field evolves in place rather than scrolling, and
// whose x is mirrored so the result is bilaterally symmetric like a folded
// sheet. Thresholding it produces the two-tone blot the dev page draws.
//
// `computeField` returns two reads of the same field, and the difference
// between them matters:
//
//   intensity  thresholded for display, at the caller's Sharpness. This is the
//              blot you see on the dev page.
//   wash       the same value ramped over a deliberately wide, fixed band.
//              This is what the watercolour sim reads.
//
// They are separate because Sharpness 0.95 — the default, and the value that
// makes the drawn blot look like a Rorschach card at all — maps to a smoothstep
// band of 0.0026. That is a step function. Feeding it to the sim handed the
// fluid a hard silhouette as both its pigment source and its wet mask, so there
// was no gradient anywhere for the fluid to act on: bleed, pooling, edge
// darkening and granulation were all mathematically unreachable, and Flow could
// be run from 0 to 1 without changing the picture. The physics needs a
// concentration gradient — strong at the blot's core, falling off through its
// edge — which is what `wash` is.

const SEED_A = vec3(31.06, 19.86, 30.19);
const SEED_B = vec3(6640.0, 5790.4, 10798.861);

const OCTAVES = 5;
const BASE_AMPLITUDE = 0.5;
const BASE_SCALE = 2.5;
const SCALE_STEP = 2.3;

function randomVector(point) {
  return fract(sin(dot(point, SEED_A)).mul(SEED_B)).sub(0.5);
}

// Gradient (Perlin) noise: the dot of a per-lattice-corner random vector with
// the offset to that corner, quintically interpolated across the cell.
function gradientNoise(coordinates) {
  const base = floor(coordinates);
  const offset = fract(coordinates);

  const cornerNoise = (dx, dy, dz) => {
    const corner = base.add(vec3(dx, dy, dz));
    return dot(randomVector(corner), coordinates.sub(corner));
  };

  const t = offset
    .mul(offset)
    .mul(offset)
    .mul(offset.mul(offset.mul(6).sub(15)).add(10));

  const x00 = mix(cornerNoise(0, 0, 0), cornerNoise(1, 0, 0), t.x);
  const x01 = mix(cornerNoise(0, 0, 1), cornerNoise(1, 0, 1), t.x);
  const x10 = mix(cornerNoise(0, 1, 0), cornerNoise(1, 1, 0), t.x);
  const x11 = mix(cornerNoise(0, 1, 1), cornerNoise(1, 1, 1), t.x);

  return mix(mix(x00, x10, t.y), mix(x01, x11, t.y), t.z);
}

function layeredNoise(coordinates, details) {
  let result = float(0);
  let amplitude = BASE_AMPLITUDE;
  let scale = BASE_SCALE;

  for (let index = 0; index < OCTAVES; index += 1) {
    result = result.add(
      gradientNoise(coordinates.mul(scale))
        .mul(amplitude)
        .mul(smoothstep(0, 1, details.sub(index)))
    );
    amplitude *= 0.5;
    scale *= SCALE_STEP;
  }
  return result;
}

// Square-grid quantization: sample the blot at the centre of a cell so its
// value is constant across the whole cell. This is what reads as pixels — hard
// right angles and stair-stepped edges. A Worley/Voronoi decomposition gives
// irregular polygons instead, which look faceted and crystalline but contain no
// right angles at all, so they do not read as pixelation.
//
// The grid is rigid on purpose; the reveal field is what keeps the effect
// organic, by deciding where the pixels appear rather than making the pixels
// themselves irregular. Kept in step with the dev page's GLSL copy in
// dev/tools/rorschach/components/ClassicPatternBackground.jsx.
function quantizeToCells(coords, cellScale) {
  return floor(coords.mul(cellScale)).add(0.5).div(cellScale);
}

// The blot itself, at an already-centred coordinate.
function intensityAt(centred, uniforms) {
  const scaled = centred.mul(uniforms.patternScale);

  const rorschach = vec3(
    abs(scaled.x),
    scaled.y.add(uniforms.patternSeed),
    uniforms.patternTime.mul(0.02)
  );
  const blot = layeredNoise(rorschach, uniforms.patternDetails).add(0.5);

  // A little asymmetric detail, faded out as symmetry goes to 1 and
  // concentrated near the fold — the dev page's "support" term.
  const support = gradientNoise(
    vec3(scaled.x, scaled.y, uniforms.patternTime.mul(0.001)).mul(25)
  );
  const supportFactor = float(0.03)
    .add(float(0.08).mul(float(1).sub(smoothstep(0, 0.08, abs(scaled.x)))))
    .mul(float(1).sub(uniforms.patternSymmetry));

  return blot.add(support.mul(supportFactor));
}

// Which of the palette's pigments is being painted with, here. A single octave
// of gradient noise at low frequency, so the sheet is divided into a handful of
// broad regions rather than speckled — one wash is one colour over a good span
// of paper, the way a loaded brush behaves.
//
// `paletteSymmetry` folds it on abs(x), like the blot itself. A Rorschach is a
// folded sheet: the paint that transfers to one half is the paint that was on
// the other, so at 1 the two halves carry the same colours. Dropping toward 0
// lets each half take its own path through the palette — the shape stays
// mirrored while the colour does not, which is the most useful asymmetry the
// scene has, since it breaks the fold without touching the silhouette that
// makes the image read as a Rorschach at all.
//
// Crossfaded between the two sampled values, exactly as `cellSymmetry` is, and
// for the same reason: blending the coordinate from x toward abs(x) instead
// collapses the left half to a constant at every setting in between.
//
// The raw noise sits well inside 0-1, which would leave the palette's end stops
// almost unused, so it is gained up and clamped. The clamping is not a defect:
// it makes broad flat regions of the first and last colour with blended
// transitions between, which is what the field is for.
// `cellFlatten` decides whether a pixelated cell is one flat colour or keeps
// shading inside it. Only the pattern's *amount* is quantized, so by default the
// palette field runs straight through a cell unquantized and every block comes
// out internally graded — measurably ~14% of a channel's range across one cell.
// That reads as painterly blocks; a pixel is one flat colour.
//
// Done by contracting the sample coordinate toward its own cell centre rather
// than by flattening the result, so the control is continuous: at 0.5 the
// within-cell variation is simply halved. That is safe here in a way the
// symmetry controls are not — a coordinate lerped toward its quantized self is
// monotonic and collapses nothing, whereas lerping x toward abs(x) would flatten
// a whole half of the sheet.
//
// Scaled by `reveal`, so cells only go flat where the pixelation is actually
// applied and by how much; everywhere else the colour stays smooth.
function paletteField(centred, uniforms, reveal) {
  const gridded = mix(
    centred,
    quantizeToCells(centred, uniforms.cellScale),
    uniforms.cellFlatten.mul(reveal)
  );

  const at = (x) =>
    gradientNoise(
      vec3(x, gridded.y, uniforms.patternTime.mul(0.005))
        .mul(uniforms.paletteScale)
        .add(vec3(53.1, -17.4, 0))
    );

  return mix(at(gridded.x), at(abs(gridded.x)), uniforms.paletteSymmetry)
    .mul(2.2)
    .add(0.5)
    .clamp(0, 1);
}

// `coords` is paper UV in 0-1. Returns the blot's intensity at that point.
//
// The organic field and a cell-quantized copy of it are blended by a second,
// independent Perlin field — the same "reveal" idiom as GetWrecked's Torn Open
// (threshold at 1 - density, smoothstep over a fixed 0.12 band). Where the
// reveal is open the blot's edges and washes break into blocks; elsewhere they
// stay smooth. That is the organic/digital blend, and because it happens in the
// field the *ink itself* lands in cells rather than being pixelated on the way
// out.
export function computeField(coords, uniforms) {
  // Centred, so the mirror axis is the middle of the sheet and the vignette
  // measures distance from it.
  const centred = coords.sub(0.5).mul(2);

  const smoothValue = intensityAt(centred, uniforms);
  const celled = intensityAt(
    quantizeToCells(centred, uniforms.cellScale),
    uniforms
  );

  // The cell grid needs no mirroring of its own: `intensityAt` folds on
  // abs(x), and a grid whose cells straddle x = 0 symmetrically satisfies
  // abs(quantize(x)) === quantize(abs(x)). Only *where* the pixelation appears
  // is asymmetric, so that is what `cellSymmetry` mirrors — blended between the
  // raw field and its folded copy rather than between x and abs(x), which would
  // flatten the left half to a constant at any value in between.
  const revealAt = (x) =>
    gradientNoise(
      vec3(x.add(19.7), centred.y.sub(4.3), uniforms.patternTime.mul(0.01)).mul(
        uniforms.cellRevealScale
      )
    )
      .mul(0.5)
      .add(0.5);
  const revealNoise = mix(
    revealAt(centred.x),
    revealAt(abs(centred.x)),
    uniforms.cellSymmetry
  );

  const revealThreshold = float(1).sub(uniforms.cellReveal);
  const revealMask = smoothstep(
    revealThreshold,
    revealThreshold.add(0.12),
    revealNoise
  );
  const reveal = revealMask.mul(uniforms.cellAmount);

  const value = mix(smoothValue, celled, reveal);

  // Fades the field out toward the edges of the sheet so a wash does not run
  // off the paper.
  const vignette = smoothstep(0.6, 2, max(abs(centred.x), abs(centred.y)));

  const signed = value.sub(vignette).sub(uniforms.patternThreshold);

  const intensity = smoothstep(
    uniforms.patternSharpness.negate(),
    0,
    signed
  ).clamp(0, 1);

  // Its own knob, not the display Sharpness: the sim wants a gradient
  // regardless of how hard an edge the blot is drawn with, and the two would
  // fight each other if they were the same control. The ramp straddles the
  // threshold — the core of the blot reaches 1, its drawn edge sits near the
  // middle, and the field still falls to 0 outside — so pigment flows outward
  // from the core and dries at the rim rather than being laid down flat.
  //
  // Softness is the width of that gradient and so how far paint travels: 0.03
  // holds the pattern's silhouette with a bled rim, 0.06 is properly painterly,
  // and past ~0.2 the ramp covers most of the field's range and the whole sheet
  // washes over.
  const wash = smoothstep(
    uniforms.patternSoftness.negate(),
    uniforms.patternSoftness,
    signed
  ).clamp(0, 1);

  return {
    intensity,
    // Computed here rather than by the caller because it needs `reveal`, and a
    // node built in this function does not survive being handed across into a
    // second one: the generated WGSL comes out referencing an unresolved value
    // and the whole pass fails to compile, which shows up as a blank sheet
    // rather than as an error in the graph. Node-side smoke tests build the
    // graph happily and cannot see it — this only surfaces on a real frame.
    palette: paletteField(centred, uniforms, reveal),
    reveal,
    wash,
  };
}

export function computeIntensity(coords, uniforms) {
  return computeField(coords, uniforms).intensity;
}

// The dev page exposes friendly 0-1 knobs and maps them onto the shader's
// actual uniforms with these curves. Reproduced exactly so "Density 0.5,
// Sharpness 0.95" means the same thing here as it does there — in particular
// Sharpness 0.95 maps to a threshold width of 0.0026, a hard two-tone edge.
// Treating the shader's `sharpness` as a friendly 0-1 value instead makes the
// pattern a soft gradient that washes the whole sheet.
function safePow(value, exponent) {
  return value <= 0 ? 0 : value ** exponent;
}

function mapDensity(value) {
  if (value < 0.5) return 0.5 * safePow(2 * value, 0.1);
  return 1 - 0.5 * safePow(2 - 2 * value, 0.05);
}

export const PATTERN_DEFAULTS = {
  cellAmount: 0,
  cellReveal: 0.5,
  cellFlatten: 1,
  cellRevealScale: 3,
  cellScale: 24,
  cellSymmetry: 1,
  density: 0.5,
  paletteMix: 1,
  paletteScale: 1.5,
  paletteSymmetry: 1,
  softness: 0.04,
  details: 3.75,
  scale: 1,
  seed: 0,
  sharpness: 0.95,
  symmetry: 0.5,
};

// Maps the friendly knobs onto every pattern uniform in one place, so the dev
// page background, the scene's ink layer and the headless CLI cannot drift:
// each of them hands this the same named settings and gets the same field.
export function mapPatternSettings(settings = {}) {
  const {
    cellAmount = PATTERN_DEFAULTS.cellAmount,
    cellFlatten = PATTERN_DEFAULTS.cellFlatten,
    cellReveal = PATTERN_DEFAULTS.cellReveal,
    cellRevealScale = PATTERN_DEFAULTS.cellRevealScale,
    cellScale = PATTERN_DEFAULTS.cellScale,
    cellSymmetry = PATTERN_DEFAULTS.cellSymmetry,
    density = PATTERN_DEFAULTS.density,
    details = PATTERN_DEFAULTS.details,
    paletteMix = PATTERN_DEFAULTS.paletteMix,
    paletteScale = PATTERN_DEFAULTS.paletteScale,
    paletteSymmetry = PATTERN_DEFAULTS.paletteSymmetry,
    scale = PATTERN_DEFAULTS.scale,
    seed = PATTERN_DEFAULTS.seed,
    sharpness = PATTERN_DEFAULTS.sharpness,
    softness = PATTERN_DEFAULTS.softness,
    symmetry = PATTERN_DEFAULTS.symmetry,
  } = settings;

  return {
    cellAmount,
    cellFlatten,
    cellReveal,
    cellRevealScale,
    cellScale,
    cellSymmetry,
    paletteMix,
    paletteScale,
    paletteSymmetry,
    patternDetails: details,
    patternScale: scale,
    patternSeed: seed,
    patternSharpness: 1 - safePow(sharpness, 0.05),
    patternSoftness: softness,
    patternSymmetry: 2 * symmetry - 1,
    patternThreshold: 1 - mapDensity(density),
  };
}

// The uniform bag the field reads. Built here rather than by each caller so
// adding a knob reaches all three renderers at once.
export function createPatternUniforms(settings = {}) {
  const mapped = mapPatternSettings(settings);
  const uniforms = {};
  Object.entries(mapped).forEach(([key, value]) => {
    uniforms[key] = uniform(value);
  });
  uniforms.patternTime = uniform(0);
  return uniforms;
}

// Pushes friendly settings into an existing bag. Only numbers, so a caller can
// pass a whole settings object with colours and booleans in it.
export function applyPatternSettings(uniforms, settings = {}) {
  Object.entries(mapPatternSettings(settings)).forEach(([key, value]) => {
    const target = uniforms[key];
    if (target) target.value = value;
  });
  return uniforms;
}

// What the pattern looks like when it is simply drawn: the dev page background,
// and the ink layer before the watercolour sim gets hold of it. Alpha is the
// blot's own intensity, so the ink floats over whatever is behind it instead of
// carrying a sheet of paper with it.
export function patternColorNode(uniforms, inkColor) {
  return Fn(() =>
    vec4(vec3(inkColor), computeField(uv(), uniforms).intensity)
  )();
}

// Convenience wrapper so the sim can build the pass in one line.
export function patternNode(uvNode, uniforms) {
  return Fn(() => computeIntensity(vec2(uvNode.x, uvNode.y), uniforms))();
}

export default computeIntensity;
