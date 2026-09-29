/* eslint-disable no-bitwise */
import { hexToRgb, pickStop, rgbToHex } from '@utils/paletteStops';

import { sinShifted, wrappedAngle } from './tree';

const GOLDEN = 0.6180339;

// three's TSL `hash` (pcg), bit for bit.
export function pcgHash(seed) {
  const state = (Math.imul(seed >>> 0, 747796405) + 2891336453) >>> 0;
  const word =
    Math.imul(((state >>> ((state >>> 28) + 4)) ^ state) >>> 0, 277803737) >>>
    0;
  return (((word >>> 22) ^ word) >>> 0) / 2 ** 32;
}

// The palette LUT wraps with MirroredRepeatWrapping.
function mirror(t) {
  const period = ((t % 2) + 2) % 2;
  return period > 1 ? 2 - period : period;
}

function linearToSrgb(v) {
  const c = Math.min(Math.max(v, 0), 1);
  return c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
}

export function anchorOf(node, drawLevel, identityLevel) {
  const anchorDepth = Math.min(identityLevel, drawLevel);
  return node >>> (drawLevel - anchorDepth);
}

// The colour a settled box is drawn in, as the pen that plots it: palette
// modes snap to the nearest stop, tint and solid return the sRGB colour the
// material shades from. Mirrors nestingBoxesRender/colorNodes.
export function boxColor(config, { center, level, node, radius, stops }) {
  const seeded = (id) => (id + config.seed) >>> 0;
  const anchor = anchorOf(node, level, config.identityLevel);

  if (config.colorMode === 'palette' && stops) {
    const { paletteRepeat: repeat, paletteShift: shift } = config;
    let t;
    if (config.paletteSource === 'id') {
      t =
        (Math.fround(Math.fround(seeded(anchor)) * Math.fround(GOLDEN)) % 1) *
          repeat +
        shift;
    } else if (config.paletteSource === 'height') {
      t = (center[1] / (config.rootRadiusY * 2) + 0.5) * repeat + shift;
    } else if (config.paletteSource === 'size') {
      const rootLength = Math.hypot(
        config.rootRadiusX,
        config.rootRadiusY,
        config.rootRadiusZ
      );
      const sizeFloor = Math.max(
        (config.shrink - config.shrinkJitter) ** config.levels,
        1e-6
      );
      t =
        (1 -
          Math.log(Math.hypot(...radius) / rootLength) / Math.log(sizeFloor)) *
          repeat +
        shift;
    } else {
      t = pcgHash(seeded(anchor));
    }
    return rgbToHex(pickStop(stops, mirror(t)));
  }

  if (config.colorMode === 'solid') return config.baseColor.toLowerCase();

  const angle = wrappedAngle(seeded(anchor), config.tintFrequency);
  const phases = [config.tintPhaseR, config.tintPhaseG, config.tintPhaseB];
  return rgbToHex(
    phases.map(
      (p) =>
        linearToSrgb(
          sinShifted(angle, p) * config.tintAmplitude + config.tintBase
        ) * 255
    )
  );
}

// A plotter holds a handful of pens, so a continuous tint is clustered to at
// most `count` of them (k-means in sRGB, seeded from the most common colours).
export function reducePens(colors, count) {
  const tally = new Map();
  colors.forEach((c) => tally.set(c, (tally.get(c) ?? 0) + 1));
  if (tally.size <= count) return (c) => c;

  const points = [...tally.entries()].map(([hex, weight]) => ({
    rgb: hexToRgb(hex),
    weight,
  }));
  let centres = points
    .slice()
    .sort((a, b) => b.weight - a.weight)
    .filter((p, i, all) =>
      all
        .slice(0, i)
        .every((q) => Math.hypot(...p.rgb.map((v, a) => v - q.rgb[a])) > 24)
    )
    .slice(0, count)
    .map((p) => p.rgb);

  const nearestIn = (list, rgb) => {
    let best = 0;
    let bestDistance = Infinity;
    list.forEach((c, i) => {
      const d = Math.hypot(...rgb.map((v, a) => v - c[a]));
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    });
    return best;
  };

  const step = (current) => {
    const sums = current.map(() => [0, 0, 0, 0]);
    points.forEach((p) => {
      const s = sums[nearestIn(current, p.rgb)];
      p.rgb.forEach((v, a) => {
        s[a] += v * p.weight;
      });
      s[3] += p.weight;
    });
    return sums.map((s, i) =>
      s[3] > 0 ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : current[i]
    );
  };
  for (let iteration = 0; iteration < 12; iteration += 1) {
    centres = step(centres);
  }

  const hexes = centres.map(rgbToHex);
  return (hex) => hexes[nearestIn(centres, hexToRgb(hex))];
}
