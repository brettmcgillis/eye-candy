import { button } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  randomSeed,
  rollRugConfig,
} from '@modules/rugPull';
import createSchemaFolders from '@modules/schemaControls';

export const SCENE_LABEL = 'Rug Pull';

const FOLDERS = {
  room: 'Room',
  design: 'Design',
  border: 'Borders',
  mine: 'House Motifs',
  palette: 'Palette',
  age: 'Age',
};
const OPEN = ['room', 'design'];

const schemaFolders = createSchemaFolders({
  label: SCENE_LABEL,
  options: RENDER_OPTIONS,
  keys: LEVA_KEYS,
  folders: FOLDERS,
  open: OPEN,
});

// Rolls `rolling` facets with the rest held, as the CLI's --keep does.
export function rollFacets(current, rolling, context = {}) {
  const rolled = rollRugConfig(randomSeed(), {
    base: current,
    houseRate: 0.6,
    keep: facets().filter((facet) => !rolling.includes(facet)),
    ...context,
  });
  return Object.fromEntries(
    rolling.flatMap((facet) =>
      keysInFacet(facet).map((key) => [key, rolled[key]])
    )
  );
}

export default function sceneFolders(saved, { onPull, onRoll, onReweave }) {
  const extras = {
    abrash: { before: { 'Roll Age': button(() => onRoll(['age'])) } },
    design: {
      before: {
        'Roll Whole Rug': button(() =>
          onRoll(['design', 'border', 'palette', 'age'])
        ),
        'Roll Design': button(() => onRoll(['design'])),
        'Reweave (New Seed)': button(() => onReweave()),
      },
    },
    borderMotif: {
      before: { 'Roll Borders': button(() => onRoll(['border'])) },
    },
    mineMedallion: {
      before: { 'Roll House Motifs': button(() => onRoll(['mine'])) },
    },
    palette: { before: { 'Roll Palette': button(() => onRoll(['palette'])) } },
    rugMode: { after: { 'Pull The Rug!': button(() => onPull()) } },
  };
  return schemaFolders(saved, extras);
}
