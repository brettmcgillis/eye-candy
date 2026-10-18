import { extmod } from '../../lattice';

export const NUMLAYERS = 10;

export function rollField(hl) {
  const ns = [hl.random(0.004, 0.012), 0, hl.random(0.004, 0.012)];
  const ns2 = [
    hl.random(0.001, 0.015),
    hl.random(0.002, 0.032),
    hl.random(0.001, 0.015),
  ];
  let layers;
  let ts;
  let blocked;
  let blockedSize;
  let visible;
  let nb;
  do {
    layers = [];
    ts = [];
    blocked = [];
    blockedSize = [];
    visible = 0;
    nb = 0;
    for (let i = 0; i < NUMLAYERS; i += 1) {
      layers[i] = hl.random() < 0.6;
      visible += layers[i] ? 1 : 0;
      ts[i] = hl.random(0.008, 0.02);
      blocked[i] =
        hl.random() < 0.25
          ? [false, false, false]
          : [hl.random() < 0.25, hl.random() < 0.25, hl.random() < 0.25];
      const isBlocked = blocked[i].some(Boolean);
      if (layers[i] && isBlocked) nb += 1;
      blockedSize[i] = [
        hl.randomInt(2, 9),
        hl.randomInt(2, 9),
        hl.randomInt(2, 9),
      ];
      if (isBlocked) ts[i] = hl.random(0.01, 0.036);
    }
  } while (visible < 4 || visible > 8 || nb > visible / 2 + 1);
  return { blocked, blockedSize, layers, ns, ns2, ts };
}

export function createField({ dims, fJ, noise, roll }) {
  const { J } = dims;
  const { blocked, blockedSize, layers, ns, ns2, ts } = roll;
  const [nsi, nsj, nsk] = ns2;

  return (i, j, k) => {
    const elev = Math.max(
      Math.min(noise(ns[0] * i - 25, ns[2] * k + 23) - 0.2, 0.4),
      0
    );
    const v =
      elev * (0.5 + 0.5 * Math.cos((j / fJ) * Math.PI)) +
      (1 - elev) *
        noise(
          noise(nsi * i, nsj * j, nsk * k + 15),
          noise(nsi * i, nsj * j + 7, nsk * k),
          noise(nsi * i - 31, nsj * j, nsk * k)
        );
    const layer = Math.floor((J / 2.5) * (v - 0.05));
    const label = extmod(layer, NUMLAYERS);
    const cut = blocked[label];
    const size = blockedSize[label];
    if (
      (cut[0] && extmod(i, size[0]) < 2) ||
      (cut[2] && extmod(k, size[2]) < 2) ||
      (cut[1] && extmod(j, size[1]) < 2)
    ) {
      return -1;
    }
    if (!layers[label]) return -1;
    return Math.abs((layer * 2.5) / J + 0.5 / NUMLAYERS - v) < ts[label]
      ? label
      : -1;
  };
}
