import {
  SCENE_NAMES,
  SCENE_OPTIONS,
  facets,
  randomSeed,
  rollConfig,
} from '@modules/subdivision';
import { PALETTE_NAMES } from '@utils/gradientPalette';

const PIECE_KEYS = SCENE_NAMES.filter((key) => !SCENE_OPTIONS[key].sceneOnly);
const SEED_KEYS = ['splitSeed', 'fieldNoise', 'colorSeed'];

const pieceOf = (config) =>
  Object.fromEntries(PIECE_KEYS.map((key) => [key, config[key]]));

// The Leva values a roll button (or a loop cycle) sets. `what` is 'all',
// 'seeds' (same art direction, new shape), or one facet.
export default function rollControls(current, what) {
  if (what === 'seeds') {
    return Object.fromEntries(
      SEED_KEYS.map((key) => [key, Math.floor(Math.random() * 10000)])
    );
  }
  const base = pieceOf(current);
  if (what === 'all') {
    return pieceOf(
      rollConfig(randomSeed(), { base, paletteNames: PALETTE_NAMES })
    );
  }
  return pieceOf(
    rollConfig(current.seed, {
      base,
      keep: facets().filter((facet) => facet !== what),
      paletteNames: PALETTE_NAMES,
      seeds: { [what]: randomSeed() },
    })
  );
}
