import { button } from 'leva';

import {
  FACETS,
  LEVA_KEYS,
  RENDER_OPTIONS,
  randomSeed,
  rollImperfectionConfig,
} from '@modules/imperfection';
import { PALETTE_NAMES } from '@modules/imperfectionRender';
import createSchemaFolders from '@modules/schemaControls';
import { webcamFacingControl } from '@modules/webcam';

export const SCENE_LABEL = 'Imperfection';

const FOLDERS = {
  composition: 'Composition',
  source: 'Source',
  paint: 'Paint',
  field: 'Field',
  blocks: 'Blocks',
  motif: 'Motif',
  wet: 'Wet',
  accents: 'Accents',
  grade: 'Grade',
  palette: 'Palette',
  layout: 'Layout',
  motion: 'Motion',
  quality: 'Quality',
};

const schemaFolders = createSchemaFolders({
  label: SCENE_LABEL,
  options: RENDER_OPTIONS,
  keys: LEVA_KEYS,
  folders: FOLDERS,
  open: ['composition'],
  controls: {
    paletteName: { options: ['None', ...PALETTE_NAMES] },
    webcamFacing: webcamFacingControl(),
  },
});

// Rolls one facet with the rest held, or every facet.
export function rollFacets(current, facet = null) {
  const rolled = rollImperfectionConfig(randomSeed(), {
    base: current,
    keep: facet ? FACETS.filter((f) => f !== facet) : ['motion'],
    palettes: PALETTE_NAMES,
  });
  return Object.fromEntries(
    LEVA_KEYS.filter(
      (key) => !facet || RENDER_OPTIONS[key].facet === facet
    ).map((key) => [key, rolled[key]])
  );
}

const ROLL_BUTTONS = {
  composition: 'composition',
  accents: 'wedge',
  blocks: 'blocksEnabled',
  field: 'seamBreath',
  grade: 'glow',
  layout: 'mirror',
  paint: 'variant',
  palette: 'warmHue',
  motif: 'motifStyle',
  wet: 'wet',
};

export default function sceneFolders(saved, { onRoll }) {
  const extras = Object.fromEntries(
    Object.entries(ROLL_BUTTONS).map(([facet, key]) => [
      key,
      {
        before: {
          [`roll${facet[0].toUpperCase()}${facet.slice(1)}`]: button(() =>
            onRoll?.(facet)
          ),
        },
      },
    ])
  );
  const top = {
    paint: { rollAll: button(() => onRoll?.(null)) },
  };
  return schemaFolders(saved, extras, top);
}
