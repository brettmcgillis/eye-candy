import { button } from 'leva';

import { LEVA_KEYS, RENDER_OPTIONS } from '@modules/argyle';
import createSchemaFolders from '@modules/schemaControls';

export const SCENE_LABEL = 'Argyle';
const folders = createSchemaFolders({
  label: SCENE_LABEL,
  keys: LEVA_KEYS,
  options: RENDER_OPTIONS,
  folders: {
    painting: 'Painting',
    layout: 'Layout',
    field: 'Coverage',
    automaton: 'Automaton',
    color: 'Colour',
    motion: 'Motion',
    relief: 'Relief',
  },
});
export default function sceneFolders(saved, randomize) {
  return folders(saved, { pattern: { before: { roll: button(randomize) } } });
}
