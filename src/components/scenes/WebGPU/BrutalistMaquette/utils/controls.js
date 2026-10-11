import { button } from 'leva';

import {
  RENDER_OPTIONS,
  levaKeysFor,
  randomSeed,
  rollBrutalistConfig,
} from '@modules/brutalist';
import createSchemaFolders from '@modules/schemaControls';

export const SCENE_LABEL = 'BrutalistMaquette';

const STAGE = 'maquette';
const LEVA_KEYS = levaKeysFor(STAGE);
// Leva keys plus the lighting rig's, which live in the same store.
const STAGE_KEYS = Object.keys(RENDER_OPTIONS).filter(
  (key) =>
    RENDER_OPTIONS[key].scene && RENDER_OPTIONS[key].stages.includes(STAGE)
);
const FOLDERS = {
  form: 'Form',
  surface: 'Surface',
  studio: 'Studio',
};

const schemaFolders = createSchemaFolders({
  label: SCENE_LABEL,
  options: RENDER_OPTIONS,
  keys: LEVA_KEYS,
  folders: FOLDERS,
});

// Rolls one facet with the rest held.
export function rollFacet(current, facet) {
  const rolled = rollBrutalistConfig(randomSeed(), {
    base: current,
    keep: ['form', 'weather', 'site', 'mood'].filter((f) => f !== facet),
  });
  return Object.fromEntries(
    STAGE_KEYS.filter((key) => RENDER_OPTIONS[key].facet === facet).map(
      (key) => [key, rolled[key]]
    )
  );
}

export default function sceneFolders(saved, { onRoll }) {
  const extras = {
    family: { before: { randomize: button(() => onRoll?.('form')) } },
    look: { before: { weather: button(() => onRoll?.('weather')) } },
  };

  return schemaFolders(saved, extras);
}
