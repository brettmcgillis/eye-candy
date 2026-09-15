/* eslint-disable no-bitwise */
export function hashSeed(seed) {
  const text = String(seed);
  let h = 2166136261;

  for (let i = 0; i < text.length; i += 1) {
    h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  }

  return h >>> 0;
}

export function createRng(seed) {
  let a = hashSeed(seed);
  let b = Math.imul(a ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  let c = Math.imul(b ^ 0xc2b2ae35, 0x27d4eb2f) >>> 0;
  let d = (a ^ c ^ 0x165667b1) >>> 0;

  const next = () => {
    const t = (((a + b) | 0) + d) | 0;

    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;

    return (t >>> 0) / 4294967296;
  };

  for (let i = 0; i < 12; i += 1) {
    next();
  }

  const rng = () => next();

  rng.range = (min, max) => min + (max - min) * next();
  rng.signed = () => next() * 2 - 1;
  rng.chance = (p) => next() < p;
  rng.gauss = () => {
    const u = Math.max(next(), 1e-9);

    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * next());
  };
  rng.fork = (salt) => createRng(`${seed}:${salt}`);

  return rng;
}
