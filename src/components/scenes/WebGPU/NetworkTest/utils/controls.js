import { button } from 'leva';

import {
  LEVA_KEYS,
  RENDER_OPTIONS,
  keysInFacet,
  randomSeed,
  rollNetworkTestConfig,
} from '@modules/networkTest';
import { PALETTE_NAMES } from '@modules/networkTestRender';
import createSchemaFolders from '@modules/schemaControls';

export const SCENE_LABEL = 'Network Test';

const FOLDERS = {
  motion: 'Motion',
  points: 'Points',
  image: 'Image',
  wiring: 'Wiring',
  nodes: 'Nodes',
  edges: 'Edges',
  pulses: 'Pulses',
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

// Rolls `facets` with the rest held, as the CLI's --keep does.
export function rollFacets(current, facets) {
  const others = ['points', 'wiring', 'color', 'atmosphere'].filter(
    (facet) => !facets.includes(facet)
  );
  const rolled = rollNetworkTestConfig(randomSeed(), {
    base: current,
    keep: others,
    palettes: PALETTE_NAMES.filter((name) => name !== 'None'),
  });
  return Object.fromEntries(
    facets.flatMap((facet) =>
      keysInFacet(facet).map((key) => [key, rolled[key]])
    )
  );
}

export default function sceneFolders(saved, { onRoll, onReplay }) {
  const extras = {
    background: {
      before: { rollLook: button(() => onRoll?.(['color', 'atmosphere'])) },
    },
    motionMode: { after: { replay: button(() => onReplay?.()) } },
    pointSeed: { before: { rollPoints: button(() => onRoll?.(['points'])) } },
    sourceImage: {
      after: { sourceUpload: { image: undefined, label: 'Upload image' } },
    },
    wireSeed: { before: { rollWiring: button(() => onRoll?.(['wiring'])) } },
  };

  return schemaFolders(saved, extras);
}
