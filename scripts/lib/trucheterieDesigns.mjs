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

// `blob` is the loaded @modules/trucheterieBlob barrel. `rotation` is the
// saved file's grid rotation (degrees), or null for a code.
function loadDesign(blob, value) {
  if (blob.isDesignCode(value)) return { code: value, rotation: null };
  const file = designFile(value);
  if (!existsSync(file)) {
    throw new Error(
      `design "${value}" is not a design code, a .json file or a saved design in ${path.relative(REPO_ROOT, DESIGNS_DIR)}.`
    );
  }
  const json = JSON.parse(readFileSync(file, 'utf8'));
  const design = blob.designFromJson(json);
  if (!design) {
    throw new Error(
      `${path.relative(REPO_ROOT, file)} is not a valid design (out-of-range cells, or cells overlapping where arcs reach).`
    );
  }
  const rotation = Number(json.rotation);
  return {
    code: blob.encodeDesign(design),
    rotation: Number.isFinite(rotation) ? rotation : null,
  };
}

export function resolveDesign(blob, value) {
  return value ? loadDesign(blob, value).code : '';
}

// A saved design's rotation is pinned unless the caller typed planeRotation.
export function withResolvedDesign(blob, pinned) {
  if (!pinned.blobDesign) return pinned;
  const { code, rotation } = loadDesign(blob, pinned.blobDesign);
  const turned =
    rotation !== null && pinned.planeRotation === undefined
      ? { planeRotation: rotation }
      : {};
  return { ...pinned, blobDesign: code, ...turned };
}
