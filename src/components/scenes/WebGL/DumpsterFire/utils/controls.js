import { button } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  facets,
  keysInFacet,
  randomSeed,
  rollDumpsterConfig,
} from '@modules/dumpsterFire';
import createSchemaFolders from '@modules/schemaControls';

export const SCENE_LABEL = 'Dumpster Fire';

const FOLDERS = {
  stage: 'Scene',
  dumpster: 'Dumpster',
  trash: 'Trash',
  wall: 'Brick Wall',
  smoke: 'Smoke',
};

const schemaFolders = createSchemaFolders({
  collapseGroups: true,
  folders: FOLDERS,
  keys: LEVA_KEYS,
  label: SCENE_LABEL,
  options: RENDER_OPTIONS,
});

const LEVA = new Set(LEVA_KEYS);

// Rolls `rolling` facets with the rest held, as the CLI's --keep does.
export function rollFacets(current, rolling) {
  const rolled = rollDumpsterConfig(randomSeed(), {
    base: current,
    keep: facets().filter((facet) => !rolling.includes(facet)),
  });
  return Object.fromEntries(
    rolling.flatMap((facet) =>
      keysInFacet(facet)
        .filter((key) => LEVA.has(key))
        .map((key) => [key, rolled[key]])
    )
  );
}

const ROLL_LABELS = {
  dumpster: 'Roll Dumpster',
  smoke: 'Roll Smoke',
  stage: 'Roll Light',
  trash: 'Roll Trash',
  wall: 'Roll Wall',
};

// The Generation folders (@modules/dumpsterFire's scene keys), each headed
// by a button that rolls it; `extras` adds the scene's own controls beside
// a key (the wall's position).
export default function sceneFolders(saved, { extras = {}, onRoll }) {
  const top = Object.fromEntries(
    Object.keys(FOLDERS).map((section) => [
      section,
      { [ROLL_LABELS[section]]: button(() => onRoll([section])) },
    ])
  );
  return schemaFolders(saved, extras, top);
}
