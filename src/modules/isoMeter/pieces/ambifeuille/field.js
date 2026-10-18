import { extmod } from '../../lattice';
import { NO_HIT } from './inclusions';

export const NUMLAYERS = 10;
export const OFFSETFACTOR = 10;

export function rollField(hl) {
  const ns = [hl.random(0.008, 0.022), 0, hl.random(0.008, 0.022)];
  const ns2 = [
    hl.random(0.008, 0.025),
    hl.random(0.008, 0.025),
    hl.random(0.008, 0.025),
  ];
  const hole = hl.randomInt(5, 9);
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
    visible = -1;
    nb = 0;
    for (let i = 0; i < NUMLAYERS + 1; i += 1) {
      layers[i] = hl.randomBool(0.6);
      visible += layers[i] ? 1 : 0;
      ts[i] = hl.random(0.007, 0.012);
      blocked[i] = hl.randomBool(0.65)
        ? [false, false, false]
        : [hl.randomBool(0.28), hl.randomBool(0.28), hl.randomBool(0.28)];
      const isBlocked = blocked[i].some(Boolean);
      if (isBlocked) nb += 1;
      blockedSize[i] = [
        3 + hl.randomInt(3),
        3 + hl.randomInt(3),
        3 + hl.randomInt(3),
      ];
      if (isBlocked) ts[i] = 0.2;
    }
  } while (visible < 4 || visible > 8 || nb > visible / 2 + 1);
  layers[NUMLAYERS] = true;
  layers[NUMLAYERS + 1] = true;
  return { blocked, blockedSize, hole, layers, ns, ns2, ts };
}

export function createField({ dims, inclusions, noise, params, roll, view }) {
  const { I, J, K } = dims;
  const { blockLayer, JRange } = params;
  const { blocked, blockedSize, hole, layers, ns, ns2, ts } = roll;
  const half = 0.5 / NUMLAYERS;

  return (i, j, k) => {
    const elev = Math.max(
      Math.min(noise(ns[0] * i - 25, ns[2] * k + 23) - 0.3, 1),
      0
    );
    const v =
      elev *
        (0.5 + 0.5 * Math.cos((j / J) * Math.PI)) *
        (0.5 + 0.5 * Math.sin((k / K) * (Math.PI / 4))) *
        (0.5 + 0.5 * Math.sin((i / I) * (Math.PI / 4))) +
      (1 - elev) *
        noise(
          noise(ns2[0] * i, ns2[1] * j, ns2[2] * k + 15),
          noise(ns2[1] * i, ns2[2] * j + 7, ns2[0] * k),
          noise(ns2[2] * i - 31, ns2[0] * j, ns2[1] * k)
        );
    const layer = Math.floor(JRange * (v - half));
    const centerValue = layer / JRange + half;
    const label = extmod(layer, NUMLAYERS);

    const included = inclusions.value(i, j, k);
    if (included > NO_HIT) return included;

    const lhole = hole + Math.floor(-3 + 6 * noise(0.085 * j));
    if (noise(0.035 * i + 117, 0.085 * j - 37, 0.035 * k + 39) < blockLayer) {
      const hi = extmod(i + Math.floor(lhole / 2), lhole);
      const hk = extmod(k + Math.floor(lhole / 2), lhole);
      if (hi < lhole - 3 && hk < lhole - 3) return NUMLAYERS;
      if (hi < lhole - 2 && hk < lhole - 2) return -1;
      if (hi === lhole - 1 || hk === lhole - 1) return -1;
    }
    const cut = blocked[label];
    const size = blockedSize[label];
    if (
      ((cut[0] && extmod(i, size[0]) < 1) ||
        (cut[2] && extmod(k, size[2]) < 1) ||
        (cut[1] && extmod(j, size[1]) < 1)) &&
      noise(0.03 * i - 37, 0.03 * j + 87, 0.03 * k - 113) < 0.62
    ) {
      return -1;
    }
    if (!view.drawHidden && !layers[label]) return -1;
    const step = 6 * (label % 4);
    if (
      layer !== NUMLAYERS &&
      (i > I + view.iOffset * OFFSETFACTOR - step ||
        k > K + view.kOffset * OFFSETFACTOR - step)
    ) {
      return -1;
    }
    return Math.abs(v - centerValue) < ts[label] ? label : -1;
  };
}
