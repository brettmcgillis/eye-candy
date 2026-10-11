import { button } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  facets,
  randomSeed,
  rollFractalAutomataConfig,
} from '@modules/fractalAutomata';
import { PALETTE_NAMES, getPaletteStops } from '@modules/fractalAutomataRender';
import createSchemaFolders from '@modules/schemaControls';

export const SCENE_LABEL = 'Fractal Automata';

const FOLDERS = {
  field: 'VoxelField',
  detail: 'VoxelDetail',
  palette: 'Palette',
  materials: 'Materials',
  lighting: 'Lighting',
  godrays: 'Godrays',
};

const ROLLABLE_PALETTES = PALETTE_NAMES.filter(
  (name) => (getPaletteStops(name)?.length ?? 0) >= 3
);

const schemaFolders = createSchemaFolders({
  label: SCENE_LABEL,
  options: RENDER_OPTIONS,
  keys: LEVA_KEYS,
  folders: FOLDERS,
  controls: { paletteName: { options: ['None', ...PALETTE_NAMES] } },
});

// One facet re-rolled, everything else held at what the controls show.
export function rollFacet(facet, current) {
  const rolled = rollFractalAutomataConfig(randomSeed(), {
    base: current,
    keep: facets().filter((other) => other !== facet),
    palettes: ROLLABLE_PALETTES,
  });
  return Object.fromEntries(
    LEVA_KEYS.filter((key) => RENDER_OPTIONS[key].facet === facet).map(
      (key) => [key, rolled[key]]
    )
  );
}

export default function sceneFolders(saved, { onRoll }) {
  const extras = {
    seed: { before: { rollStructure: button(() => onRoll?.('structure')) } },
    colorMode: { before: { rollColors: button(() => onRoll?.('color')) } },
  };

  return schemaFolders(saved, extras);
}
