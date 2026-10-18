/* eslint-disable no-bitwise */
import { extmod } from '../../lattice';

export const NUMLAYERS = 10;

export function fold(symms, ijk) {
  let [i, j, k] = ijk;
  for (let n = 0; n < 3; n += 1) {
    switch (symms[n]) {
      case 0:
        if (j < k) [j, k] = [k, j];
        break;
      case 1:
        if (j > k) [j, k] = [k, j];
        break;
      case 2:
        if (i < k) [i, k] = [k, i];
        break;
      case 3:
        if (i > k) [i, k] = [k, i];
        break;
      case 4:
        if (i < j) [i, j] = [j, i];
        break;
      case 5:
        if (i > j) [i, j] = [j, i];
        break;
      default:
    }
  }
  return [i, j, k];
}

export default function createPerlinGrid({ J, noise, rng }) {
  const ns = [
    rng.randomFloatRange(0.008, 0.022),
    0,
    rng.randomFloatRange(0.008, 0.022),
  ];
  const ns2 = [
    rng.randomFloatRange(0.008, 0.025),
    rng.randomFloatRange(0.008, 0.032),
    rng.randomFloatRange(0.008, 0.025),
  ];
  const nsi = ns2[0] / 0.75;
  const nsj = ns2[1] / 0.75;
  const nsk = ns2[2] / 0.75;
  const hole = rng.randomIntRangeIncl(5, 9);
  const symm = rng.randomIntExcl(10);
  let symm2;
  do {
    symm2 = rng.randomIntExcl(12);
  } while (symm2 === symm);
  let symm3;
  do {
    symm3 = rng.randomIntExcl(16);
  } while (symm3 === symm2);
  const tilted = rng.roll() < 0.5;
  rng.randomIntExcl(2);
  const layers = [];
  const ts = [];
  const blocked = [];
  const blockedSize = [];
  for (let t = 0; t <= NUMLAYERS; t += 1) {
    const cut =
      rng.roll() < 0.3
        ? [false, false, false]
        : [rng.roll() < 0.15, rng.roll() < 0.15, rng.roll() < 0.15];
    const isBlocked = cut[0] || cut[1] || cut[2];
    layers[t] = rng.roll() < 1.6;
    ts[t] = isBlocked
      ? rng.randomFloatRange(0.05, 0.05)
      : rng.randomFloatRange(0.01, 0.016);
    blocked[t] = cut;
    blockedSize[t] = [
      rng.randomIntRangeIncl(2, 6),
      rng.randomIntRangeIncl(2, 6),
      rng.randomIntRangeIncl(2, 6),
    ];
  }
  const symms = [symm, symm2, symm3];

  return (pi, pj, pk) => {
    const [i, j, k] = fold(symms, [pi, pj, pk]);
    let d = i;
    let c = j;
    let m = k;
    if (
      tilted &&
      !((Math.floor(i / 16) + Math.floor(k / 16) + Math.floor(j / 16)) & 1)
    ) {
      d = j;
      c = i;
    }
    if (
      tilted &&
      !((Math.floor(i / 24) + Math.floor(k / 24) + Math.floor(j / 24)) & 1)
    ) {
      const t = d;
      d = k;
      m = t;
    }
    const f = nsi * i;
    const g = nsj * j;
    const p = nsk * k;
    const u = Math.max(
      Math.min(noise(ns[0] * i - 25, ns[2] * k + 23) - 0.2, 1),
      0
    );
    const R =
      u * (0.5 + 0.5 * Math.cos((j / J) * Math.PI)) +
      (1 - u) *
        noise(noise(f, g, p + 15), noise(f, g + 7, p), noise(f - 31, g, p));
    const layer = Math.floor((J / 2.5) * (R - 0.05));
    const label = extmod(layer, NUMLAYERS);
    const w = hole + Math.floor(-3 + 6 * noise(0.085 * j));
    if (noise(0.035 * d + 117, 0.085 * c - 37, 0.035 * m + 39) < 0.35) {
      const half = Math.floor(w / 2);
      const hi = extmod(d + half, w);
      const hk = extmod(m + half, w);
      if (hi < w - 3 && hk < w - 3) return NUMLAYERS;
      if (hi < w - 2 && hk < w - 2) return -1;
      if (hi === w - 1 || hk === w - 1) return -1;
    }
    const cut = blocked[label];
    const size = blockedSize[label];
    if (
      (cut[0] && extmod(d, size[0]) < 2) ||
      (cut[2] && extmod(m, size[2]) < 2) ||
      (cut[1] && extmod(c, size[1]) < 2)
    ) {
      return -1;
    }
    if (!layers[label]) return -1;
    return Math.abs((2.5 * layer) / J + 0.5 / NUMLAYERS - R) < ts[label]
      ? label
      : -1;
  };
}
