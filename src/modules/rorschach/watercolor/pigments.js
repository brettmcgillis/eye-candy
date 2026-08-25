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

// Lines colours are chosen to read against the scene background, which is
// usually near-black — a typical test is pale strokes on black, and pale paint
// on pale paper is nothing at all. Only the ceiling moves: a palette that is
// already paint-dark keeps its own lightness, and a washed-out one is pulled
// down until it reads. Deliberately not an inversion — inverting makes a
// genuinely dark palette come out pale, which is the same bug facing the other
// way. Hue and saturation always carry over untouched.
const MAX_PIGMENT_LIGHTNESS = 0.5;

function paintLightness(lightness) {
  return Math.min(lightness, MAX_PIGMENT_LIGHTNESS);
}

// `density` scales how fast pigment falls out of suspension, `staining` how
// strongly it resists being picked back up, `granulation` how much it prefers
// to settle in the paper's valleys. Curtis treats these as measured per-paint
// properties; here they are derived from the colour so a palette still produces
// visibly different paint behaviours — dark pigments granulate and stain more,
// which is roughly true of real earth and iron pigments.
export function pigmentFromHsl(hsl) {
  scratch.setHSL(hsl.h, hsl.s, paintLightness(hsl.l), THREE.SRGBColorSpace);
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

// Bundles map onto the four slots round-robin. Two bundles sharing a slot share
// a pigment, so their washes mix as one paint rather than as two — which is
// what happens on real paper anyway when you reuse a colour.
export function pigmentsFromStyles(styles) {
  const pigments = [];
  for (let slot = 0; slot < PIGMENT_SLOTS; slot += 1) {
    const style = styles.find((_, index) => index % PIGMENT_SLOTS === slot);
    pigments.push(pigmentFromHsl(style?.color ?? { h: 0, l: 0.12, s: 0 }));
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
