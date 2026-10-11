import { button } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  randomSeed,
  rollIsoLinesConfig,
} from '@modules/isoLines';
import { PALETTE_NAMES } from '@modules/isoLinesRender';
import createSchemaFolders from '@modules/schemaControls';

export const SCENE_LABEL = 'Iso Lines';

const FOLDERS = {
  contours: 'Contours',
  field: 'Field',
  image: 'Image',
  color: 'Colour',
  motion: 'Motion',
};

const PALETTE_OPTIONS = ['None', ...PALETTE_NAMES.filter((n) => n !== 'None')];

const schemaFolders = createSchemaFolders({
  label: SCENE_LABEL,
  options: RENDER_OPTIONS,
  keys: LEVA_KEYS,
  folders: FOLDERS,
  controls: { paletteName: { options: PALETTE_OPTIONS } },
});

// Rolls `facets` with the rest held, as the CLI's --keep does.
export function rollFacets(current, rolling) {
  const others = facets().filter((facet) => !rolling.includes(facet));
  const rolled = rollIsoLinesConfig(randomSeed(), {
    base: current,
    keep: others,
    palettes: PALETTE_NAMES.filter((name) => name !== 'None'),
  });
  return Object.fromEntries(
    rolling.flatMap((facet) =>
      keysInFacet(facet).map((key) => [key, rolled[key]])
    )
  );
}

export default function sceneFolders(saved, { onRoll }) {
  const extras = {
    colorMode: {
      before: { rollColour: button(() => onRoll?.(['color', 'atmosphere'])) },
    },
    fieldSeed: { before: { rollField: button(() => onRoll?.(['field'])) } },
    sourceImage: {
      after: { sourceUpload: { image: undefined, label: 'Upload image' } },
    },
    style: {
      before: { rollEverything: button(() => onRoll?.(facets())) },
    },
  };

  return schemaFolders(saved, extras);
}
