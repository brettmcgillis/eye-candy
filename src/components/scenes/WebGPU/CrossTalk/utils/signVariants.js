import { textureFile } from '@utils/appUtils';

import { assignVariants } from './variantAssignment';

// Six real road-sign images (public/textures/crossTalk/) rather than a
// hand-built polygon — the colored plate, border, and drop-shadow are
// exactly the kind of visual detail that's cheap as a texture and painful
// to vector-recreate. Source photos/renders came with assorted padding and
// (sign3) a "W1-6R" caption baked in below the sign — each was trimmed to
// its actual sign content during asset prep, sign4's source also rotated
// since it pointed up, so every variant shares the same "angleDeg 0 =
// right" convention GravityArrow's rotation uses. `aspect` (width/height)
// is the *trimmed* image's real aspect ratio, precomputed so a variant
// sizes to a consistent width without stretching.
export const SIGN_VARIANTS = [
  { url: textureFile('crossTalk/sign1.png'), aspect: 512 / 175 },
  { url: textureFile('crossTalk/sign2.png'), aspect: 512 / 178 },
  { url: textureFile('crossTalk/sign3.png'), aspect: 512 / 256 },
  { url: textureFile('crossTalk/sign4.png'), aspect: 1 },
  { url: textureFile('crossTalk/sign5.png'), aspect: 1 },
  { url: textureFile('crossTalk/sign6.png'), aspect: 512 / 387 },
];

export const SIGN_URLS = SIGN_VARIANTS.map((v) => v.url);

// Assigned as a group, not independently per window — see
// variantAssignment.js for why (independent hash-per-window picks collide
// far more than intuition expects).
export function assignSignVariants(windows) {
  return assignVariants(windows, SIGN_VARIANTS);
}
