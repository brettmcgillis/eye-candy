import { readFileSync } from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './loadModules.mjs';

export const DESIGNS_DIR = path.join(
  REPO_ROOT,
  'src/modules/paperCuts/designs'
);
export function withResolvedDesign(paper, roll) {
  const value = roll.pinned.paperDesign ?? roll.base.paperDesign;
  if (!value) return roll;
  const design = paper.isDesignCode(value)
    ? paper.decodeDesign(value)
    : paper.normalizeDesign(
        JSON.parse(
          readFileSync(
            value.endsWith('.json')
              ? path.resolve(value)
              : path.join(DESIGNS_DIR, `${value}.json`),
            'utf8'
          )
        )
      );
  return {
    ...roll,
    pinned: {
      ...roll.pinned,
      paperDesign: paper.encodeDesign(design),
      rotate: roll.pinned.rotate ?? design.rotate,
    },
  };
}
