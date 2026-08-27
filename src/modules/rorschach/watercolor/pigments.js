import { float, vec3 } from 'three/tsl';
import * as THREE from 'three/webgpu';

// Kubelka-Munk pigment model, the compositing half of Curtis et al. 1997.
// A pigment is an absorption coefficient K and a scattering coefficient S per
// channel; a layer of thickness x has a reflectance R and a transmittance T
// derived from them, and layers stack optically rather than by alpha blending.
// That is what makes two overlapping washes read as mixed paint instead of two
// stacked decals.

// Four is the ceiling because the whole sim carries pigment concentrations in
// vec4 channels — one texture for the suspended layer, one for the deposited
// layer. Bundles beyond the fourth share a slot round-robin.
export const PIGMENT_SLOTS = 4;

// testGenerator's fallback for a bundle with no override, and so the anchor an
// emissive bundle's ink glow is measured against.
const DEFAULT_EMISSIVE_INTENSITY = 2;

// K/S from a target colour by the single-constant Kubelka-Munk inversion:
// for an infinitely thick layer, K/S = (1 - R)^2 / 2R. Fixing S = 1 and
// solving for K gives a pigment that settles to roughly the requested colour
// at full strength while still mixing subtractively on the way there.
// R is clamped away from both ends: at 0 the ratio diverges, at 1 the pigment
// becomes pure white and stops being visible at all.
const MIN_REFLECTANCE = 0.03;
const MAX_REFLECTANCE = 0.97;

function absorptionFor(reflectance) {
  const r = Math.min(MAX_REFLECTANCE, Math.max(MIN_REFLECTANCE, reflectance));
  return ((1 - r) * (1 - r)) / (2 * r);
}

const scratch = new THREE.Color();

export const DEFAULT_TONAL_GAP = 0.18;

// The ink is pushed away from the lightness the Lines layer draws with, so the
// two layers never render the same colour. Both draw from one palette, and a
// stroke at the same hue *and* lightness as the wash vanishes into it exactly
// where it crosses — which is where the composition wants it most.
//
// This was a one-sided clamp at 0.5, which only bit when a stop was lighter
// than that. Measured across the palettes actually in use, most stops are not:
// Midnight 15 — the palette in preset 012 — has 11 of its 15 stops at or below
// 0.5, Deep Space has 2 of 2. On those the clamp did nothing at all and the ink
// came out the same colour as the lines, so the layers were tonally identical
// and the eye had nothing to separate.
//
// Darker by preference, since ink under line reads as the denser layer, and
// lighter only when the palette is already on the floor and there is no room
// below. Deliberately not an inversion — inverting makes a genuinely dark
// palette come out pale, which is the same bug facing the other way. Hue and
// saturation always carry over untouched.
const MIN_PIGMENT_LIGHTNESS = 0.06;
const MAX_PIGMENT_LIGHTNESS = 0.94;

function paintLightness(lightness, gap) {
  const darker = lightness - gap;
  if (darker >= MIN_PIGMENT_LIGHTNESS) return darker;
  return Math.min(MAX_PIGMENT_LIGHTNESS, lightness + gap);
}

// `density` scales how fast pigment falls out of suspension, `staining` how
// strongly it resists being picked back up, `granulation` how much it prefers
// to settle in the paper's valleys. Curtis treats these as measured per-paint
// properties; here they are derived from the colour so a palette still produces
// visibly different paint behaviours — dark pigments granulate and stain more,
// which is roughly true of real earth and iron pigments.
export function pigmentFromHsl(hsl, gap = DEFAULT_TONAL_GAP) {
  scratch.setHSL(
    hsl.h,
    hsl.s,
    paintLightness(hsl.l, gap),
    THREE.SRGBColorSpace
  );
  const rgb = scratch.getRGB({ b: 0, g: 0, r: 0 }, THREE.SRGBColorSpace);
  const luminance = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;

  return {
    absorption: [
      absorptionFor(rgb.r),
      absorptionFor(rgb.g),
      absorptionFor(rgb.b),
    ],
    density: 0.6 + (1 - luminance) * 0.4,
    granulation: 0.2 + (1 - luminance) * 0.6,
    scattering: [1, 1, 1],
    // Staining power divides the rate at which settled pigment lifts back into
    // suspension, so it has to be >= 1 or the division *amplifies* lifting and
    // the deposited layer equilibrates near zero — paint that never dries onto
    // the paper. Dark pigments stain hardest, as real earth pigments do.
    staining: 1.5 + (1 - luminance) * 2.5,
  };
}

