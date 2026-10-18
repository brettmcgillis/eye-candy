import { randomSeed } from '@modules/subdivision';
import {
  SCENE_NAMES,
  SCENE_OPTIONS,
  facets,
  rollReliefConfig,
} from '@modules/subdivisionRelief';
import { PALETTE_NAMES } from '@modules/subdivisionReliefRender';

const PIECE_KEYS = SCENE_NAMES.filter((key) => !SCENE_OPTIONS[key].sceneOnly);
const SEED_KEYS = ['splitSeed', 'fieldNoise', 'colorSeed', 'heightSeed'];

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
      rollReliefConfig(randomSeed(), { base, paletteNames: PALETTE_NAMES })
    );
  }
  return pieceOf(
    rollReliefConfig(current.seed, {
      base,
      keep: facets().filter((facet) => facet !== what),
      paletteNames: PALETTE_NAMES,
      seeds: { [what]: randomSeed() },
    })
  );
}
