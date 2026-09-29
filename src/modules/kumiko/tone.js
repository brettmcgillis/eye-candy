import { hashSeed } from '@modules/flora';

const hash01 = (text) => (hashSeed(text) % 100003) / 100003;

// Mirrored wrap: a shifted or repeated coordinate folds back through the
// gradient instead of jumping from its last stop to its first.
export const mirrorWrap = (t) => {
  const m = ((t % 2) + 2) % 2;
  return m > 1 ? 2 - m : m;
};

// The unshifted 0-1 palette coordinate of a point in a leaf, for every
// colouring that a cell decides on its own. `size` and `random` belong to
// the item, so the caller supplies them.
export function createToner(config, { height, poolIndex, width, zoneCount }) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.hypot(cx, cy);
  const levels = Math.max(1, config.subdivide);
  const pools = Math.max(1, poolIndex.size - 1);
  const zones = Math.max(1, zoneCount - 1);

  return ([x, y], leaf, { random = 0.5, size = 0.5 } = {}) => {
    switch (config.colorBy) {
      case 'zone':
        return leaf.zone / zones;
      case 'level':
        return leaf.level / levels;
      case 'cell':
        return hash01(
          `${config.seed}:cell:${Math.round(leaf.center[0])},${Math.round(leaf.center[1])},${leaf.level}`
        );
      case 'x':
        return x / width;
      case 'y':
        return y / height;
      case 'radial':
        return Math.hypot(x - cx, y - cy) / radius;
      case 'image':
      case 'source':
        return leaf.stats?.luma ?? 0.5;
      case 'size':
        return size;
      case 'random':
        return random;
      default:
        return (poolIndex.get(leaf.pattern) ?? 0) / pools;
    }
  };
}

// A 0-1 palette coordinate for every opening, piece and tile of an exact
// panel. Renderers map it through the palette; the kernel never sees a
// colour.
export default function applyTones(panel, config, { poolIndex, zoneCount }) {
  const toner = createToner(config, {
    height: panel.height,
    poolIndex,
    width: panel.width,
    zoneCount,
  });
  const logAreas = panel.openings.map((o) => Math.log(o.area + 1));
  const minA = Math.min(...logAreas);
  const spanA = Math.max(...logAreas) - minA || 1;

  const tone = (item, index) =>
    mirrorWrap(
      toner(item.center, panel.leaves[item.leaf], {
        random: hash01(`${config.seed}:tone:${item.kind}:${index}`),
        size:
          item.area == null ? 0.5 : (Math.log(item.area + 1) - minA) / spanA,
      }) *
        config.paletteRepeat +
        config.paletteShift
    );

  panel.openings.forEach((o, i) => Object.assign(o, { t: tone(o, i) }));
  panel.pieces.forEach((p, i) => Object.assign(p, { t: tone(p, i) }));
  panel.tiles.forEach((tile, i) =>
    Object.assign(tile, {
      t: tile.opening >= 0 ? panel.openings[tile.opening].t : tone(tile, i),
    })
  );
  return panel;
}
