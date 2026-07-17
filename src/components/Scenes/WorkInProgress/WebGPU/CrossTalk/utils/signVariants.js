import { textureFile } from '../../../../../../utils/appUtils';

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

const HASH_MODULUS = 2147483647;

// Stable per-id hash (not Math.random), same technique as CloudField's
// hashForId — deterministic so every tab computes the same result for the
// same window id, unlike Math.random() which would disagree across tabs.
function hashForId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % HASH_MODULUS;
  }
  return hash;
}

// Six independent per-window picks (hash(id) % 6) collide far more than
// intuition expects — with 6 windows open, the odds of *some* repeat are
// ~98.5% (the birthday paradox: 1 - 6!/6^6), so "3 tabs got the same sign"
// was the hash working exactly as designed, not a bug. Assigning variants
// as a group instead — sort the alive windows by their hash (a
// deterministic shuffle every tab computes identically, since they all see
// the same window list) and round-robin through SIGN_VARIANTS by rank —
// guarantees no two alive windows share a variant as long as there are at
// most 6 of them; a 7th window necessarily reuses one, same as a 7th guest
// can't get a unique slice from a 6-slice pie.
export function assignSignVariants(windows) {
  const shuffled = [...windows].sort(
    (a, b) => hashForId(a.id) - hashForId(b.id)
  );
  const map = new Map();
  shuffled.forEach((win, i) => {
    map.set(win.id, SIGN_VARIANTS[i % SIGN_VARIANTS.length]);
  });
  return map;
}
