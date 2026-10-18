import { button } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  randomBatch,
  rollConfig,
} from '@modules/isoMeter';
import createSchemaFolders from '@modules/schemaControls';
import { PALETTE_NAMES, getPaletteStops } from '@utils/gradientPalette';

export const SCENE_LABEL = 'Iso Meter';

const FOLDERS = {
  piece: 'Piece',
  view: 'View',
  color: 'Colour',
  ink: 'Ink',
  motion: 'Motion',
};

const ROLLABLE_PALETTES = PALETTE_NAMES.filter(
  (name) => (getPaletteStops(name)?.length ?? 0) >= 2
);

const schemaFolders = createSchemaFolders({
  controls: { palette: { options: ['None', ...PALETTE_NAMES] } },
  folders: FOLDERS,
  keys: LEVA_KEYS,
  label: SCENE_LABEL,
  options: RENDER_OPTIONS,
});

export function rollFacets(current, rolling) {
  const rolled = rollConfig(randomBatch(), {
    base: current,
    keep: facets().filter((facet) => !rolling.includes(facet)),
    palettes: ROLLABLE_PALETTES,
  });
  return Object.fromEntries(
    rolling.flatMap((facet) =>
      keysInFacet(facet).map((key) => [key, rolled[key]])
    )
  );
}

export default function sceneFolders(saved, { onNewSeed, onReplay, onRoll }) {
  return schemaFolders(
    saved,
    { seed: { after: { 'New seed': button(() => onNewSeed?.()) } } },
    {
      color: { 'Roll palette': button(() => onRoll?.(['palette'])) },
      motion: { Replay: button(() => onReplay?.()) },
      piece: {
        'Roll everything': button(() => onRoll?.(facets())),
        'Roll form': button(() => onRoll?.(['form'])),
      },
    }
  );
}
