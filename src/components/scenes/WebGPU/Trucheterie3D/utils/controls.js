import { button } from 'leva';

import createSchemaFolders from '@modules/schemaControls';
import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  randomSeed,
  rollTubeConfig,
} from '@modules/trucheterie3d';
import { PALETTE_NAMES } from '@modules/trucheterie3dRender';

export const SCENE_LABEL = 'Trucheterie 3D';

const FOLDERS = {
  field: 'Field',
  palette: 'Palette',
  form: 'Form',
  stage: 'Stage',
  motion: 'Motion',
};

const MEATBALL_LABELS = { 0: 'Hide Loose', 1: 'Prune Loose', 2: 'Keep All' };

const schemaFolders = createSchemaFolders({
  label: SCENE_LABEL,
  options: RENDER_OPTIONS,
  keys: LEVA_KEYS,
  folders: FOLDERS,
  controls: {
    blobMeatballs: {
      options: Object.fromEntries(
        RENDER_OPTIONS.blobMeatballs.choices.map((option) => [
          MEATBALL_LABELS[option],
          option,
        ])
      ),
    },
    blobPalette: { options: PALETTE_NAMES },
  },
});

// Rolls `rolling` facets with the rest held, as the CLI's --keep does. A
// structure roll is a new seed; anything else keeps the field on screen.
export function rollFacets(current, rolling) {
  const others = facets().filter((facet) => !rolling.includes(facet));
  const rolled = rollTubeConfig(randomSeed(), {
    base: current,
    keep: others,
    paletteNames: PALETTE_NAMES.filter((name) => name !== 'None'),
  });
  const keys = rolling.flatMap((facet) => keysInFacet(facet));
  if (rolling.includes('structure')) keys.push('blobSeed');
  return Object.fromEntries(
    keys
      .filter((key) => !RENDER_OPTIONS[key].rig)
      .map((key) => [key, rolled[key]])
  );
}

export default function sceneFolders(saved, { onDesign, onReplay, onRoll }) {
  const extras = {
    blobPalette: {
      before: { rollPalette: button(() => onRoll?.(['palette'])) },
    },
    designTool: {
      before: {
        startFromSeededField: button(() => onDesign?.('fromSeed')),
        newBlankDesign: button(() => onDesign?.('newBlank')),
      },
    },
    designAutoConnect: {
      after: {
        undoDesign: button(() => onDesign?.('undo')),
        redoDesign: button(() => onDesign?.('redo')),
        clearDesign: button(() => onDesign?.('clear')),
        backToSeededField: button(() => onDesign?.('toSeed')),
      },
    },
    blobSeed: {
      before: {
        rollField: button(() => onRoll?.(['structure'])),
        rollEverything: button(() => onRoll?.(facets())),
      },
    },
    motionMode: { after: { replay: button(() => onReplay?.()) } },
    strands: { before: { rollForm: button(() => onRoll?.(['form'])) } },
  };

  return schemaFolders(saved, extras);
}
