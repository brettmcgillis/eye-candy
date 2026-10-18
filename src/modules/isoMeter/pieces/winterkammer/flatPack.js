import createPerlinGrid, { NUMLAYERS, fold } from './perlinGrid';

const stripe = (dir, i, j, k) => {
  const axis = [i, j, k][dir];
  return axis % 5 === 1 ? 0 : -1;
};

export default function createFlatPack({ I, J, K, noise, rng }) {
  const hole = rng.roll() < 0.5;
  const lI = I / 4 + rng.randomIntRangeIncl(-4, I / 4 - 4);
  const lK = I === K ? lI : K / 4 + rng.randomIntRangeIncl(-4, K / 4 - 4);
  const uI = I - lI;
  const uK = I === K ? uI : K - lK;
  const dir = rng.randomIntExcl(3);
  const symms = [
    rng.randomIntExcl(6),
    rng.randomIntExcl(9),
    rng.randomIntExcl(12),
  ];
  const rock = createPerlinGrid({ J, noise, rng });

  const value = (pi, pj, pk) => {
    if (noise(0.035 * pi, 0.035 * pj, 0.035 * pk) < 0.45) {
      const r = rock(pi, pj, pk);
      return r === -1 ? -1 : (4 + r) % NUMLAYERS;
    }
    if (
      pi > I / 3 &&
      pi < (2 * I) / 3 &&
      pk > K / 3 &&
      pk < (2 * K) / 3 &&
      pj % 5 < 3
    ) {
      return -1;
    }
    const [i, j, k] = fold(symms, [pi, pj, pk]);
    if (i > lI && i < uI && k > lK && k < uK && j % 5 < 3) return 1;
    return stripe(dir, i, j, k);
  };
  value.hole = hole;
  return value;
}
