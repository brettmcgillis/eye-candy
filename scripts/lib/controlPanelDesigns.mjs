import { readFileSync } from 'node:fs';
import path from 'node:path';

import { REPO_ROOT } from './loadModules.mjs';

export const DESIGNS_DIR = path.join(
  REPO_ROOT,
  'src/modules/controlPanel/designs'
);
export function withResolvedDesign(panel, roll) {
  const value = roll.pinned.panelDesign ?? roll.base.panelDesign;
  if (!value) return roll;
  const design = panel.isDesignCode(value)
    ? panel.decodeDesign(value)
    : panel.normalizeDesign(
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
      panelDesign: panel.encodeDesign(design),
    },
  };
}
