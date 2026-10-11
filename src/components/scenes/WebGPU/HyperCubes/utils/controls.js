import { button } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  randomSeed,
  rollHyperCubesConfig,
} from '@modules/hyperCubes';
import { PALETTE_NAMES } from '@modules/hyperCubesRender';
import createSchemaFolders from '@modules/schemaControls';

export const SCENE_LABEL = 'HyperCubes';

const FOLDERS = {
  structure: 'Structure',
  motion: 'Motion',
  cells: 'Cells',
  frames: 'Frames',
  stage: 'Stage',
};

const PALETTE_OPTIONS = ['None', ...PALETTE_NAMES.filter((n) => n !== 'None')];

const schemaFolders = createSchemaFolders({
  label: SCENE_LABEL,
  options: RENDER_OPTIONS,
  keys: LEVA_KEYS,
  folders: FOLDERS,
  controls: { paletteName: { options: PALETTE_OPTIONS } },
});

// Rolls the structure facet with the rest held; the change morphs in.
export function rollStructure(current) {
  const rolled = rollHyperCubesConfig(randomSeed(), {
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
    growProgress: { after: { replay: button(() => onReplay?.()) } },
    structure: { before: { randomize: button(() => onRandomize?.()) } },
  };

  return schemaFolders(saved, extras);
}
