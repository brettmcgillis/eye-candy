import { button } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  keysInFacet,
  randomSeed,
  rollRabbitConfig,
} from '@modules/rabbit';
import createSchemaFolders from '@modules/schemaControls';

export const SCENE_LABEL = 'Stay Hunted';

const schemaFolders = createSchemaFolders({
  folders: {
    paper: 'Paper',
    fur: 'Fur',
    wound: 'Wound',
    arrows: 'Arrows',
    ribbon: 'Ribbon',
    grass: 'Grass',
  },
  keys: LEVA_KEYS,
  label: SCENE_LABEL,
  options: RENDER_OPTIONS,
});

const LEVA = new Set(LEVA_KEYS);

// A fresh volley with everything else held, as RabbitCLI's --keep does.
export function rollVolley(current) {
  const rolled = rollRabbitConfig(randomSeed(), {
    base: current,
    keep: ['pose', 'camera'],
  });
  return Object.fromEntries(
    keysInFacet('volley')
      .filter((key) => LEVA.has(key))
      .map((key) => [key, key === 'volley' ? 'rolled' : rolled[key]])
  );
}

// The subject's folders (@modules/rabbit's scene keys); the Arrows folder
// opens with a button that rolls a new volley.
export default function sceneFolders(saved, { onRollVolley }) {
  return schemaFolders(
    saved,
    {},
    {
      arrows: { 'Roll Volley': button(onRollVolley) },
    }
  );
}
