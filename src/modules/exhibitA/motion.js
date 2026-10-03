import { TAU, clamp, mod } from './math';
import { RENDER_OPTIONS, exhibitOf } from './renderOptions.mjs';

// What "evolve" walks for each exhibit. `sine` swings `amp` either side of
// the authored value over `period` seconds; `linear` turns at `rate` per
// second and wraps within `wrap`.
const sine = (key, amp, period, phase = 0) => ({
  amp,
  key,
  period,
  phase,
  type: 'sine',
});
const linear = (key, rate, wrap) => ({ key, rate, type: 'linear', wrap });
const ANGLE = [-180, 180];
const SPIN = linear('objectSpin', 9, ANGLE);

export const EVOLVE = {
  aizawa: [sine('aizawaD', 0.3, 30)],
  apollian4: [
    linear('a4RotXW', 5, ANGLE),
    linear('a4RotYW', 3.2, ANGLE),
    linear('a4RotZW', 2.1, ANGLE),
  ],
  barth: [sine('algebraicTurn', 25, 26)],
  boy: [{ key: 'boyAlpha', period: 18, type: 'pingpong' }],
  breather: [sine('breatherB', 0.12, 24)],
  cell120: [linear('polyRotXW', 6, ANGLE), linear('polyRotZW', 2.5, ANGLE)],
  cell16: [linear('polyRotXW', 9, ANGLE), linear('polyRotYW', 5, ANGLE)],
  cell24: [linear('polyRotXW', 9, ANGLE), linear('polyRotYW', 5, ANGLE)],
  cell5: [linear('polyRotXW', 9, ANGLE), linear('polyRotYW', 5, ANGLE)],
  cell600: [linear('polyRotXW', 6, ANGLE), linear('polyRotZW', 2.5, ANGLE)],
  chenLee: [sine('chenA', 0.4, 30)],
  clebsch: [sine('algebraicTurn', 25, 26)],
  conoid: [SPIN],
  dadras: [sine('dadrasA', 0.25, 30)],
  dini: [sine('diniTwist', 0.1, 20)],
  enneper: [sine('enneperRadius', 0.3, 18)],
  fourWing: [sine('fourWingA', 0.05, 30)],
  halvorsen: [sine('halvorsenA', 0.15, 30)],
  helicoid: [sine('helicoidTurns', 0.3, 20)],
  hopf: [linear('hopfTwist', 12, ANGLE)],
  hyperboloid: [sine('stringsTwist', 40, 18)],
  kifs: [linear('kifsAngleA', 6, ANGLE), sine('kifsAngleB', 15, 23)],
  klein: [SPIN],
  kleinian: [linear('kleinKey', 0.25, [0, 16])],
  kuen: [sine('kuenRange', 1, 20)],
  kummer: [sine('kummerMu', 0.18, 22), sine('algebraicTurn', 12, 31)],
  lissajous: [linear('lissPhaseX', 0.01, [0, 1])],
  lorenz: [sine('lorenzRho', 6, 30)],
  mandelbox: [sine('boxScale', 0.25, 26)],
  mandelbulb: [sine('bulbPower', 2.5, 24), sine('bulbPhase', 20, 37)],
  menger: [sine('mengerTwist', 20, 22)],
  paraboloid: [sine('stringsWarp', 0.3, 16)],
  quatJulia: [
    sine('juliaCX', 0.12, 21),
    sine('juliaCY', 0.12, 17, 1.3),
    sine('juliaCZ', 0.12, 25, 2.1),
    sine('juliaCW', 0.12, 13, 0.7),
  ],
  rossler: [sine('rosslerC', 1.5, 30)],
  seashell: [sine('shellFlare', 0.3, 20)],
  tesseract: [linear('polyRotXW', 9, ANGLE), linear('polyRotYW', 5, ANGLE)],
  thomas: [sine('thomasB', 0.02, 30)],
  torusKnot: [sine('knotRatio', 0.12, 18)],
};

const within = (key, value) => {
  const { max, min } = RENDER_OPTIONS[key];
  return clamp(value, min, max);
};

// The config `seconds` into an evolve, at `evolveRate`.
export function evolveConfig(config, seconds) {
  const t = seconds * config.evolveRate;
  const out = { ...config };
  (EVOLVE[exhibitOf(config)] ?? [SPIN]).forEach((step) => {
    const base = config[step.key];
    if (step.type === 'sine') {
      out[step.key] = within(
        step.key,
        base + step.amp * Math.sin((TAU * t) / step.period + step.phase)
      );
    } else if (step.type === 'pingpong') {
      const { max, min } = RENDER_OPTIONS[step.key];
      const f = 0.5 + 0.5 * Math.cos((TAU * t) / step.period);
      out[step.key] = min + (max - min) * f;
    } else {
      const [lo, hi] = step.wrap;
      out[step.key] = lo + mod(base + step.rate * t - lo, hi - lo);
    }
  });
  return out;
}

// 0 → 1 over drawSeconds, held drawHold, then again.
export function drawProgress(config, seconds) {
  const cycle = config.drawSeconds + config.drawHold;
  return Math.min(mod(seconds, cycle) / config.drawSeconds, 1);
}

export const sweepAzimuth = (config, seconds) =>
  config.lightAzimuth +
  (config.sweepSpan / 2) * Math.sin((TAU * seconds) / config.sweepSeconds);
