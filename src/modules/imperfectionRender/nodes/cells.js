import { If, floor, fract, mix, select, vec2 } from 'three/tsl';

export const BLOCK_ENGINES = ['grid', 'quadtree', 'rect'];
export const MAX_DEPTH = 5;

// The cell of a block layer a pixel falls in. Every engine starts from the
// layer's jittered grid cell (the reference's blockGrid, exactly, at scale 1);
// quadtree and rect then split it per pixel, fractalPixelate-style, so no
// buffer ever holds the partition. Values that a split reads are pinned with
// toVar before it writes, since TSL builds an expression where it is first
// used, not where it is declared.
export default function createCells(u, c, zones, { engine = 'grid' } = {}) {
  const { hash12, zone } = c;
  const { blockDensity } = zones;

  return function partition(uv, layerCell, offs, seed) {
    const cell = layerCell.mul(u.blockScale);
    const g = uv.add(offs).div(cell);
    const root = floor(g);
    if (engine === 'grid') {
      return {
        f: fract(g),
        id: root,
        origin: root.mul(cell).sub(offs),
        size: cell,
      };
    }

    const f = fract(g).toVar();
    const size = vec2(cell).toVar();
    const origin = root.mul(cell).sub(offs).toVar();
    const id = vec2(root).toVar();
    for (let level = 0; level < MAX_DEPTH; level += 1) {
      const salt = vec2(level * 19.13 + 3.7, level * 7.31 + 1.1);
      const dens = blockDensity(zone(origin.add(size.mul(0.5))));
      const chance = mix(
        u.blockSplit,
        u.blockSplit.mul(dens).mul(2.5),
        u.blockFocus
      );
      const roll = hash12(id.add(salt).add(seed)).toVar();
      If(u.blockDepth.greaterThan(level).and(roll.lessThan(chance)), () => {
        if (engine === 'quadtree') {
          const child = floor(f.mul(2)).toVar();
          const half = size.mul(0.5).toVar();
          f.assign(fract(f.mul(2)));
          size.assign(half);
          origin.addAssign(child.mul(half));
          id.assign(id.mul(2).add(child));
          return;
        }
        const alongX = size.x.greaterThanEqual(size.y).toVar();
        const cut = hash12(id.add(salt.yx).add(seed.mul(1.3)))
          .sub(0.5)
          .mul(u.blockCut.mul(2))
          .add(0.5)
          .toVar();
        const fa = select(alongX, f.x, f.y);
        const low = fa.lessThan(cut).toVar();
        const local = select(
          low,
          fa.div(cut),
          fa.sub(cut).div(cut.oneMinus())
        ).toVar();
        const part = select(low, cut, cut.oneMinus()).toVar();
        const shift = select(low, 0, cut).toVar();
        const side = select(low, 0, 1).toVar();
        const axis = select(alongX, vec2(1, 0), vec2(0, 1)).toVar();
        const keep = axis.oneMinus();
        origin.addAssign(axis.mul(shift).mul(size));
        size.assign(size.mul(keep.add(axis.mul(part))));
        f.assign(f.mul(keep).add(axis.mul(local)));
        id.assign(id.mul(2).add(axis.mul(side)));
      });
    }
    return { f, id, origin, size };
  };
}
