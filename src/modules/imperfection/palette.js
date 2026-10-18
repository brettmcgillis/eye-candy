/* eslint-disable no-bitwise */
const toLinear = (c) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const toGamma = (c) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

function rgbToOklab([r, g, b]) {
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb
  );
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToRgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((c) => clamp01(toGamma(clamp01(c))));
}

export const hexToRgb = (hex) => [
  ((hex >> 16) & 255) / 255,
  ((hex >> 8) & 255) / 255,
  (hex & 255) / 255,
];

const isIdentity = ({ chroma, hue, light }) =>
  hue === 0 && chroma === 1 && light === 1;

// One family's shift in OkLCh. Hue turns, chroma and lightness scale; an
// unshifted family returns its colours untouched so the reference stays exact.
export function shiftColor(rgb, shift) {
  if (isIdentity(shift)) return rgb;
  const [L, a, b] = rgbToOklab(rgb);
  const angle = Math.atan2(b, a) + (shift.hue * Math.PI) / 180;
  const C = Math.hypot(a, b) * shift.chroma;
  return oklabToRgb([
    Math.min(1, L * shift.light),
    C * Math.cos(angle),
    C * Math.sin(angle),
  ]);
}

export const familyShifts = (config) => ({
  cool: {
    chroma: config.coolChroma,
    hue: config.coolHue,
    light: config.coolLight,
  },
  warm: {
    chroma: config.warmChroma,
    hue: config.warmHue,
    light: config.warmLight,
  },
});

const lightness = (rgb) => rgbToOklab(rgb)[0];
const parseStop = (stop) =>
  Array.isArray(stop)
    ? stop.map((c) => c / 255)
    : hexToRgb(parseInt(String(stop).replace('#', ''), 16));

// A gradients.json palette split into the shader's two families (r > b is
// warm, as every r - b test in the shader reads it), each sorted dark to light.
export function paletteFamilies(stops) {
  const colors = (stops ?? []).map(parseStop);
  const byLight = (list) => list.sort((a, b) => lightness(a) - lightness(b));
  return {
    cool: byLight(colors.filter(([r, , b]) => r <= b)),
    warm: byLight(colors.filter(([r, , b]) => r > b)),
  };
}

function sampleFamily(list, t) {
  if (list.length === 1) return list[0];
  const x = Math.min(Math.max(t, 0), 1) * (list.length - 1);
  const i = Math.min(Math.floor(x), list.length - 2);
  const f = x - i;
  return list[i].map((c, k) => c + (list[i + 1][k] - c) * f);
}

// Recolours one family: a colour keeps its place on the family's lightness
// range and takes the palette's colour there. A palette with no colours in a
// family leaves that family alone.
export function familyMapper(reference, palette, amount) {
  if (!palette.length || amount <= 0) return (rgb) => rgb;
  const lights = reference.map(lightness);
  const lo = Math.min(...lights);
  const hi = Math.max(...lights);
  return (rgb) => {
    const target = sampleFamily(
      palette,
      (lightness(rgb) - lo) / Math.max(hi - lo, 1e-6)
    );
    return rgb.map((c, k) => c + (target[k] - c) * amount);
  };
}
