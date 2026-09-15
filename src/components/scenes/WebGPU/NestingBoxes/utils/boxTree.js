export const MAX_LEVELS = 16;
export const MAX_LEAVES = 2 ** MAX_LEVELS;
export const MAX_NODES = MAX_LEAVES * 2;

const TAU = Math.PI * 2;
const between = (min, max) => min + Math.random() * (max - min);

export const MAX_SEED = 99999;

export function randomSeed() {
  return Math.floor(Math.random() * (MAX_SEED + 1));
}

export function randomStructure() {
  return {
    seed: randomSeed(),
    shrink: between(0.6, 0.85),
    shrinkJitter: between(0.05, 0.3),
    placementFrequency: between(1, 60),
    placementPhaseX: between(0, TAU),
    placementPhaseY: between(0, TAU),
    placementPhaseZ: between(0, TAU),
    sizeFrequency: between(1, 60),
    sizePhaseX: between(0, TAU),
    sizePhaseY: between(0, TAU),
    sizePhaseZ: between(0, TAU),
  };
}
