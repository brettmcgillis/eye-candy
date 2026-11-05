import { button } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  randomSeed,
  rollCablesConfig,
} from '@modules/cables';
import { PALETTE_NAMES } from '@modules/cablesRender';
import createSchemaFolders from '@modules/schemaControls';

export const SCENE_LABEL = 'Cables';

const FOLDERS = {
  field: 'Field',
  cables: 'Cables',
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

// Rolls one facet with the rest of the current controls held.
export function rollFacet(current, facet) {
  const others = ['field', 'cables', 'atmosphere'].filter((f) => f !== facet);
  const rolled = rollCablesConfig(randomSeed(), {
    base: current,
    keep: others,
    palettes: PALETTE_NAMES.filter((n) => n !== 'None'),
  });
  return Object.fromEntries(
    LEVA_KEYS.filter((key) => RENDER_OPTIONS[key].facet === facet).map(
      (key) => [key, rolled[key]]
    )
  );
}

export default function sceneFolders(saved, { onRoll }) {
  const extras = {
    layout: { before: { 'roll field': button(() => onRoll?.('field')) } },
    cableRadius: {
      before: { 'roll cables': button(() => onRoll?.('cables')) },
    },
    background: {
      before: { 'roll stage': button(() => onRoll?.('atmosphere')) },
    },
  };

  return schemaFolders(saved, extras);
}
