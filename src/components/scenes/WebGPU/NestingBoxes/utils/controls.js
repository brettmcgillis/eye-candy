import { button } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  randomSeed,
  rollNestingBoxesConfig,
} from '@modules/nestingBoxes';
import { PALETTE_NAMES } from '@modules/nestingBoxesRender';
import createSchemaFolders from '@modules/schemaControls';

export const SCENE_LABEL = 'Nesting Boxes';

const FOLDERS = {
  structure: 'Structure',
  motion: 'Motion',
  color: 'Color',
  surface: 'Surface',
  windows: 'Windows',
  fog: 'Fog',
};

const schemaFolders = createSchemaFolders({
  label: SCENE_LABEL,
  options: RENDER_OPTIONS,
  keys: LEVA_KEYS,
  folders: FOLDERS,
  controls: { paletteName: { options: PALETTE_NAMES } },
});

export function rollStructure(current) {
  const rolled = rollNestingBoxesConfig(randomSeed(), {
    base: current,
    keep: ['color', 'atmosphere'],
  });
  return Object.fromEntries(
    LEVA_KEYS.filter((key) => RENDER_OPTIONS[key].facet === 'structure').map(
      (key) => [key, rolled[key]]
    )
  );
}

export default function sceneFolders(saved, { onRandomize, onReplay }) {
  const extras = {
    growNewSeed: { after: { replay: button(() => onReplay?.()) } },
    seed: { before: { randomize: button(() => onRandomize?.()) } },
  };

  return schemaFolders(saved, extras);
}
