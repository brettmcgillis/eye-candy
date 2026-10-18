import {
  BG_SKIP,
  COOL_ANCHORS,
  RECTS,
  REF_SIZE,
  WARM_ANCHORS,
} from './composition';
import buildComposition from './compositions';
import {
  CANONICAL_U,
  CANONICAL_V,
  isCanonical,
  layoutKnots,
  warpPoint,
} from './layout';
import {
  familyMapper,
  familyShifts,
  hexToRgb,
  paletteFamilies,
  shiftColor,
} from './palette';

// Palette mapping, then the family's OkLCh shift: one recolour per family.
function recolorer(config, stops, warmRef, coolRef) {
  const shifts = familyShifts(config);
  const families = paletteFamilies(
    config.paletteName === 'None' ? null : stops
  );
  const amount = config.paletteMix ?? 1;
  const map = {
    cool: familyMapper(coolRef, families.cool, amount),
    warm: familyMapper(warmRef, families.warm, amount),
  };
  return (rgb, family) => shiftColor(map[family](rgb), shifts[family]);
}

const ACCENT_COLORS = {
  wedgeInkDark: [0x020509, 'cool'],
  wedgeInkLight: [0x0a1a2a, 'cool'],
  soot: [0x0c0709, 'warm'],
  scratchCool: [0x050c18, 'cool'],
  scratchWarm: [0x12060a, 'warm'],
  dripDark: [0x8e1214, 'warm'],
  dripBright: [0xc8261c, 'warm'],
  dripDry: [0x3a0a10, 'warm'],
  fleckDark: [0x7e1018, 'warm'],
  fleckBright: [0xd02a26, 'warm'],
  glowLight: [0xffc878, 'warm'],
  umber: [[0.36, 0.25, 0.17], 'warm'],
};

function accentColors(shifts) {
  return Object.fromEntries(
    Object.entries(ACCENT_COLORS).map(([key, [value, family]]) => [
      key,
      shiftColor(
        Array.isArray(value) ? value : hexToRgb(value),
        shifts[family]
      ),
    ])
  );
}

// A generated composition carries its own colours (sRGB triplets) and its
// zones; the layout warp belongs to the reference only.
function generatedData(config, generated, stops) {
  const shifts = familyShifts(config);
  const recolor = recolorer(
    config,
    stops,
    generated.warm.map((a) => a.color),
    generated.cool.map((a) => a.color)
  );
  const anchors = (list, family) =>
    list.map(({ color, position }) => ({
      color: recolor(color, family),
      position,
    }));
  return {
    accents: accentColors(shifts),
    canonical: true,
    cool: anchors(generated.cool, 'cool'),
    knots: { u: CANONICAL_U, v: CANONICAL_V },
    rects: generated.rects.map((rect) => ({
      ...rect,
      color: recolor(rect.color, rect.warm ? 'warm' : 'cool'),
    })),
    refSize: REF_SIZE,
    warm: anchors(generated.warm, 'warm'),
    zones: generated.zones,
  };
}

// Everything the shader reads that is not a plain number: anchors and
// rectangles moved by the layout and recoloured by the palette (sRGB, as the
// reference stores them), accent colours, and the layout knots the zones are
// read through.
export default function paintingData(config, { stops = null } = {}) {
  const generated = buildComposition(config);
  if (generated) return generatedData(config, generated, stops);
  const knots = layoutKnots(config);
  const canonical = isCanonical(knots);
  const shifts = familyShifts(config);
  const place = (point) => (canonical ? point : warpPoint(point, knots));

  const recolor = recolorer(
    config,
    stops,
    WARM_ANCHORS.map(([, , , hex]) => hexToRgb(hex)),
    COOL_ANCHORS.map(([, , , hex]) => hexToRgb(hex))
  );

  const anchors = (list, family) =>
    list.map(([u, v, reach, hex]) => ({
      color: recolor(hexToRgb(hex), family),
      position: [...place([u, v]), reach],
    }));

  const rects = RECTS.map((rect, i) => ({
    ...rect,
    bgSkip: BG_SKIP.includes(i),
    box: [...place(rect.box.slice(0, 2)), ...place(rect.box.slice(2))],
    color: recolor(hexToRgb(rect.color), rect.warm ? 'warm' : 'cool'),
  }));

  const accents = accentColors(shifts);

  return {
    accents,
    canonical,
    cool: anchors(COOL_ANCHORS, 'cool'),
    knots,
    rects,
    refSize: REF_SIZE,
    warm: anchors(WARM_ANCHORS, 'warm'),
  };
}
