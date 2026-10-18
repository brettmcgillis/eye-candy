export const FACTOR_COLLECTION = [13, 17, 23, 29, 37, 47, 59, 67];
export const WARP_LEVELS = [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 4, 4, 8, 16];

export function createWarps({ I, J, K }, factors, scale) {
  return [
    (i, j, k) => (i % I > k % K ? [i, j, k] : [i, J - j - 1, k]),
    (i, j, k) => (i % I > k % K ? [i, j, k] : [K - 1 - k, j, I - 1 - i]),
    (i, j, k) => {
      const mf = Math.floor(factors[0] * scale);
      const mf2 = Math.floor(factors[1] * scale);
      if (mf > mf2) {
        return [
          (i + Math.floor(k / mf) * mf2) % I,
          j + ((Math.floor((i % I) / mf2) * mf) % (J / 2)),
          k,
        ];
      }
      return [
        i,
        j + ((Math.floor((i % I) / mf2) * mf) % (J / 2)),
        (k + Math.floor(i / mf) * mf2) % K,
      ];
    },
    (i, j, k) =>
      i % factors[0] < 5 ? [i + (j % factors[1]), j, k] : [i, j, k],
    (i, j, k) =>
      k % factors[0] < 5 ? [i, j, k + (j % factors[1])] : [i, j, k],
    (i, j, k) => (j % J > J / 2 ? [k, j, i] : [i, j, k]),
    (i, j, k) => (k % K > K / 2 ? [j, i, k] : [i, j, k]),
    (i, j, k) => (i % I > I / 2 ? [i, k, j] : [i, j, k]),
    (i, j, k) => (j % factors[0] < 8 ? [k, j, i] : [i, j, k]),
    (i, j, k) => (k % K < K / 2 ? [j, i, k] : [i, j, k]),
    (i, j, k) => (i % I < I / 2 ? [i, k, j] : [i, j, k]),
    (i, j, k) => [k, i, j],
    (i, j, k) => [j, k, i],
  ];
}

export function rollWarpChain(hl, count) {
  const ids = Array.from({ length: count }, (_, n) => n);
  const chain = [hl.randomElement(ids)];
  for (let w = 1; w < 16; w += 1) {
    let next;
    do {
      next = hl.randomElement(ids);
    } while (next === chain[w - 1]);
    chain.push(next);
  }
  return chain;
}
