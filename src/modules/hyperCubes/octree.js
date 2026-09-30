/* eslint-disable no-bitwise */
import { pcg3df } from './hash';

const HALF = [0.5, 0.5, 0.5];

// The glass reference's sparse octree, walked whole instead of along a ray.
// Cells are hashed at their centre in the unit domain, so the reference's
// tree survives a stretched domain unchanged.
export default function buildOctree(config) {
  const {
    octreeHoleChance: holeChance,
    octreeLeafChance: leafChance,
    octreeLevels: levels,
    octreeSeed: seed,
  } = config;
  let leaves = 0;

  function walk(center, size, level) {
    const dice = pcg3df(center.map((c) => seed + c));
    if (dice[1] < holeChance) {
      leaves += 1;
      return { leaf: { hole: true, rolls: [1, dice[2], 0, 0] } };
    }
    if (dice[0] < leafChance || level === levels - 1) {
      const vary = pcg3df(dice);
      leaves += 1;
      return {
        leaf: { hole: false, rolls: [vary[2], dice[2], vary[0], vary[1]] },
      };
    }
    // eslint-disable-next-line no-use-before-define
    return split(center, size, level + 1);
  }

  function split(center, size, level) {
    const quarter = size / 4;
    return {
      children: Array.from({ length: 8 }, (_, octant) =>
        walk(
          center.map((c, a) => c + ((octant >> a) & 1 ? quarter : -quarter)),
          size / 2,
          level
        )
      ),
      u: HALF,
    };
  }

  const root = split([0, 0, 0], 2, 0);
  return { leaves, root };
}
