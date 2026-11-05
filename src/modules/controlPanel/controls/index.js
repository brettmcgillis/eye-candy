import { buildSevenSeg, buildSpeaker } from './displays';
import buildSplitFlap from './flaps';
import buildHal from './hal';
import {
  buildButtonRow,
  buildFader,
  buildFaderBank,
  buildKeypad,
  buildMeter,
  buildPiano,
} from './linear';
import buildMatrix from './matrix';
import {
  buildDipSwitches,
  buildThumbwheel,
  buildTrackball,
} from './mechanical';
import buildMimic from './mimic';
import { buildBadge, buildBlank, buildJoystick } from './misc';
import buildPatchBay from './patch';
import buildPrinter from './printer';
import buildRecorder from './recorder';
import buildReels from './reels';
import {
  buildBigKnob,
  buildEncoder,
  buildGauge,
  buildKnob,
  buildSelector,
} from './round';
import buildScreen from './screen';
import {
  buildAnnunciator,
  buildButton,
  buildEStop,
  buildJack,
  buildKeyswitch,
  buildLeds,
  buildRocker,
  buildToggle,
} from './switches';
import buildTelltales from './telltales';
import buildThrottle from './throttle';
import buildTuner from './tuner';

export { buildBadge, buildBlank };
export { INVENTORY, layoutInventory } from './inventory';
export { MATRIX_MODES } from './matrix';
export { createPong } from './screenModes';

const w = (synth, cockpit, dashboard, lab, console) => ({
  cockpit,
  console,
  dashboard,
  lab,
  synth,
});

const strip = (s) => Math.min(s.w, s.h) === 1 && Math.max(s.w, s.h) >= 2;
const area = (minW, minH) => (s) => s.w >= minW && s.h >= minH;
const square = (min, max) => (s) => s.w === s.h && s.w >= min && s.w <= max;

// Unit controls fill a 1 × 1 module or tile a bank, and the round ones also
// fill packed circles: `round` is the radius one unit of scale reaches.
export const UNITS = {
  dipswitches: { build: buildDipSwitches, weights: w(1, 1, 1, 3, 1) },
  thumbwheel: { build: buildThumbwheel, weights: w(1, 2, 2, 3, 1) },
  trackball: {
    build: buildTrackball,
    round: 0.41,
    weights: w(0.5, 2, 1, 2, 2),
  },
  knob: { build: buildKnob, round: 0.42, weights: w(4, 1, 1, 3, 4) },
  selector: { build: buildSelector, round: 0.43, weights: w(1, 3, 2, 4, 1) },
  encoder: { build: buildEncoder, round: 0.38, weights: w(3, 1, 2, 2, 2) },
  gauge: { build: buildGauge, round: 0.46, weights: w(0.3, 4, 5, 3, 0.5) },
  button: { build: buildButton, weights: w(3, 2, 2, 2, 3) },
  toggle: { build: buildToggle, weights: w(2, 5, 2, 4, 1) },
  rocker: { build: buildRocker, weights: w(1, 2, 3, 2, 1) },
  keyswitch: { build: buildKeyswitch, weights: w(0.3, 2, 2, 1, 0.2) },
  jack: { build: buildJack, round: 0.24, weights: w(4, 0.5, 0.2, 3, 2) },
  annunciator: { build: buildAnnunciator, weights: w(0.3, 5, 3, 1, 0.2) },
  leds: { build: buildLeds, weights: w(2, 2, 2, 3, 2) },
  eStop: { build: buildEStop, round: 0.45, weights: w(0.2, 1.5, 0.5, 3, 0.2) },
};

