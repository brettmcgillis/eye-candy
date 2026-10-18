import { button } from 'leva';

import createSchemaFolders from '@modules/schemaControls';
import {
  LEVA_NAMES,
  RENDER_OPTIONS,
  SCENE_OPTIONS,
} from '@modules/subdivisionRelief';
import { PALETTE_NAMES, PALETTE_NONE } from '@modules/subdivisionReliefRender';
import { WEBCAM_FACING_OPTIONS } from '@modules/webcam';
import isMobileDevice from '@utils/isMobileDevice';

export const SCENE_LABEL = 'Subdivision Relief';
export const DEFAULT_SEED = 'relief';

const FOLDERS = {
  output: 'Piece',
  structure: 'Structure',
  field: 'Field',
  palette: 'Palette',
  relief: 'Relief',
  motion: 'Motion',
  loop: 'Loop',
};

const ROLLS = {
  'New piece': 'all',
  Reseed: 'seeds',
  'Roll structure': 'structure',
  'Roll field': 'field',
  'Roll palette': 'palette',
  'Roll relief': 'relief',
};

const pathOf = (folder, key) => `${SCENE_LABEL}.${folder}.${key}`;
const above = (folder, key) => (get) => get(pathOf(folder, key)) > 0;

const schemaFolders = createSchemaFolders({
  controls: {
    focalFalloff: { render: above('Relief', 'focalWeight') },
    lumaInvert: { render: above('Relief', 'lumaWeight') },
    palette: { options: [PALETTE_NONE, ...PALETTE_NAMES] },
    sourceImage: { render: () => false },
    webcamFacing: {
      options: WEBCAM_FACING_OPTIONS,
      render: (get) => get(pathOf('Field', 'webcam')) && isMobileDevice(),
    },
  },
  folders: FOLDERS,
  keys: LEVA_NAMES,
  label: SCENE_LABEL,
  options: SCENE_OPTIONS,
});

// The canvas is a render size in the schema, not a scene key, so its
// controls are placed by hand.
function canvasControl(key, saved) {
  const { label, max, min, step } = RENDER_OPTIONS[key];
  return {
    label,
    max,
    min,
    step,
    value: saved[key] ?? RENDER_OPTIONS[key].default,
  };
}

export default function sceneFolders(saved, onRoll) {
  const values = { ...saved, seed: saved.seed ?? DEFAULT_SEED };
  const rollButtons = Object.fromEntries(
    Object.entries(ROLLS).map(([label, what]) => [
      label,
      button(() => onRoll(what)),
    ])
  );
  const extras = {
    sourceImage: {
      after: {
        sourceUpload: {
          image: undefined,
          label: 'Upload image',
          render: (get) => get(pathOf('Field', 'field')) === 'image',
        },
      },
    },
  };
  const top = {
    output: {
      width: canvasControl('width', values),
      height: canvasControl('height', values),
      ...rollButtons,
    },
  };
  return schemaFolders(values, extras, top);
}
