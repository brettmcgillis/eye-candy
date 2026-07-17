const HASH_MODULUS = 2147483647;

// Stable per-id hash (not Math.random), same technique as CloudField's
// hashForId — deterministic so every tab computes the same result for the
// same window id, unlike Math.random() which would disagree across tabs.
export function hashForId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % HASH_MODULUS;
  }
  return hash;
}

// Six independent per-window picks (hash(id) % variants.length) collide far
// more than intuition expects — with 6 windows and 6 variants, the odds of
// *some* repeat are ~98.5% (the birthday paradox: 1 - 6!/6^6). Assigning as
// a group instead — sort the alive windows by their hash (a deterministic
// shuffle every tab computes identically, since they all see the same
// window list) and round-robin through `variants` by rank — guarantees no
// two alive windows share a variant as long as there are at most
// `variants.length` of them; beyond that a variant is necessarily reused,
// same as a 7th guest can't get a unique slice from a 6-slice pie.
export function assignVariants(windows, variants) {
  const shuffled = [...windows].sort(
    (a, b) => hashForId(a.id) - hashForId(b.id)
  );
  const map = new Map();
  shuffled.forEach((win, i) => {
    map.set(win.id, variants[i % variants.length]);
  });
  return map;
}