// Area controls fill a whole module of a shape they accept.
export const AREAS = {
  throttle: {
    build: buildThrottle,
    fits: area(2, 2),
    weights: w(0.2, 4, 1, 1, 0.5),
  },
  recorder: {
    build: buildRecorder,
    fits: area(2, 2),
    weights: w(0.5, 1, 1, 4, 1),
  },
  ledMatrix: {
    build: buildMatrix,
    fits: (s) => area(2, 2)(s) && s.h <= 3 && s.w >= s.h,
    weights: w(2, 1, 2, 3, 3),
  },
  bigKnob: {
    build: (kit, s) => buildBigKnob(kit, { k: s.w, variant: s.variant }),
    fits: square(2, 4),
    weights: w(3, 1, 2, 2, 1),
  },
  bigGauge: {
    build: (kit, s) => buildGauge(kit, { k: s.w, variant: s.variant }),
    fits: square(2, 3),
    weights: w(0.5, 4, 5, 3, 0.5),
  },
  fader: { build: buildFader, fits: strip, weights: w(3, 1, 0.5, 1, 5) },
  meter: { build: buildMeter, fits: strip, weights: w(3, 2, 2, 2, 5) },
  buttonRow: { build: buildButtonRow, fits: strip, weights: w(4, 1, 1, 1, 3) },
  sevenSeg: {
    build: buildSevenSeg,
    fits: (s) => s.w >= 2 && s.h <= 2,
    weights: w(2, 3, 4, 4, 2),
  },
  splitFlap: {
    build: buildSplitFlap,
    fits: (s) => s.w >= 2 && s.h <= 2,
    weights: w(0.5, 1.5, 3, 2, 4),
  },
  faderBank: {
    build: buildFaderBank,
    fits: area(2, 2),
    weights: w(3, 0.5, 0.3, 1, 5),
  },
  keypad: {
    build: buildKeypad,
    fits: (s) => area(2, 2)(s) && s.w <= 4 && s.h <= 5,
    weights: w(0.5, 3, 2, 3, 0.5),
  },
  piano: {
    build: buildPiano,
    fits: (s) => s.w >= 3 && s.h <= 2,
    weights: w(3, 0, 0, 0.2, 0.5),
  },
  screen: {
    build: buildScreen,
    fits: (s) => s.w >= 2 && s.h >= 1 && s.w * s.h >= 2,
    weights: w(2, 4, 4, 4, 2),
  },
  speaker: {
    build: buildSpeaker,
    fits: (s) => s.w * s.h >= 2,
    weights: w(2, 0.5, 2, 1, 1),
  },
  patchBay: {
    build: buildPatchBay,
    fits: (s) => s.w >= 2 && s.h >= 1 && s.w * s.h >= 3,
    weights: w(4, 0.3, 0.1, 3, 2),
  },
  reels: {
    build: buildReels,
    fits: (s) => s.w >= 3 && s.h >= 2 && s.w >= s.h,
    weights: w(3, 0.3, 0.3, 2, 2),
  },
  telltales: {
    build: buildTelltales,
    fits: (s) => s.w >= 2 && s.h <= 2 && s.w >= s.h,
    weights: w(0.3, 3, 5, 1, 2),
  },
  mimic: {
    build: buildMimic,
    fits: (s) => s.w >= 3 && s.h >= 2 && s.w >= s.h,
    weights: w(0.3, 1, 2, 2, 3),
  },
  tuner: {
    build: buildTuner,
    fits: (s) => s.w >= 3 && s.h <= 2 && s.w >= 1.5 * s.h,
    weights: w(2, 4, 1, 1, 1.5),
  },
  printer: {
    build: buildPrinter,
    fits: (s) => s.h >= 2 && s.w <= 2 && s.h >= s.w,
    weights: w(0.5, 0.5, 1.5, 2, 3),
  },
  hal: {
    build: buildHal,
    fits: (s) => s.h >= 2 && s.h >= s.w * 2,
    weights: w(0.5, 1, 0.5, 2, 1.5),
  },
  joystick: {
    build: buildJoystick,
    fits: square(2, 3),
    weights: w(1, 4, 1, 1, 1),
  },
};

const mean = (weights) =>
  Object.values(weights).reduce((sum, v) => sum + v, 0) /
  Object.keys(weights).length;

// A domain leans the dice toward its own controls; Mixed weighs each
// control by its average over every domain.
export function weightOf(entry, domain, bias) {
  const base = mean(entry.weights);
  if (domain === 'mixed') return base;
  return base + (entry.weights[domain] - base) * bias;
}

export function pickWeighted(rng, entries, domain, bias) {
  const weighted = entries.map(([id, entry]) => [
    id,
    Math.max(weightOf(entry, domain, bias), 0),
  ]);
  const total = weighted.reduce((sum, [, v]) => sum + v, 0);
  if (total <= 0) return null;
  let roll = rng() * total;
  for (let i = 0; i < weighted.length; i += 1) {
    roll -= weighted[i][1];
    if (roll <= 0) return weighted[i][0];
  }
  return weighted[weighted.length - 1][0];
}
