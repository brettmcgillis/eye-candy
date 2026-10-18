import { hexToRgb, samplePalette } from '@utils/paletteStops';

const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];
const SLOT_OFFSETS = [-0.5, -1 / 6, 1 / 6, 0.5];
const STRATA_TONE = [1, 1.18, 0.72];

const luminance = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const mix = (a, b, t) => a.map((c, i) => Math.round(c + (b[i] - c) * t));
const scaleTone = (rgb, k) =>
  k >= 1 ? mix(rgb, WHITE, k - 1) : mix(rgb, BLACK, 1 - k);
const wrap = (t) => ((t % 1) + 1) % 1;

function rankMatched(authored, samples) {
  const slots = authored
    .map((rgb, slot) => ({ lum: luminance(rgb), slot }))
    .sort((a, b) => a.lum - b.lum);
  const tones = [...samples].sort((a, b) => luminance(a) - luminance(b));
  const out = [];
  slots.forEach(({ slot }, rank) => {
    out[slot] = tones[rank];
  });
  return out;
}

export default function createRecolor(
  stops,
  {
    paletteBackground = false,
    paletteExact = false,
    paletteInk = false,
    paletteMode = 'layers',
    paletteReverse = false,
    paletteShift = 0,
    paletteSpread = 0.35,
    paletteStrength = 1,
  } = {}
) {
  if (!stops || stops.length === 0) return null;
  const sample = (t) => {
    const at = wrap(t + paletteShift);
    return samplePalette(stops, paletteReverse ? 1 - at : at, paletteExact).map(
      Math.round
    );
  };
  const blend = (authored, target) => mix(authored, target, paletteStrength);
  const tones = stops.map(hexToRgb).sort((a, b) => luminance(a) - luminance(b));

  const remap = (palette, centre, spread) => {
    const samples = SLOT_OFFSETS.map((o) => sample(centre + o * spread));
    const target = rankMatched(palette, samples);
    return palette.map((rgb, slot) => blend(rgb, target[slot]));
  };

  const mapPalettes = (palettes) => {
    if (paletteMode === 'strata') return palettes;
    if (paletteMode === 'faces') {
      return palettes.map((palette) => remap(palette, 0.5, 1));
    }
    return palettes.map((palette, m) =>
      remap(palette, (m + 0.5) / palettes.length, paletteSpread)
    );
  };

  const recolor =
    paletteMode === 'strata'
      ? (tri, authored, height) =>
          blend(
            authored,
            scaleTone(sample(tri.j / height), STRATA_TONE[tri.orientation] ?? 1)
          )
      : null;

  return {
    background: paletteBackground
      ? mix(tones[tones.length - 1], WHITE, 0.72)
      : null,
    ink: paletteInk ? mix(tones[0], BLACK, 0.45) : null,
    mapPalettes,
    recolor,
  };
}
