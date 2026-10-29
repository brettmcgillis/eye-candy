import {
  decodeDesign,
  encodeDesign,
  isDesignCode,
  normalizeDesign,
} from '@modules/paperCuts';

import { API, designRequest } from './useSavedDesigns';

export default async function resolveDesign(value) {
  if (!value) return null;
  const design = isDesignCode(value)
    ? decodeDesign(value)
    : normalizeDesign(
        (await designRequest(`${API}/${encodeURIComponent(value)}`)).design
      );
  return { code: encodeDesign(design), rotate: design.rotate };
}
