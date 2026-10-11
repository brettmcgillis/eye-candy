import { button } from 'leva';

import {
  LEVA_KEYS,
  PALETTE_NONE,
  RENDER_OPTIONS,
  randomSeed,
  rollBlockPartyConfig,
} from '@modules/blockParty';
import { PALETTE_NAMES, paletteStops } from '@modules/blockPartyRender';
import createSchemaFolders from '@modules/schemaControls';

export const SCENE_LABEL = 'Block Party';

const FOLDERS = {
  city: 'City',
  composition: 'Composition',
  form: 'Form',
  motion: 'Motion',
  surface: 'Surface',
  palette: 'Palette',
};

const PALETTE_OPTIONS = [PALETTE_NONE, ...PALETTE_NAMES];
const ROLLABLE_PALETTES = PALETTE_NAMES.filter(
  (name) => paletteStops(name)?.length >= 2
);

const schemaFolders = createSchemaFolders({
  label: SCENE_LABEL,
  options: RENDER_OPTIONS,
  keys: LEVA_KEYS,
  folders: FOLDERS,
  collapseGroups: false,
  controls: { palette: { options: PALETTE_OPTIONS } },
});

export function rollPalette(current) {
  return rollBlockPartyConfig(randomSeed(), {
    base: current,
    keep: ['composition', 'form'],
    palettes: ROLLABLE_PALETTES,
  });
}

export default function sceneFolders(saved, { onReseed, onRollPalette }) {
  const extras = {
    palette: { after: { 'roll palette': button(() => onRollPalette?.()) } },
    seed: { after: { reseed: button(() => onReseed?.()) } },
  };

  return schemaFolders(saved, extras);
}
