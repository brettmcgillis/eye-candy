import { createSeededRandom } from '@elements/Lightning/lightningUtils';

const lerp = (a, b, t) => a + (b - a) * t;

/* eslint-disable no-bitwise -- integer hash; bit ops are the point */
// createSeededRandom is a Lehmer LCG, so its first draw is linear in the seed:
// seeds that differ by a constant produce first draws that differ by a fixed
// stride, and strike intensity marches in a smooth repeating ramp instead of
// varying. Mixing the seed first (splitmix32 finalizer) decorrelates it.
function mixSeed(value) {
  let x = value | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return (x ^ (x >>> 16)) >>> 0;
}
/* eslint-enable no-bitwise */

// One "power" value drives everything that scales with how energetic the
// discharge is, so a heavily branched bolt is also the one that flashes hardest
// and throws the most sand. Rolling those independently reads as noise; rolling
// them together reads as a bigger strike. Timing and path shape are rolled
// separately — they are not consequences of the strike's energy.
export default function createStrikeVariation({ config, cycleIndex }) {
  const random = createSeededRandom(mixSeed(config.seed + cycleIndex * 104729));
  const spread = config.strikeVariance;
  const power = random();
  const scale = (low, high) => lerp(1, lerp(low, high, power), spread);
  const jitter = (amount) => 1 + (random() * 2 - 1) * amount * spread;

  return {
    seed: mixSeed(config.seed + cycleIndex * 7919),
    branchCount: Math.max(0, Math.round(config.branchCount * scale(0.5, 1.3))),
    channelRadius: config.channelRadius * jitter(0.22),
    ejectLift: config.ejectLift * scale(0.75, 1.3),
    ejectSpeed: config.ejectSpeed * scale(0.75, 1.3),
    frontSpeed: config.frontSpeed * jitter(0.16),
    leaderSpread: config.leaderSpread * jitter(0.32),
    restDuration: Math.max(0.4, config.restDuration * jitter(0.45)),
    returnGap: Math.max(0, config.returnGap * jitter(0.4)),
    returnPeak: config.returnPeak * scale(0.7, 1.35),
    returnStrokes: Math.min(
      6,
      Math.max(1, Math.round(lerp(config.returnStrokes, 1 + power * 4, spread)))
    ),
  };
}
