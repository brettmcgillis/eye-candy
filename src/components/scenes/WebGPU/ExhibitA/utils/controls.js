import { button } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  randomSeed,
  rollExhibitConfig,
} from '@modules/exhibitA';
import { PALETTE_NAMES } from '@modules/exhibitARender';
import createSchemaFolders from '@modules/schemaControls';

export const SCENE_LABEL = 'ExhibitA';

const FOLDERS = {
  form: 'Form',
  look: 'Look',
  stage: 'Stage',
  motion: 'Motion',
  quality: 'Quality',
};

const schemaFolders = createSchemaFolders({
  label: SCENE_LABEL,
  options: RENDER_OPTIONS,
  keys: LEVA_KEYS,
  folders: FOLDERS,
  open: ['form'],
  controls: { paletteName: { options: PALETTE_NAMES } },
});

// Rolls one facet with the rest held. A form roll keeps to the family on
// the plinth.
export function rollFacet(current, facet) {
  const rolled = rollExhibitConfig(randomSeed(), {
    base: current,
    families: [current.family],
    keep: ['form', 'look', 'stage'].filter((f) => f !== facet),
    palettes: PALETTE_NAMES,
  });
  return Object.fromEntries(
    LEVA_KEYS.filter((key) => RENDER_OPTIONS[key].facet === facet).map(
      (key) => [key, rolled[key]]
    )
  );
}

export default function sceneFolders(saved, { onRoll }) {
  const roll = (facet) => ({
    before: {
      [`roll${facet[0].toUpperCase()}${facet.slice(1)}`]: button(() =>
        onRoll?.(facet)
      ),
    },
  });
  const extras = {
    background: roll('stage'),
    family: roll('form'),
    paletteName: roll('look'),
  };

  return schemaFolders(saved, extras);
}
