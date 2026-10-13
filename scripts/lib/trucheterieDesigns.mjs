import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './loadModules.mjs';

export const DESIGNS_DIR = path.join(
  REPO_ROOT,
  'src',
  'modules',
  'trucheterieBlob',
  'designs'
);

function designFile(value) {
  if (value.endsWith('.json')) return path.resolve(value);
  return path.join(DESIGNS_DIR, `${value}.json`);
}

// `blob` is the loaded @modules/trucheterieBlob barrel.
export function resolveDesign(blob, value) {
  if (!value) return '';
  if (blob.isDesignCode(value)) return value;
  const file = designFile(value);
  if (!existsSync(file)) {
    throw new Error(
      `design "${value}" is not a design code, a .json file or a saved design in ${path.relative(REPO_ROOT, DESIGNS_DIR)}.`
    );
  }
  const design = blob.designFromJson(JSON.parse(readFileSync(file, 'utf8')));
  if (!design) {
    throw new Error(
      `${path.relative(REPO_ROOT, file)} is not a valid design (overlapping or out-of-grid cells).`
    );
  }
  return blob.encodeDesign(design);
}

export function withResolvedDesign(blob, pinned) {
  if (!pinned.blobDesign) return pinned;
  return { ...pinned, blobDesign: resolveDesign(blob, pinned.blobDesign) };
}
