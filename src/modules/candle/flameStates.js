/* eslint-disable no-bitwise */
import { hashSeed } from '@modules/flora';

// How each state burns, in the fire example's terms: buoyancy and curl
// turbulence drive the velocity field, `life` (seconds) sets how fast the
// gas cools (the flame's height), `sootLife` how long its soot lingers,
// `temperature` / `soot` what the wick emits each second. `flicker` is how
// far emission dips, `sway` how far the flame base wanders, `wind` / `gust`
// a draught's steady and gusting push. `smoke` scales the curl smoke's
// emission and `ember` the wick tip's glow.
export const FLAME_STATE_PARAMS = {
  breeze: {
    buoyancy: 3,
    flicker: 0.12,
    gust: 0.45,
    life: 0.65,
    smoke: 0.4,
    soot: 0.4,
    sootLife: 1.4,
    sway: 0.012,
    temperature: 5.5,
    turbulence: 0.8,
    wind: 0.9,
  },
  calm: {
    buoyancy: 3,
    flicker: 0.04,
    gust: 0,
    life: 0.7,
    smoke: 0.25,
    soot: 0.25,
    sootLife: 1.2,
    sway: 0.004,
    temperature: 5.5,
    turbulence: 0.35,
    wind: 0,
  },
  flicker: {
    buoyancy: 3.2,
    flicker: 0.2,
    gust: 0.12,
    life: 0.7,
    smoke: 0.35,
    soot: 0.35,
    sootLife: 1.3,
    sway: 0.014,
    temperature: 5.8,
    turbulence: 1,
    wind: 0,
  },
  gutter: {
    buoyancy: 2.6,
    flicker: 0.5,
    gust: 0.7,
    life: 0.55,
    smoke: 0.7,
    soot: 0.8,
    sootLife: 1.8,
    sway: 0.02,
    temperature: 5,
    turbulence: 1.5,
    wind: 0.2,
  },
  sooty: {
    buoyancy: 3.4,
    flicker: 0.14,
    gust: 0.1,
    life: 1,
    smoke: 1,
    soot: 3,
    sootLife: 3,
    sway: 0.01,
    temperature: 6.5,
    turbulence: 1.1,
    wind: 0,
  },
};

// A wick that is out: how much it smokes and how its tip glows.
export const EMBER_STATE_PARAMS = {
  cold: { ember: 0, smoke: 0 },
  smoulder: { ember: 1, smoke: 0.45 },
  snuffed: { ember: 0.65, smoke: 1.25 },
};

export const isLit = (config) => config.flame !== 'out';

// The state's numbers with the generation's multipliers applied.
export function flameParams(config) {
  const base = FLAME_STATE_PARAMS[config.flameState] ?? FLAME_STATE_PARAMS.calm;
  const flicker = config.flameFlicker ?? 1;
  return {
    ...base,
    buoyancy: base.buoyancy * (config.simBuoyancy ?? 1),
    flicker: base.flicker * flicker,
    gust: base.gust * flicker,
    life: base.life * (config.simLifespan ?? 1) * (config.flameSize ?? 1),
    soot: base.soot * (config.simSoot ?? 1),
    sway: base.sway * flicker,
    turbulence: base.turbulence * (config.simTurbulence ?? 1),
  };
}

// The curl smoke's emission (0 off, 1 a lit sooty flame) and the wick
// ember's glow for a generation.
export function smokeAmount(config) {
  if (isLit(config)) return flameParams(config).smoke;
  return (EMBER_STATE_PARAMS[config.emberState] ?? EMBER_STATE_PARAMS.cold)
    .smoke;
}

export function emberGlow(config) {
  if (isLit(config)) return 1;
  return (EMBER_STATE_PARAMS[config.emberState] ?? EMBER_STATE_PARAMS.cold)
    .ember;
}

function lattice(seed, i) {
  let h = (seed ^ Math.imul(i, 0x27d4eb2d)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
  return (((h ^ (h >>> 15)) >>> 0) / 4294967295) * 2 - 1;
}

// Smooth 1D value noise in [-1, 1], seeded.
export function noise1(seed, t) {
  const i = Math.floor(t);
  const f = t - i;
  const u = f * f * (3 - 2 * f);
  return lattice(seed, i) * (1 - u) + lattice(seed, i + 1) * u;
}

// The CPU signal every flame system and light reads at time `t`: `emit`
// scales emission (dips when it flickers, starves when it gutters), `sway`
// moves the flame base, `wind` is the draught's push (xz, in sim units) and
// `light` the flame light's intensity. Pure in (config, t), so a still and
// a video frame see the same flame.
export function flameSignal(config, t) {
  const p = flameParams(config);
  const seed = hashSeed(`${config.flameSeed}:flame`);
  const slow = noise1(seed, t * 0.8);
  const fast = noise1(seed + 1, t * 9);
  const micro = noise1(seed + 2, t * 23);
  let emit =
    1 -
    Math.min(0.55, p.flicker * (0.5 + 0.35 * slow + 0.45 * fast + 0.2 * micro));
  if (config.flameState === 'gutter') {
    const starve = Math.max(0, noise1(seed + 3, t * 1.3) - 0.25) / 0.75;
    emit *= 1 - 0.6 * starve * Math.min(1, p.flicker * 2);
  }
  const azimuth = ((config.flameWindAzimuth ?? 0) * Math.PI) / 180;
  const gust =
    p.wind + p.gust * Math.max(0, noise1(seed + 4, t * 1.7) * 0.8 + 0.4);
  const swirl = noise1(seed + 5, t * 0.6) * 0.6;
  return {
    emit: Math.max(0.25, emit),
    light: Math.max(0.25, emit) * (0.92 + 0.08 * fast),
    sway: [
      p.sway * noise1(seed + 6, t * 3.5),
      p.sway * noise1(seed + 7, t * 3.5),
    ],
    wind: [
      -Math.sin(azimuth + swirl) * gust,
      -Math.cos(azimuth + swirl) * gust,
    ],
  };
}
