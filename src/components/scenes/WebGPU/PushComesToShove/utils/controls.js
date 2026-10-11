import { button } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  randomSeed,
  rollShoveConfig,
} from '@modules/pushComesToShove';
import {
  PALETTE_NAMES,
  getPaletteStops,
} from '@modules/pushComesToShoveRender';
import createSchemaFolders from '@modules/schemaControls';

export const SCENE_LABEL = 'Push Comes to Shove';

const FOLDERS = {
  palette: 'Palette',
  panel: 'Panel',
  cavity: 'Cavity',
  wires: 'Wires',
  cylinders: 'Cylinders',
  motion: 'Motion',
  solver: 'Solver',
};

const RICH_PALETTES = PALETTE_NAMES.filter(
  (name) => (getPaletteStops(name)?.length ?? 0) >= 3
);

const schemaFolders = createSchemaFolders({
  label: SCENE_LABEL,
  options: RENDER_OPTIONS,
  keys: LEVA_KEYS,
  folders: FOLDERS,
  controls: { palette: { options: PALETTE_NAMES } },
});

// One facet re-rolled with the rest held, as the workbench's Hold buttons do.
export function rollFacet(current, facet) {
  const rolled = rollShoveConfig(randomSeed(), {
    base: current,
    keep: ['structure', 'color', 'motion', 'atmosphere'].filter(
      (other) => other !== facet
    ),
    palettes: RICH_PALETTES,
    stopsOf: getPaletteStops,
  });
  return Object.fromEntries(
    LEVA_KEYS.filter((key) => RENDER_OPTIONS[key].facet === facet).map(
      (key) => [key, rolled[key]]
    )
  );
}

export default function sceneFolders(saved, { onRoll }) {
  const extras = {
    palette: { 'Roll Colors': button(() => onRoll('color')) },
    panel: { 'Roll Structure': button(() => onRoll('structure')) },
    motion: { 'Roll Motion': button(() => onRoll('motion')) },
  };

  return schemaFolders(saved, {}, extras);
}