// The four pigments the wash paints with, sampled evenly across the whole run
// of styles.
//
// This used to take the first style in each round-robin residue class — slots
// 0-3 got styles 0, 1, 2, 3. Styles are the palette sampled at each bundle's
// position, so on a six-bundle test that reached t = 0, 0.2, 0.4 and 0.6 and
// the last 40% of every gradient was unreachable: the ink could only ever paint
// with the darker end of a palette the Lines layer showed in full. Spanning the
// array instead puts the gradient's two end stops in slots 0 and 3, which is
// what makes Palette Spread actually traverse the palette.
export function pigmentsFromStyles(styles, gap = DEFAULT_TONAL_GAP) {
  const last = styles.length - 1;
  const pigments = [];
  for (let slot = 0; slot < PIGMENT_SLOTS; slot += 1) {
    const index = Math.round((slot / (PIGMENT_SLOTS - 1)) * Math.max(0, last));
    const style = styles[index];
    pigments.push({
      ...pigmentFromHsl(style?.color ?? { h: 0, l: 0.12, s: 0 }, gap),
      // Carried through so the ink can glow for exactly the bundles the Lines
      // layer glows for, rather than the whole blot lighting up at once. The
      // gain is normalised against the schema's default intensity of 2, so a
      // bundle left at the default lifts the ink by precisely
      // `inkBloomStrength` and one pushed to 5 lifts it 2.5x further — the same
      // ordering the strokes show.
      emissive: style?.emissive ? 1 : 0,
      emissiveGain: style?.emissive
        ? (style.emissiveIntensity ?? DEFAULT_EMISSIVE_INTENSITY) /
          DEFAULT_EMISSIVE_INTENSITY
        : 0,
    });
  }
  return pigments;
}

export function pigmentSlotForBundle(index) {
  return index % PIGMENT_SLOTS;
}

// One pigment layer's reflectance and transmittance at thickness x, straight
// from Kubelka-Munk:
//   a = (S + K) / S,  b = sqrt(a^2 - 1)
//   c = a * sinh(b S x) + b * cosh(b S x)
//   R = sinh(b S x) / c,  T = b / c
// Thickness is clamped to a small floor because b*S*x = 0 makes c = b and the
// layer collapses to R = 0, T = 1 — correct, but the derivative there is what
// produces speckle if x ever goes slightly negative through advection error.
function kmLayer(absorption, scattering, thickness) {
  const x = thickness.max(0);
  const a = scattering.add(absorption).div(scattering);
  const b = a.mul(a).sub(1).max(1e-6).sqrt();
  const bSx = b.mul(scattering).mul(x);
  const sinh = bSx.sinh();
  const cosh = bSx.cosh();
  const c = a.mul(sinh).add(b.mul(cosh)).max(1e-6);
  return { reflectance: sinh.div(c), transmittance: b.div(c) };
}

// Stacks one layer over whatever is already below it. The T^2 term is the
// light making a round trip through the upper layer, and the 1 - R*Rb
// denominator is the infinite series of inter-reflections between the two —
// the part that alpha compositing has no equivalent for.
function overLayer(layer, below) {
  const denominator = float(1).sub(layer.reflectance.mul(below)).max(1e-6);
  return layer.reflectance.add(
    layer.transmittance.mul(layer.transmittance).mul(below).div(denominator)
  );
}

// Composites all four pigments over the paper. `concentrations` is a vec4 of
// thicknesses (the deposited layer plus whatever is still suspended above it),
// `uniforms` the per-pigment K/S vec3 uniforms.
export function kubelkaMunkReflectance(concentrations, uniforms, paperColor) {
  let result = paperColor;
  for (let slot = 0; slot < PIGMENT_SLOTS; slot += 1) {
    const layer = kmLayer(
      uniforms.absorption[slot],
      uniforms.scattering[slot],
      concentrations.element(slot)
    );
    result = overLayer(layer, result);
  }
  return vec3(result);
}
