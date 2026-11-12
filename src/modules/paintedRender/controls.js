import { PAINT_KEYS, paintOptions } from '@modules/painted';
import createSchemaFolders from '@modules/schemaControls';

export default function createPaintingFolders(label, extras = {}) {
  return createSchemaFolders({
    label,
    keys: [...PAINT_KEYS, ...Object.keys(extras)],
    options: { ...paintOptions(), ...extras },
    folders: { painting: 'Painting' },
  });
}
