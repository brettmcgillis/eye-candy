import { button } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  randomSeed,
  rollCandleConfig,
} from '@modules/candle';
import createSchemaFolders from '@modules/schemaControls';

export const SCENE_LABEL = 'Burning At Both Ends';

const FACETS = ['candle', 'fire', 'smoke'];

const schemaFolders = createSchemaFolders({
  folders: {
    candle: 'Candle',
    fire: 'Flame',
    smoke: 'Smoke',
    style: 'Style',
    stage: 'Stage',
    post: 'Post',
  },
  keys: LEVA_KEYS,
  label: SCENE_LABEL,
  options: RENDER_OPTIONS,
});

// Rolls one facet (or all of them) with the rest held.
export function rollFacet(current, facet) {
  const rolled = rollCandleConfig(randomSeed(), {
    base: current,
    keep: facet ? FACETS.filter((name) => name !== facet) : [],
  });
  return Object.fromEntries(
    LEVA_KEYS.filter(
      (key) => !facet || RENDER_OPTIONS[key].facet === facet
    ).map((key) => [key, rolled[key]])
  );
}

export default function sceneFolders(saved, { onRoll }) {
  return schemaFolders(saved, {
    flame: { before: { 'roll flame': button(() => onRoll('fire')) } },
    formSeed: {
      before: {
        'roll everything': button(() => onRoll(null)),
        'roll candle': button(() => onRoll('candle')),
      },
    },
    smoke: { before: { 'roll smoke': button(() => onRoll('smoke')) } },
  });
}
